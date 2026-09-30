// CELLGO — 細胞碁: 7連のハニカム細胞ピースだけを置く碁。
const K = require('../gen_kit.js');
module.exports = {
    file: 'cellgo.html',
    en: 'CELLGO',
    jp: '細胞碁',
    prefix: 'cellgo',
    desc: '7連のハニカム細胞ピースだけを置く碁。',
    kind: 'stone',
    spec: [
        ...K.rb('CELLGO', '細胞碁', 'cellgo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2]],[[0,0],[1,0],[0,1],[1,1],[2,1],[1,2],[2,2]]];`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 7;`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は7連のハニカム細胞 (角欠け3x3) ピースのみ (向き=Rキー・右クリック・ホイール)。','ピースが入らない7マス未満の連結空領域は窒息領域。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const cell = [{x:4,y:3},{x:5,y:3},{x:3,y:4},{x:4,y:4},{x:5,y:4},{x:3,y:5},{x:4,y:5}];
        assert('細胞形は置ける', isValidPlacement(cell, 1) === true);
        executeMove({ cells: cell }, 1);
        assert('7石置かれた', cell.every(p => board[p.y * BOARD_SIZE + p.x] === 1));
        assert('単石は形違いで不可', isValidPlacement([{ x: 9, y: 9 }], 1) === false);
    
    `,
};
