// HOURGO — 砂時計碁: 中央で1点に絞られた盤形
const K = require('../gen_kit.js');
module.exports = {
    file: 'hourgo.html',
    en: 'HOURGO',
    jp: '砂時計碁',
    prefix: 'hourgo',
    desc: '中央1点で上下が細く繋がる砂時計盤。咽喉を制する者が盤を制す。',
    kind: 'stone',
    spec: [
        ...K.rb('HOURGO', '砂時計碁', 'hourgo'),
        // |x-c| <= |y-c| の砂時計形
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (Math.abs(x - c) > Math.abs(y - c)) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        ...K.WALL_SPEC,
        // 絞り口に金点
        K.CUE_STARS(`            {
                const c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.fillStyle = '#b8860b';
                ctx.beginPath();
                ctx.arc(padding + c * cellSize, padding + c * cellSize, cellSize * 0.16, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '上下の三角形が中央1点でだけ繋がる砂時計形。',
            '中央の咽喉を押さえれば上下の連絡を断てる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, c = Math.floor(N / 2);
        assert('絞り口(天元)は置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('中段の脇は壁', board[c * N] === 3 && isValidPlacement([{ x: 0, y: c }], 1) === false);
        assert('上の隅は置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('下半分も三角', isValidPlacement([{ x: 0, y: N - 1 }], 1) === true);
    `,
};
