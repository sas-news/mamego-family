// LGO — 拐碁: L字3連ピースだけを置く碁。曲がり連で呼吸点が散る。
const K = require('../gen_kit.js');
module.exports = {
    file: 'lgo.html',
    en: 'LGO',
    jp: '拐碁',
    prefix: 'lgo',
    desc: 'L字3連ピースだけを置く碁。曲がり連で呼吸点が散る。',
    kind: 'stone',
    spec: [
        ...K.rb('LGO', '拐碁', 'lgo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[0,1],[1,1]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[1,1]],[[1,0],[0,1],[1,1]]];`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 3;`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手はL字 (拐) の3連ピースのみ (回転=Rキー・右クリック・ホイール)。','ピースが入らない3マス未満の連結空領域は窒息領域。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const el = [{ x: 3, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }];
        assert('L字は置ける', isValidPlacement(el, 1) === true);
        executeMove({ cells: el }, 1);
        assert('3石置かれた', board[3 * BOARD_SIZE + 3] === 1 && board[4 * BOARD_SIZE + 3] === 1 && board[4 * BOARD_SIZE + 4] === 1);
        assert('直線3連は形違いで不可', isValidPlacement([{ x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }], 1) === false);
    
    `,
};
