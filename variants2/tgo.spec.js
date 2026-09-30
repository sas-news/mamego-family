// TGO — 丁字碁: T字4連ピースだけを置く碁。丁の字の分岐連。
const K = require('../gen_kit.js');
module.exports = {
    file: 'tgo.html',
    en: 'TGO',
    jp: '丁字碁',
    prefix: 'tgo',
    desc: 'T字4連ピースだけを置く碁。丁の字の分岐連。',
    kind: 'stone',
    spec: [
        ...K.rb('TGO', '丁字碁', 'tgo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[1,0],[2,0],[1,1]],[[1,0],[0,1],[1,1],[1,2]],[[0,1],[1,1],[2,1],[1,0]],[[0,0],[0,1],[0,2],[1,1]]];`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手はT字 (丁) の4連ピースのみ (回転=Rキー・右クリック・ホイール)。','ピースが入らない4マス未満の連結空領域は窒息領域。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const tee = [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 4, y: 4 }];
        assert('T字は置ける', isValidPlacement(tee, 1) === true);
        executeMove({ cells: tee }, 1);
        assert('4石置かれた', [[3,3],[4,3],[5,3],[4,4]].every(([x,y]) => board[y * BOARD_SIZE + x] === 1));
        assert('直線4連は形違いで不可', isValidPlacement([{ x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }], 1) === false);
    
    `,
};
