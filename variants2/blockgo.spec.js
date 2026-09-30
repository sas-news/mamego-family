// BLOCKGO — 塊碁: 毎手どんな4連テトロミノでも置ける碁。
const K = require('../gen_kit.js');
module.exports = {
    file: 'blockgo.html',
    en: 'BLOCKGO',
    jp: '塊碁',
    prefix: 'blockgo',
    desc: '毎手どんな4連テトロミノでも置ける碁。',
    kind: 'stone',
    spec: [
        ...K.rb('BLOCKGO', '塊碁', 'blockgo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[1,1]],[[1,0],[0,1],[1,1],[1,2]],[[1,0],[0,1],[1,1],[2,1]],[[0,0],[0,1],[0,2],[1,1]],[[0,0],[0,1],[0,2],[1,2]],[[0,0],[1,0],[2,0],[0,1]],[[0,0],[1,0],[1,1],[1,2]],[[0,1],[1,1],[2,1],[2,0]],[[1,0],[1,1],[1,2],[0,2]],[[0,0],[0,1],[1,1],[2,1]],[[0,0],[1,0],[0,1],[0,2]],[[0,0],[1,0],[2,0],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[0,1],[1,1],[1,2]],[[0,0],[1,0],[1,1],[2,1]],[[1,0],[0,1],[1,1],[0,2]]];`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は自由形の4連ピース (テトロミノ19向き)。Rキー・右クリック・ホイールで形を巡回する。','ピースが入らない4マス未満の連結空領域は窒息領域。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const sq = [{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 5 }, { x: 5, y: 5 }];
        assert('O型は置ける', isValidPlacement(sq, 1) === true);
        executeMove({ cells: sq }, 1);
        assert('4石置かれた', sq.every(p => board[p.y * BOARD_SIZE + p.x] === 1));
        const el = [{ x: 8, y: 8 }, { x: 8, y: 9 }, { x: 8, y: 10 }, { x: 9, y: 10 }];
        assert('L型も置ける', isValidPlacement(el, 1) === true);
        assert('3連は形違いで不可', isValidPlacement([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], 1) === false);
    
    `,
};
