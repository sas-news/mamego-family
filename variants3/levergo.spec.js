// LEVERGO — 梃子碁: 中央の支点を挟んで点対称の位置にある敵石が中央へ1マスずれる
const K = require('../gen_kit.js');
module.exports = {
    file: 'levergo.html',
    en: 'LEVERGO',
    jp: '梃子碁',
    prefix: 'levergo',
    desc: '中央支点を挟んだ反対側の敵石が中央へ1マスずれる梃子。支点まで辿り着いた敵石は潰れて捕獲される。',
    kind: 'stone',
    icon: 'levergo',
    spec: [
        ...K.rb('LEVERGO', '梃子碁', 'levergo'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 梃子ルール: 点対称位置の敵石が中央へ1マスずれる。支点に達した敵石は潰れて捕獲
            {
                const c = (BOARD_SIZE - 1) / 2;
                const px = move.cells[0].x, py = move.cells[0].y;
                const mx = BOARD_SIZE - 1 - px, my = BOARD_SIZE - 1 - py;
                const mi = my * BOARD_SIZE + mx;
                if (board[mi] === opponent) {
                    const sx = Math.sign(c - mx), sy = Math.sign(c - my);
                    const nx = mx + sx, ny = my + sy;
                    if (nx === c && ny === c) {
                        // 支点で潰れる → 捕獲
                        board[mi] = 0; captures[player]++;
                        fxBurst(mi, '#f59e0b', 8, 1.6);
                        fxText(mi, '支点潰し!', '#d97706', 1200);
                        cleanUpPieces();
                    } else {
                        const ni = ny * BOARD_SIZE + nx;
                        if (board[ni] === 0) {
                            board[ni] = opponent; board[mi] = 0;
                            fxSlide(mi, ni, 300);
                            cleanUpPieces();
                        }
                    }
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        // 中央支点の描画
        K.CUE_STARS(`            // 梃子の支点 (中央の三角)
            {
                const cx = padding + (BOARD_SIZE - 1) * cellSize / 2;
                const cy = padding + (BOARD_SIZE - 1) * cellSize / 2;
                ctx.save();
                ctx.fillStyle = 'rgba(217,119,6,0.5)';
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.3);
                ctx.lineTo(cx + cellSize * 0.32, cy + cellSize * 0.22);
                ctx.lineTo(cx - cellSize * 0.32, cy + cellSize * 0.22);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手すると、中央支点を挟んだ点対称位置の敵石が中央へ1マスずれる。',
            '支点 (天元) まで押し込まれた敵石は潰れて着手側のアゲハマになる。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const N = BOARD_SIZE, c = (N - 1) / 2;
        board[9 * N + 9] = 2; // (9,9) に白 (点対称: (3,3))
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('対称の敵が中央へずれる', board[8 * N + 8] === 2 && board[9 * N + 9] === 0);
        // 支点潰し: 支点の隣 (c+1,c) に白 → 対称位置 (c-1,c) に着手 → (c,c) で潰れる
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[c * N + (c + 1)] = 2;
        executeMove({ cells: [{ x: c - 1, y: c }] }, 1);
        assert('支点で潰れて捕獲', board[c * N + (c + 1)] === 0 && captures[1] === 1);
        assert('自分色の対称石はずれない', (() => { board.fill(0); pieces = []; board[9 * N + 9] = 1; executeMove({ cells: [{ x: 3, y: 3 }] }, 1); return board[9 * N + 9] === 1; })());
    `,
};
