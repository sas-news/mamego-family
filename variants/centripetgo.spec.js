// CENTRIPETGO — 求心碁: 着手ごと全石が盤の中心へ1マス引き寄せられる
const K = require('../gen_kit.js');
module.exports = {
    file: 'centripetgo.html',
    en: 'CENTRIPETGO',
    jp: '求心碁',
    prefix: 'centripetgo',
    desc: '盤の中心が重力源。着手ごとに全石が1マス中心へ引き寄せられる。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('CENTRIPETGO', '求心碁', 'centripetgo'),
        K.params([
            { key: 'pull_dist', label: '引力の強さ', min: 1, max: 3, def: 1, unit: 'マス/手', hint: '1手に引き寄せる距離' },
        ]),
        // 着手ごと、全石が中心方向へ1マス引き寄せられる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 求心ルール: 全石が盤の中心へ近づく (斜め優先、直交で押し込める)
            //             引き寄せ距離は設定で調整 (既定1マス/手)
            {
                const N = BOARD_SIZE, c = Math.floor(N / 2);
                const _steps = Math.max(1, P('pull_dist') || 1);
                for (let _s = 0; _s < _steps; _s++) {
                const pulls = []; // 移動を先に全部決めてから適用 (1手1マス)
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % N, y = Math.floor(i / N);
                    const dx = Math.sign(c - x), dy = Math.sign(c - y);
                    if (dx === 0 && dy === 0) continue;
                    const tries = [[dx, dy], [dx, 0], [0, dy]];
                    for (const [tx2, ty2] of tries) {
                        if (tx2 === 0 && ty2 === 0) continue;
                        const nx = x + tx2, ny = y + ty2;
                        if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;
                        const j = ny * N + nx;
                        if (board[j] === 0) { pulls.push([i, j]); break; }
                    }
                }
                pulls.forEach(([i, j]) => { if (board[j] === 0) { board[j] = board[i]; board[i] = 0; fxSlide(i, j, 380); } });
                if (pulls.length) fxShake(2, 160);
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
        // 中心への引力の描画
        K.CUE_GRID(`            // 求心: 中心に向かう淡い収束線
            {
                const c = (BOARD_SIZE - 1) / 2;
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.15);
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                for (let k = 0; k < 8; k++) {
                    const a = k * Math.PI / 4;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a) * cellSize * (BOARD_SIZE / 2), cy + Math.sin(a) * cellSize * (BOARD_SIZE / 2));
                    ctx.lineTo(cx + Math.cos(a) * cellSize * 0.8, cy + Math.sin(a) * cellSize * 0.8);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '盤の中心に引力がある: 着手ごとに全石が1マスずつ中心へ引き寄せられる。',
            '中心に集まった石は渋滞して留まる。辺の石ほど流される距離が長い。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        const c = Math.floor(BOARD_SIZE / 2);
        board.fill(0);
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('中心へ斜めに引き寄せ', board[3 * BOARD_SIZE + 3] === 1 && board[2 * BOARD_SIZE + 2] === 0);
        board.fill(0);
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('中心の石は動かない', board[c * BOARD_SIZE + c] === 1);
        board.fill(0);
        board[c * BOARD_SIZE + c] = 1;
        board[c * BOARD_SIZE + c + 1] = 2; // 中心の右隣が塞がっている
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('中心が塞がっていれば留まる', board[c * BOARD_SIZE + c] === 1 && board[c * BOARD_SIZE + c + 1] === 2);
    `,
};
