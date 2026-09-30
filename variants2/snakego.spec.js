// SNAKEGO — 蛇碁: 5連の蛇 (W字) ピースだけを置く碁。
const K = require('../gen_kit.js');
module.exports = {
    file: 'snakego.html',
    en: 'SNAKEGO',
    jp: '蛇碁',
    prefix: 'snakego',
    desc: '5連の蛇 (W字) ピースだけを置く碁。',
    kind: 'stone',
    spec: [
        ...K.rb('SNAKEGO', '蛇碁', 'snakego'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[0,1],[1,1],[1,2],[2,2]],[[1,0],[2,0],[0,1],[1,1],[0,2]],[[0,0],[1,0],[1,1],[2,1],[2,2]],[[2,0],[0,1],[1,1],[1,2],[0,2]]];`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 5;`],
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `

            // 形状チェック: 着手できるのはこのゲームの専用の形のみ
            {
                const _norm = (cs) => {
                    const _mx = Math.min(...cs.map(c => c.x));
                    const _my = Math.min(...cs.map(c => c.y));
                    return cs.map(c => (c.x - _mx) + ',' + (c.y - _my)).sort().join(';');
                };
                const _cur = _norm(cells);
                const _allow = (ORIENTATIONS[currentPieceType] || []).map(s => _norm(s.map(([x, y]) => ({ x, y }))));
                if (!_allow.includes(_cur)) return false;
            }`],
        [K.ONE, K.RV_ALGO, K.rv(['着手は5連の蛇 (階段状W字) ピースのみ (回転=Rキー・右クリック・ホイール)。','ピースが入らない5マス未満の連結空領域は窒息領域。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const snk = [{ x: 3, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 5, y: 5 }];
        assert('蛇形は置ける', isValidPlacement(snk, 1) === true);
        executeMove({ cells: snk }, 1);
        assert('5石置かれた', [[3,3],[3,4],[4,4],[4,5],[5,5]].every(([x,y]) => board[y * BOARD_SIZE + x] === 1));
        assert('直線5連は形違いで不可', isValidPlacement([{ x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }], 1) === false);
    
    `,
};
