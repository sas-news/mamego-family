// SLINEGO — 直三碁: 1x3直線ピースだけを置く碁。最小限の形で読み合う。
const K = require('../gen_kit.js');
module.exports = {
    file: 'slinego.html',
    en: 'SLINEGO',
    jp: '直三碁',
    prefix: 'slinego',
    desc: '1x3直線ピースだけを置く碁。最小限の形で読み合う。',
    kind: 'stone',
    spec: [
        ...K.rb('SLINEGO', '直三碁', 'slinego'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]]];`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は1x3の直線3連ピースのみ (回転=Rキー・右クリック・ホイールで向き変更)。','ピースが入らない3マス未満の連結空領域は窒息領域 (呼吸点にも地にもならない)。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const line = [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }];
        assert('直三は置ける', isValidPlacement(line, 1) === true);
        executeMove({ cells: line }, 1);
        assert('3石置かれた', [2, 3, 4].every(x => board[2 * BOARD_SIZE + x] === 1));
        assert('単石は形違いで不可', isValidPlacement([{ x: 7, y: 7 }], 1) === false);
        assert('占有には置けない', isValidPlacement([{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }], 2) === false);
    
    `,
};
