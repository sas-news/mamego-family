// DIADGO — 斜連碁: 斜めに触れ合う2石のドミノを置く碁。連は繋がらない。
const K = require('../gen_kit.js');
module.exports = {
    file: 'diadgo.html',
    en: 'DIADGO',
    jp: '斜連碁',
    prefix: 'diadgo',
    desc: '斜めに触れ合う2石のドミノを置く碁。連は繋がらない。',
    kind: 'stone',
    spec: [
        ...K.rb('DIADGO', '斜連碁', 'diadgo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[1,1]],[[0,1],[1,0]]];`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 1;`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は斜めに接する2石のドミノ (回転=Rキー・右クリック・ホイール)。','斜め接触は連にならない: 2石は別々の連として呼吸する。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const dd = [{ x: 4, y: 4 }, { x: 5, y: 5 }];
        assert('斜めドミノは置ける', isValidPlacement(dd, 1) === true);
        executeMove({ cells: dd }, 1);
        assert('2石置かれた', board[4 * BOARD_SIZE + 4] === 1 && board[5 * BOARD_SIZE + 5] === 1);
        assert('横ドミノは形違いで不可', isValidPlacement([{ x: 8, y: 8 }, { x: 9, y: 8 }], 1) === false);
        assert('斜め2石は別連', getNeighbors(4 * BOARD_SIZE + 4).includes(5 * BOARD_SIZE + 5) === false);
    
    `,
};
