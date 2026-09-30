// BARBGO — 槍碁: 1x5の槍ピースだけを置く碁。長い槍で盤を貫く。
const K = require('../gen_kit.js');
module.exports = {
    file: 'barbgo.html',
    en: 'BARBGO',
    jp: '槍碁',
    prefix: 'barbgo',
    desc: '1x5の槍ピースだけを置く碁。長い槍で盤を貫く。',
    kind: 'stone',
    spec: [
        ...K.rb('BARBGO', '槍碁', 'barbgo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[1,0],[2,0],[3,0],[4,0]],[[0,0],[0,1],[0,2],[0,3],[0,4]]];`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は1x5の槍ピースのみ (回転=Rキー・右クリック・ホイール)。','ピースが入らない5マス未満の連結空領域は窒息領域。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const sp = [{ x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }];
        assert('槍は置ける', isValidPlacement(sp, 1) === true);
        executeMove({ cells: sp }, 1);
        assert('5石置かれた', [2,3,4,5,6].every(x => board[5 * BOARD_SIZE + x] === 1));
        assert('直三は形違いで不可', isValidPlacement([{ x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }], 1) === false);
    
    `,
};
