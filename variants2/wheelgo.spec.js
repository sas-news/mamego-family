// WHEELGO — 車輪碁: ハブ+8スポークのみの盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'wheelgo.html',
    en: 'WHEELGO',
    jp: '車輪碁',
    prefix: 'wheelgo',
    desc: '十字と斜め線だけ残した車輪盤。近傍はスポークに沿う前後のみ。',
    kind: 'stone',
    spec: [
        ...K.rb('WHEELGO', '車輪碁', 'wheelgo'),
        // 近傍は同じスポーク上の前後のみ (ハブは8方向)
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const c = Math.floor(BOARD_SIZE / 2), m = BOARD_SIZE - 1;
            const n = [];
            const at = (xx, yy) => {
                if (xx >= 0 && xx < BOARD_SIZE && yy >= 0 && yy < BOARD_SIZE) n.push(yy * BOARD_SIZE + xx);
            };
            if (y === c) { at(x - 1, y); at(x + 1, y); }
            if (x === c) { at(x, y - 1); at(x, y + 1); }
            if (x === y) { at(x - 1, y - 1); at(x + 1, y + 1); }
            if (x + y === m) { at(x - 1, y + 1); at(x + 1, y - 1); }
            return n;
        }`],
        // スポーク以外は全て削る
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2), m = BOARD_SIZE - 1;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!(x === c || y === c || x === y || x + y === m)) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        // ハブに金環
        K.CUE_STARS(`            {
                const c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                ctx.beginPath();
                ctx.arc(padding + c * cellSize, padding + c * cellSize, cellSize * 0.34, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.WALL_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '十字・斜め2線・中央ハブだけが残った車輪盤。',
            '連も呼吸もスポークに沿って伸びる。ハブを巡る攻防が全て。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, c = Math.floor(N / 2);
        assert('ハブは8近傍', getNeighbors(c * N + c).length === 8);
        assert('斜めスポーク上は2近傍', getNeighbors(2 * N + 2).length === 2 && getNeighbors(2 * N + 2).includes(N + 1));
        assert('スポーク外は置けない', board[1] === 3 && isValidPlacement([{ x: 1, y: 0 }], 1) === false);
        assert('スポーク上は置ける', isValidPlacement([{ x: 0, y: c }], 1) === true);
    `,
};
