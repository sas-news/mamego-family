// WINGGO — 翼碁: 中央から両翼が伸びる5連ピースを置く碁。
const K = require('../gen_kit.js');
module.exports = {
    file: 'winggo.html',
    en: 'WINGGO',
    jp: '翼碁',
    prefix: 'winggo',
    desc: '中央から両翼が伸びる5連ピースを置く碁。',
    kind: 'stone',
    spec: [
        ...K.rb('WINGGO', '翼碁', 'winggo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[1,0],[2,0],[0,1],[0,2]],[[0,0],[1,0],[2,0],[2,1],[2,2]],[[2,0],[2,1],[0,2],[1,2],[2,2]],[[0,0],[0,1],[0,2],[1,2],[2,2]]];`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は中央+両翼のV字5連ピースのみ (回転=Rキー・右クリック・ホイール)。','ピースが入らない5マス未満の連結空領域は窒息領域。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const wing = [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 3, y: 4 }, { x: 3, y: 5 }];
        assert('翼形は置ける', isValidPlacement(wing, 1) === true);
        executeMove({ cells: wing }, 1);
        assert('5石置かれた', [[3,3],[4,3],[5,3],[3,4],[3,5]].every(([x,y]) => board[y * BOARD_SIZE + x] === 1));
        assert('十字は形違いで不可', isValidPlacement([{ x: 9, y: 6 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 9, y: 8 }], 1) === false);
    
    `,
};
