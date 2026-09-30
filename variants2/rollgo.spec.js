// ROLLGO — 転がり碁: 盤は谷型の斜面。石は低い方へ1マス転がり続ける
const K = require('../gen_kit.js');
module.exports = {
    file: 'rollgo.html',
    en: 'ROLLGO',
    jp: '転がり碁',
    prefix: 'rollgo',
    desc: '盤は中央が谷底のV字斜面。着手ごと石は低い方へ1マス転がる。',
    kind: 'stone',
    spec: [
        ...K.rb('ROLLGO', '転がり碁', 'rollgo'),
        // 着手ごと、谷の斜面に沿って石が1マス低い方へ転がる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 転がりルール: 盤は中央が谷底のV字斜面 (高さ=中心からの横距離)。
            //               石は1手ごとに低い方へ1マス転がる。谷底や渋滞では止まる。
            {
                const N = BOARD_SIZE, c = Math.floor(N / 2);
                // 谷底に近い方から処理して転がりの連鎖を許す
                const idxs = [...board.keys()].sort((a, b) =>
                    Math.abs(a % N - c) - Math.abs(b % N - c));
                for (const i of idxs) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % N, y = Math.floor(i / N);
                    if (x === c) continue; // 谷底で停止
                    const nx = x + (x < c ? 1 : -1);
                    const j = y * N + nx;
                    if (board[j] === 0) { board[j] = board[i]; board[i] = 0; }
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


            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 谷の描画: 中央が低いV字シェード
        K.CUE_GRID(`            // 谷: 中央が低いV字のシェード
            {
                const c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const h = Math.abs(x - c) / Math.max(1, c);
                    ctx.fillStyle = 'rgba(0,0,0,' + (0.10 * h).toFixed(3) + ')';
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding - cellSize * 0.5,
                        cellSize, cellSize * BOARD_SIZE);
                }
                ctx.fillStyle = 'rgba(80,160,255,0.25)';
                ctx.fillRect(padding + (c - 0.5) * cellSize, padding - cellSize * 0.5,
                    cellSize, cellSize * BOARD_SIZE);
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は中央が谷底のV字斜面: 着手ごとに石は低い方へ1マス転がる。',
            '谷底や前を塞がれた石は止まる。転がり続ける石を読んで形を作る。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        const c = Math.floor(BOARD_SIZE / 2);
        board.fill(0);
        executeMove({ cells: [{ x: 2, y: 4 }] }, 1);
        assert('斜面を転がって谷寄りへ', board[4 * BOARD_SIZE + 3] === 1 && board[4 * BOARD_SIZE + 2] === 0);
        board.fill(0);
        executeMove({ cells: [{ x: c, y: 4 }] }, 1);
        assert('谷底の石は転がらない', board[4 * BOARD_SIZE + c] === 1);
        board.fill(0);
        board[4 * BOARD_SIZE + c] = 1;
        board[4 * BOARD_SIZE + c - 1] = 2; // 谷底の隣は塞がれて転がれない
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('渋滞した石は止まる', board[4 * BOARD_SIZE + c - 1] === 2);
        board.fill(0);
        board[4 * BOARD_SIZE + BOARD_SIZE - 1] = 1; // 右斜面の石は左へ転がる
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('右斜面は左へ転がる', board[4 * BOARD_SIZE + BOARD_SIZE - 2] === 1);
    `,
};
