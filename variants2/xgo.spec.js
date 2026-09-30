// XGO — 叉字碁: X字 (十字) 5連ピースだけを置く碁。
const K = require('../gen_kit.js');
module.exports = {
    file: 'xgo.html',
    en: 'XGO',
    jp: '叉字碁',
    prefix: 'xgo',
    desc: 'X字 (十字) 5連ピースだけを置く碁。',
    kind: 'stone',
    spec: [
        ...K.rb('XGO', '叉字碁', 'xgo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[1,0],[0,1],[1,1],[2,1],[1,2]]];`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は叉字 (十字/X字) の5連ピースのみ。','中心の石が4方向に分岐した連。5マス未満の空領域は窒息領域。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const xp = [{ x: 5, y: 3 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 5, y: 5 }];
        assert('X字は置ける', isValidPlacement(xp, 1) === true);
        executeMove({ cells: xp }, 1);
        assert('5石置かれた', [[5,3],[4,4],[5,4],[6,4],[5,5]].every(([x,y]) => board[y * BOARD_SIZE + x] === 1));
        assert('盤端にXは置けない', isValidPlacement([{ x: 0, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }], 1) === false);
    
    `,
};
