// ELASTGO — 伸縮碁: 伸び縮みするピース。1〜3連の長さを選んで置く。
const K = require('../gen_kit.js');
module.exports = {
    file: 'elastgo.html',
    en: 'ELASTGO',
    jp: '伸縮碁',
    prefix: 'elastgo',
    desc: '伸び縮みするピース。1〜3連の長さを選んで置く。',
    kind: 'stone',
    spec: [
        ...K.rb('ELASTGO', '伸縮碁', 'elastgo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0]],[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]]];`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は伸縮ピース: 1・2・3連の長さを Rキー・右クリック・ホイールで選ぶ。','短くして隙間に置くか、伸ばして一気に地を取るか。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        assert('1連も置ける', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
        assert('3連も置ける', isValidPlacement([{ x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }], 1) === true);
        executeMove({ cells: [{ x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }] }, 1);
        assert('3石置かれた', [4,5,6].every(x => board[6 * BOARD_SIZE + x] === 1));
        assert('4連は形違いで不可', isValidPlacement([{ x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }], 1) === false);
    
    `,
};
