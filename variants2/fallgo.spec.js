// FALLGO — 落下碁: 宙に浮いた石は重力で下へ落ちて積み上がる
const K = require('../gen_kit.js');
module.exports = {
    file: 'fallgo.html',
    en: 'FALLGO',
    jp: '落下碁',
    prefix: 'fallgo',
    desc: '重力の盤。置いた石は列の底へ落ちて積み上がり、上はいつも空く。',
    kind: 'stone',
    spec: [
        ...K.rb('FALLGO', '落下碁', 'fallgo'),
        K.params([
            { key: 'fall_interval', label: '落下の間隔', min: 1, max: 12, def: 3, unit: '手' },
        ]),
        // 3手ごと、各列の石が底へ向かって落下し積み上がる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 落下ルール: 3手ごとに、各列の石は下へ落ち、順序を保ったまま底に積み上がる
            if (history.length % Math.max(1, P('fall_interval') || 3) === 0) {
                const N = BOARD_SIZE;
                for (let x = 0; x < N; x++) {
                    let w = N - 1;
                    for (let y = N - 1; y >= 0; y--) {
                        const i = y * N + x;
                        if (board[i] === 1 || board[i] === 2) {
                            if (w !== y) {
                                board[w * N + x] = board[i]; board[i] = 0;
                                fxSlide(i, w * N + x, 420); // 落下経路を可視化
                                if (w - y >= 2) fxSplash(w * N + x, 'rgba(190,170,140,0.8)', 5); // 着地の土煙
                            }
                            w--;
                        }
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
        // 重力の描画: 下向きの淡い矢印
        K.CUE_GRID(`            // 重力: 下向きの淡い矢印列
            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.12);
                ctx.font = Math.round(cellSize * 0.4) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let x = 0; x < BOARD_SIZE; x += 2) {
                    ctx.fillText('▼', padding + x * cellSize, padding + (BOARD_SIZE - 1) * cellSize + cellSize * 0.35);
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤には重力がある: 3手ごとに各列の石が底へ落ち、順序を保って積み上がる。',
            '上の盤面はいつも空くため、戦いは自然と下辺に集まる。積み上がった石は連として扱う。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0); history.length = 2;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 3手目で落下
        assert('宙石は底へ落ちる', board[(BOARD_SIZE - 1) * BOARD_SIZE + 4] === 1 && board[4 * BOARD_SIZE + 4] === 0);
        history.length = 2;
        executeMove({ cells: [{ x: 4, y: 2 }] }, 2);
        assert('同じ列の上に積み上がる', board[(BOARD_SIZE - 2) * BOARD_SIZE + 4] === 2 && board[(BOARD_SIZE - 1) * BOARD_SIZE + 4] === 1);
        board.fill(0); history.length = 2;
        executeMove({ cells: [{ x: 0, y: BOARD_SIZE - 1 }] }, 1);
        assert('底に置けば動かない', board[(BOARD_SIZE - 1) * BOARD_SIZE + 0] === 1);
    `,
};
