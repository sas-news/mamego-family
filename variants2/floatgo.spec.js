// FLOATGO — 浮遊碁: 宙に浮いた連はまとまって上へ浮かび上がる
const K = require('../gen_kit.js');
module.exports = {
    file: 'floatgo.html',
    en: 'FLOATGO',
    jp: '浮遊碁',
    prefix: 'floatgo',
    desc: '連ごと上へ浮く浮力の盤。天井で連は寄せ集まり、呼吸点が歪む。',
    kind: 'stone',
    spec: [
        ...K.rb('FLOATGO', '浮遊碁', 'floatgo'),
        // 3手ごと、上に行き場のある連がまるごと1マス浮上
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 浮遊ルール: 3手ごとに、各連について全セルの真上が空(または連内)なら連ごと1マス浮く
            if (history.length % 3 === 0) {
                const N = BOARD_SIZE;
                const seen = new Uint8Array(N * N);
                for (let s = 0; s < board.length; s++) {
                    if (seen[s] || (board[s] !== 1 && board[s] !== 2)) continue;
                    const g = [];
                    const q = [s];
                    seen[s] = 1;
                    while (q.length) {
                        const c = q.pop();
                        g.push(c);
                        getNeighbors(c).forEach(n => {
                            if (!seen[n] && board[n] === board[s]) { seen[n] = 1; q.push(n); }
                        });
                    }
                    const inset = new Set(g);
                    let ok = true;
                    for (const i of g) {
                        if (i < N) { ok = false; break; } // 最上段
                        const a = i - N;
                        if (board[a] !== 0 && !inset.has(a)) { ok = false; break; }
                    }
                    if (!ok) continue;
                    g.sort((a, b) => a - b);
                    for (const i of g) {
                        board[i - N] = board[i]; board[i] = 0;
                        fxSlide(i, i - N, 460); // 浮き上がる軌跡
                    }
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
        // 浮遊感: 上向きの淡い矢印
        K.CUE_GRID(`            // 浮力: 場所ごとに上向きの淡い気泡
            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.12);
                for (let y = 1; y < BOARD_SIZE; y += 3) for (let x = (y % 2); x < BOARD_SIZE; x += 4) {
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize + cellSize * 0.3, padding + y * cellSize, cellSize * 0.08, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤には浮力がある: 連の上が空いていれば3手ごとに連ごと1マス浮かび上がる。',
            '天井や他の石に頭を押さえられた連は浮けない。石を置く位置も置く時も流される。',
        ])],
        // 浮力: 盤全体をゆっくり昇る泡 (常時)
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(170,215,255,0.35)';
            ctx2.lineWidth = Math.max(1, cs * 0.035);
            for (let k = 0; k < 14; k++) {
                const t = ((now / 3200) + k * 0.13) % 1;
                const px = ((k * 61.7) % 1) * w;
                const py = w * (1 - t);
                ctx2.globalAlpha = 0.5 * Math.sin(t * Math.PI);
                ctx2.beginPath();
                ctx2.arc(px + Math.sin(now / 900 + k) * cs * 0.15, py,
                    cs * (0.05 + (k % 3) * 0.025), 0, Math.PI * 2);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0); history.length = 2;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 3手目で浮上
        assert('宙石が上へ浮く', board[3 * BOARD_SIZE + 4] === 1 && board[4 * BOARD_SIZE + 4] === 0);
        history.length = 2;
        executeMove({ cells: [{ x: 0, y: 8 }] }, 2);
        assert('次の手でもさらに浮く', board[2 * BOARD_SIZE + 4] === 1);
        board.fill(0); history.length = 2;
        board[0 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('天井の石は浮けない', board[0 * BOARD_SIZE + 5] === 1);
        board.fill(0); history.length = 2;
        // 天井に接した敵の柱で頭を押さえられた連は浮けない
        for (let y = 0; y <= 4; y++) board[y * BOARD_SIZE + 3] = 2;
        board[5 * BOARD_SIZE + 3] = 1;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('頭を押さえられた連は浮けない', board[5 * BOARD_SIZE + 3] === 1);
    `,
};
