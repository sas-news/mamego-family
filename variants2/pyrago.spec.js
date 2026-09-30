// PYRAGO — 金字塔碁: 同心の溝で分かれた3層ピラミッド盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'pyrago.html',
    en: 'PYRAGO',
    jp: '金字塔碁',
    prefix: 'pyrago',
    desc: '同心状の溝で3層に分かれたピラミッド盤。層ごとに独立した戦場。',
    kind: 'stone',
    spec: [
        ...K.rb('PYRAGO', '金字塔碁', 'pyrago'),
        // 外周からの距離で段を刻む: 2本の溝リング (頂が1点だけになる場合は内溝を省略)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const d1 = Math.max(1, Math.floor(BOARD_SIZE / 6));
                const d2 = Math.max(d1 + 1, Math.floor(BOARD_SIZE / 3));
                const singleKeep = d2 + 1 === Math.floor(BOARD_SIZE / 2); // 溝が中心1点だけを囲むなら省略
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const d = Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
                    if (d === d1 || (d === d2 && !singleKeep)) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        // 層ごとに薄く段差の陰影 (高いほど暗く)
        K.CUE_GRID(`            {
                const d1 = Math.max(1, Math.floor(BOARD_SIZE / 6));
                const d2 = Math.max(d1 + 1, Math.floor(BOARD_SIZE / 3));
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const d = Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
                    if (d === d1 || d === d2) continue;
                    ctx.fillStyle = alphaColor(currentTheme.lineColor, d > d1 ? 0.12 : 0.05);
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                }
                ctx.restore();
            }`),
        ...K.WALL_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '外郭・中段・頂の3層に溝で分かれたピラミッド盤。',
            '層の間は行き来できない。各層で独立した地取り合戦になる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, c = Math.floor(N / 2);
        assert('頂(天元)は置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('層間の溝は置けない', board[2 * N + 2] === 3 && isValidPlacement([{ x: 2, y: 2 }], 1) === false);
        assert('もう1本の溝も置けない', board[4 * N + 4] === 3);
        assert('外郭は置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
