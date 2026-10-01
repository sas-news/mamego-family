// ISLEGO — 諸島碁: 3つの島が1マス橋で連結
const K = require('../gen_kit.js');
module.exports = {
    file: 'islego.html',
    en: 'ISLEGO',
    jp: '諸島碁',
    prefix: 'islego',
    desc: '海に浮かぶ3島。島同士は1マスの橋でしか行き来できない。',
    kind: 'stone',
    spec: [
        ...K.rb('ISLEGO', '諸島碁', 'islego'),
        K.params([
            { key: 'bridge_w', label: '橋の幅', options: [{ v: 1, l: '1列' }, { v: 3, l: '3列' }, { v: 5, l: '5列' }], def: 1 },
        ]),
        // 2条の海 (中央列だけ橋) + 中島は左右も海で囲む
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const q = Math.floor(BOARD_SIZE / 3), c = Math.floor(BOARD_SIZE / 2);
                const m = Math.floor(BOARD_SIZE / 6);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const sea = (y === q || y === BOARD_SIZE - 1 - q) && Math.abs(x - c) > ((P('bridge_w') || 1) - 1) / 2;
                    const shore = y > q && y < BOARD_SIZE - 1 - q && (x < m || x > BOARD_SIZE - 1 - m);
                    if (sea || shore) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        // 海は揺れる水面
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        ...K.WALL_GUARD_SPEC,
        // 海のきらめき
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        // 橋に茶色い丸印
        K.CUE_STARS(`            {
                const q = Math.floor(BOARD_SIZE / 3), c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.fillStyle = '#8a5a2b';
                const bhw = ((P('bridge_w') || 1) - 1) / 2;
                for (let bx = Math.ceil(c - bhw); bx <= c + bhw; bx++) {
                    [q, BOARD_SIZE - 1 - q].forEach(by => {
                        ctx.beginPath();
                        ctx.arc(padding + bx * cellSize, padding + by * cellSize, cellSize * 0.20, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '上下2条の海で分かれた3つの島。島同士は中央の1マス橋でのみ接続。',
            '橋を押さえるか各島を制するか、兵力配分が問われる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const q = Math.floor(BOARD_SIZE / 3), c = Math.floor(BOARD_SIZE / 2);
        assert('橋は渡れる', isValidPlacement([{ x: c, y: q }], 1) === true);
        assert('海には置けない', isValidPlacement([{ x: 0, y: q }], 1) === false);
        const bridge = q * BOARD_SIZE + c;
        assert('橋で上下の島が繋がる', getNeighbors(bridge).includes(bridge - BOARD_SIZE) && getNeighbors(bridge).includes(bridge + BOARD_SIZE));
        assert('中島の左右も海', isValidPlacement([{ x: 0, y: q + 1 }], 1) === false);
        assert('島の上は普通に置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
