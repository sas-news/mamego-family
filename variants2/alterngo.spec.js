// ALTERNGO — 番兵碁: 黒は偶数行、白は奇数行にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'alterngo.html',
    en: 'ALTERNGO',
    jp: '番兵碁',
    prefix: 'alterngo',
    desc: '黒は偶数行、白は奇数行を守る番兵。交互の行で睨み合う碁。',
    kind: 'sentry',
    spec: [
        ...K.rb('ALTERNGO', '番兵碁', 'alterngo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 番兵碁ルール: 黒は偶数行 (0,2,4…)、白は奇数行 (1,3,5…) のみ守備可
            {
                const evenRows = player === 1;
                for (const p of cells) {
                    if ((p.y % 2 === 0) !== evenRows) return false;
                }
            }`],
        K.CUE_GRID(`            // 番兵: 担当外の行を薄く沈める (偶数行=黒区、奇数行=白区)
            {
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const isBlackRow = y % 2 === 0;
                    ctx.fillStyle = alphaColor(
                        isBlackRow ? 'rgba(30,30,30,1)' : 'rgba(240,240,240,1)', 0.07);
                    ctx.fillRect(-cellSize, padding + (y - 0.5) * cellSize,
                        padding * 2 + BOARD_SIZE * cellSize, cellSize);
                }
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '黒は偶数行、白は奇数行にしか着手できない。互いに相手の行へは進めない。',
            '石は行ごとに層を成し、取り合いは行を跨ぐ連の切り結びになる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        assert('黒は偶数行(0)に置ける', isValidPlacement([{ x: 3, y: 0 }], 1) === true);
        assert('黒は偶数行(4)に置ける', isValidPlacement([{ x: 3, y: 4 }], 1) === true);
        assert('黒は奇数行に置けない', isValidPlacement([{ x: 3, y: 3 }], 1) === false);
        assert('白は奇数行に置ける', isValidPlacement([{ x: 3, y: 3 }], 2) === true);
        assert('白は偶数行に置けない', isValidPlacement([{ x: 3, y: 4 }], 2) === false);
    `,
};
