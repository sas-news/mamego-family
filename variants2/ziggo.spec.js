// ZIGGO — 之字碁: S字・Z字4連ピースだけを置く碁。ジグザグの連。
const K = require('../gen_kit.js');
module.exports = {
    file: 'ziggo.html',
    en: 'ZIGGO',
    jp: '之字碁',
    prefix: 'ziggo',
    desc: 'S字・Z字4連ピースだけを置く碁。ジグザグの連。',
    kind: 'stone',
    spec: [
        ...K.rb('ZIGGO', '之字碁', 'ziggo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[1,0],[2,0],[0,1],[1,1]],[[0,0],[0,1],[1,1],[1,2]],[[0,0],[1,0],[1,1],[2,1]],[[1,0],[0,1],[1,1],[0,2]]];`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 4;`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は之字 (S/Zジグザグ) の4連ピースのみ (回転=Rキー・右クリック・ホイール)。','ピースが入らない4マス未満の連結空領域は窒息領域。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const zig = [{ x: 4, y: 3 }, { x: 5, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }];
        assert('之字は置ける', isValidPlacement(zig, 1) === true);
        executeMove({ cells: zig }, 1);
        assert('4石置かれた', [[4,3],[5,3],[3,4],[4,4]].every(([x,y]) => board[y * BOARD_SIZE + x] === 1));
        assert('T字は形違いで不可', isValidPlacement([{ x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 9 }], 1) === false);
    
    `,
};
