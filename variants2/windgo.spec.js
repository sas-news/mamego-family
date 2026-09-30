// WINDGO — 風碁: 着手ごとに全石が風向きに1マス流れる (風向きは手数で巡回)
const K = require('../gen_kit.js');
module.exports = {
    file: 'windgo.html',
    en: 'WINDGO',
    jp: '風碁',
    prefix: 'windgo',
    desc: '着手ごとに全石が風向きへ1マス流れる。風は東→南→西→北と巡る。',
    kind: 'stone',
    spec: [
        ...K.rb('WINDGO', '風碁', 'windgo'),
        // 着手ごと、全石をその時刻の風向きへ1マス流す
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 風ルール: 全石が風向きに1マス流れる。風は 東→南→西→北 の順に巡る
            {
                const N = BOARD_SIZE;
                const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
                const d = dirs[history.length % 4];
                // 流れ方向の下流側から処理して連鎖的な追い越しを防ぐ
                const xs = [...Array(N).keys()];
                const ys = [...Array(N).keys()];
                if (d[0] > 0) xs.reverse();
                if (d[1] > 0) ys.reverse();
                for (const y of ys) for (const x of xs) {
                    const i = y * N + x;
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const nx = x + d[0], ny = y + d[1];
                    if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;
                    if (board[ny * N + nx] !== 0) continue;
                    board[ny * N + nx] = board[i];
                    board[i] = 0;
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
        ...K.EVENT_CHIP_SPEC(`'風 ' + '東南西北'[history.length % 4] + ' ' + '→↓←↑'[history.length % 4]`),
        // 盤隅に風向きの矢印を表示
        K.CUE_STARS(`            // 風向き表示
            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.8);
                ctx.font = 'bold ' + Math.round(cellSize * 0.9) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('→↓←↑'[history.length % 4], padding - cellSize * 0.8, padding - cellSize * 0.4);
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手ごとに盤上の全石が風向きに1マス流される。風は東→南→西→北と1手ごとに向きを変える。',
            '盤端や他の石に詰まった石は流されない。風読みが勝負を分ける。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 1手目の風は南 (↓)
        assert('南風で下へ流れる', board[5 * BOARD_SIZE + 4] === 1 && board[4 * BOARD_SIZE + 4] === 0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2); // 2手目の風は西 (←)
        assert('西風で左へ流れる', board[5 * BOARD_SIZE + 3] === 1);
        assert('盤端の白石は留まる', board[0] === 2);
        board.fill(0);
        board[0 * BOARD_SIZE + 0] = 1;
        board[0 * BOARD_SIZE + 1] = 2;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 3手目の風は北 (↑): 上端の石は留まる
        assert('北風で上端の石は留まる', board[0] === 1 && board[0 * BOARD_SIZE + 1] === 2);
        executeMove({ cells: [{ x: 6, y: 7 }] }, 2); // 4手目の風は東 (→)
        assert('東風で両石が右へ流れる', board[0 * BOARD_SIZE + 1] === 1 && board[0 * BOARD_SIZE + 2] === 2);
    `,
};
