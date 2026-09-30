// FLOCKGO — 群行碁: 連はまとまって移動する。3手ごと全連が中心へ1マス進む
const K = require('../gen_kit.js');
module.exports = {
    file: 'flockgo.html',
    en: 'FLOCKGO',
    jp: '群行碁',
    prefix: 'flockgo',
    desc: '連は鳥の群れ。3手ごと全連がまるごと1マス、盤の中心へ向かって進む。',
    kind: 'stone',
    spec: [
        ...K.rb('FLOCKGO', '群行碁', 'flockgo'),
        // 3手ごと、全連が重心の向きで中心へ1マスまとまって進む
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 群行ルール: 3手ごとに各連が重心を計算し、中心方向へ1マスまるごと平行移動する。
            //             行き先が塞がっていたらその連は動けない。
            if (history.length % 3 === 0) {
                const N = BOARD_SIZE, c = Math.floor(N / 2);
                const seen = new Uint8Array(N * N);
                const groups = [];
                for (let s = 0; s < board.length; s++) {
                    if (seen[s] || (board[s] !== 1 && board[s] !== 2)) continue;
                    const g = [];
                    const q = [s];
                    seen[s] = 1;
                    while (q.length) {
                        const cur = q.pop();
                        g.push(cur);
                        getNeighbors(cur).forEach(n => {
                            if (!seen[n] && board[n] === board[s]) { seen[n] = 1; q.push(n); }
                        });
                    }
                    groups.push(g);
                }
                groups.sort((a, b) => b.length - a.length); // 大きい群れから動く
                for (const g of groups) {
                    const col = board[g[0]];
                    let sx = 0, sy = 0;
                    for (const i of g) { sx += i % N; sy += Math.floor(i / N); }
                    const dx = Math.sign(c - sx / g.length), dy = Math.sign(c - sy / g.length);
                    if (dx === 0 && dy === 0) continue;
                    const set = new Set(g);
                    let ok = true;
                    for (const i of g) {
                        const nx = i % N + dx, ny = Math.floor(i / N) + dy;
                        if (nx < 0 || nx >= N || ny < 0 || ny >= N) { ok = false; break; }
                        const t = ny * N + nx;
                        if (board[t] !== 0 && !set.has(t)) { ok = false; break; }
                    }
                    if (!ok) continue;
                    for (const i of g) board[i] = 0;
                    for (const i of g) board[(Math.floor(i / N) + dy) * N + (i % N + dx)] = col;
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
        // 群れの描画: 飛ぶ影
        K.CUE_GRID(`            // 群行: 中心へ向かう淡い群れの飛影
            {
                const c = (BOARD_SIZE - 1) / 2;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.12);
                for (let k = 0; k < 5; k++) {
                    const fx = padding + ((k * 3 + 1) % BOARD_SIZE) * cellSize;
                    const fy = padding + ((k * 5 + 2) % BOARD_SIZE) * cellSize;
                    ctx.beginPath();
                    ctx.arc(fx, fy, cellSize * 0.10, 0, Math.PI * 2);
                    ctx.arc(fx + cellSize * 0.18, fy - cellSize * 0.12, cellSize * 0.07, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '連は群れで動く: 3手ごとに全連が重心を計算し、盤の中心方向へ1マスまとまって進む。',
            '行き先が盤端や他の石で塞がれた連は動けない。群れ同士の衝突に注意。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0); history.length = 2;
        board[2 * BOARD_SIZE + 2] = 1;
        board[2 * BOARD_SIZE + 3] = 1; // 横2連
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2); // 3手目で群行
        assert('連がまとまって中心へ', board[3 * BOARD_SIZE + 3] === 1 && board[3 * BOARD_SIZE + 4] === 1 && board[2 * BOARD_SIZE + 2] === 0 && board[2 * BOARD_SIZE + 3] === 0);
        board.fill(0); history.length = 2;
        const c = Math.floor(BOARD_SIZE / 2);
        board[c * BOARD_SIZE + c] = 1;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('中心の連は動かない', board[c * BOARD_SIZE + c] === 1);
        board.fill(0); history.length = 2;
        board[4 * BOARD_SIZE + 4] = 1;
        board[5 * BOARD_SIZE + 5] = 2; // 敵石が移動先を塞ぐ
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('塞がれた連は動けない', board[4 * BOARD_SIZE + 4] === 1);
    `,
};
