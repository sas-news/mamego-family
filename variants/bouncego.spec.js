// BOUNCEGO — 跳弾碁: 石は斜めに投げ込まれ、壁や石で跳ね返って止まる
const K = require('../gen_kit.js');
module.exports = {
    file: 'bouncego.html',
    en: 'BOUNCEGO',
    jp: '跳弾碁',
    prefix: 'bouncego',
    desc: '石は斜めに投げ込まれ、壁や石に当たると跳ね返り、行き止まりで静止。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('BOUNCEGO', '跳弾碁', 'bouncego'),
        K.params([
            { key: 'step_scale', label: '弾の射程 (盤サイズ倍数)', min: 1, max: 8, def: 4, hint: '跳ね返りの最大ステップ数 = 盤サイズ×この値' },
        ]),
        // 着手石は盤中心方向への斜め初速で飛び、壁・石で跳ね返りながら進んで静止する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 跳弾ルール: 着手石は中心方向への斜めの初速で投げ込まれ、
            //             壁や石に当たると反射しながら進み、進めなくなった点で静止する。
            {
                const N = BOARD_SIZE, c = Math.floor(N / 2);
                const sx = move.cells[0].x, sy = move.cells[0].y;
                board[sy * N + sx] = 0; // 投げ込みのため起点を空ける
                let dx = sx < c ? 1 : (sx > c ? -1 : 1);
                let dy = sy < c ? 1 : (sy > c ? -1 : 1);
                let rx = sx, ry = sy, steps = 0;
                const path = [[sx, sy]]; // 弾道 (演出再生用)
                while (steps++ < (P('step_scale') || 4) * N) {
                    const px = rx + dx, py = ry + dy;
                    const blX = px < 0 || px >= N || board[py * N + px] !== 0;
                    const blY = py < 0 || py >= N || board[py * N + px] !== 0;
                    if (blX) dx = -dx;
                    if (blY) dy = -dy;
                    const nx = rx + dx, ny = ry + dy;
                    if (nx < 0 || nx >= N || ny < 0 || ny >= N || board[ny * N + nx] !== 0) break;
                    rx = nx; ry = ny;
                    path.push([rx, ry]);
                }
                board[ry * N + rx] = player;
                // 弾道をそのまま再生するワンショット演出 (石ゴーストが跳ね返りながら進む)
                if (path.length > 1) {
                    const t0 = fxNow(), seg = 80;
                    let tracer;
                    tracer = (ctx2, now, pad, cs) => {
                        const total = path.length - 1;
                        const t = (now - t0) / seg;
                        if (t >= total) {
                            const k = fxAmbients.indexOf(tracer);
                            if (k >= 0) fxAmbients.splice(k, 1);
                            return;
                        }
                        const k0 = Math.floor(t), f = t - k0;
                        const gx = pad + (path[k0][0] + (path[k0 + 1][0] - path[k0][0]) * f) * cs;
                        const gy = pad + (path[k0][1] + (path[k0 + 1][1] - path[k0][1]) * f) * cs;
                        const fill2 = player === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                        const R = cs * 0.34;
                        ctx2.save();
                        ctx2.globalAlpha = 0.85;
                        const g2 = ctx2.createRadialGradient(gx - R * 0.3, gy - R * 0.35, R * 0.08, gx, gy, R);
                        g2.addColorStop(0, shiftColor(fill2, 0.5));
                        g2.addColorStop(1, shiftColor(fill2, -0.2));
                        ctx2.fillStyle = g2;
                        ctx2.beginPath();
                        ctx2.arc(gx, gy, R, 0, Math.PI * 2);
                        ctx2.fill();
                        ctx2.restore();
                    };
                    fxAmbient(tracer);
                }
                // 変動後処理: 呼吸のなくなった連を両色について除去
                for (const pl of [1, 2]) {
                    const dead = getCapturedStones(board, pl);
                    if (dead.length) {
                        dead.forEach(i => { board[i] = 0; });
                        captures[pl === 1 ? 2 : 1] += dead.length;
                    }
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        // 跳弾の描画: 弾道の残像
        K.CUE_GRID(`            // 跳弾: 斜めの点線 (バンクショットの盤)
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.12);
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.setLineDash([cellSize * 0.2, cellSize * 0.25]);
                const w = (BOARD_SIZE - 1) * cellSize;
                for (let k = 0; k < BOARD_SIZE; k += 4) {
                    ctx.beginPath();
                    ctx.moveTo(padding - cellSize * 0.4, padding + k * cellSize);
                    ctx.lineTo(padding + k * cellSize, padding - cellSize * 0.4);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(padding + w + cellSize * 0.4, padding + k * cellSize);
                    ctx.lineTo(padding + w - k * cellSize, padding - cellSize * 0.4);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '石は盤の中心方向への斜めの初速で投げ込まれる。盤端や石に当たると角度を変えて跳ね返る。',
            '進めなくなった点で静止する。狙い所に落とすには跳ね返りの読みが要る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        let cnt = 0, pos = -1;
        for (let i = 0; i < board.length; i++) if (board[i] === 1) { cnt++; pos = i; }
        assert('投げ込んだ石は盤上のどこかに止まる', cnt === 1 && pos >= 0);
        assert('跳ね返って起点には留まらない', pos !== 0);
        // 障害物を並べると手前で止まる
        board.fill(0);
        board[4 * BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('石に当たっても盤上に止まる', (() => { let n = 0; for (const v of board) if (v === 1) n++; return n === 1; })());
    `,
};
