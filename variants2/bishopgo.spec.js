// BISHOPGO — 角行碁: 自石と同じ斜線上にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'bishopgo.html',
    en: 'BISHOPGO',
    jp: '角行碁',
    prefix: 'bishopgo',
    desc: '着手は自石と同じ斜線上のみ。角行のように盤を斜めに結ぶ。',
    kind: 'bishop',
    spec: [
        ...K.rb('BISHOPGO', '角行碁', 'bishopgo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 角行碁ルール: 既存の自石と同じ斜線 (|dx|=|dy|>0) 上にのみ着手可 (初手は自由)
            {
                let hasOwn = false, onDiag = false;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    hasOwn = true;
                    const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                    for (const p of cells) {
                        if (Math.abs(p.x - sx) === Math.abs(p.y - sy) && (p.x !== sx || p.y !== sy)) onDiag = true;
                    }
                    if (onDiag) break;
                }
                if (hasOwn && !onDiag) return false;
            }`],
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は自分の石と同じ斜線上にある交点のみ。',
            '最初の1手はどこにでも置ける。角行のように斜めに盤を制する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        board[4 * BOARD_SIZE + 4] = 1; // (4,4)に黒
        assert('斜線上(近)は置ける', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
        assert('斜線上(遠)は置ける', isValidPlacement([{ x: 1, y: 7 }], 1) === true);
        assert('斜線外は置けない', isValidPlacement([{ x: 6, y: 5 }], 1) === false);
        assert('直交点は置けない', isValidPlacement([{ x: 4, y: 0 }], 1) === false);
        board.fill(0);
        assert('初手はどこでも置ける', isValidPlacement([{ x: 0, y: 4 }], 2) === true);
    `,
};
