// ISOLATEGO — 孤点碁: 半分の点は直交と断たれ斜めだけで繋がる
const K = require('../gen_kit.js');
module.exports = {
    file: 'isolatego.html',
    en: 'ISOLATEGO',
    jp: '孤点碁',
    prefix: 'isolatego',
    desc: '市松の半分は斜めだけ、半分は直交だけに繋がる2重格子盤。',
    kind: 'stone',
    spec: [
        ...K.rb('ISOLATEGO', '孤点碁', 'isolatego'),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if ((x + y) % 2 === 0) {
                // 孤点: 斜めだけで繋がる (直交とは断たれた点)
                if (x > 0 && y > 0) neighbors.push(idx - BOARD_SIZE - 1);
                if (x < BOARD_SIZE - 1 && y > 0) neighbors.push(idx - BOARD_SIZE + 1);
                if (x > 0 && y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE - 1);
                if (x < BOARD_SIZE - 1 && y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE + 1);
            } else {
                // 通常点: 上下左右
                if (x > 0) neighbors.push(idx - 1);
                if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
                if (y > 0) neighbors.push(idx - BOARD_SIZE);
                if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            }
            return neighbors;
        }`],
        // 孤点を薄くシェード
        K.CUE_GRID(`            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.10);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if ((x + y) % 2 === 0) {
                        ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                    }
                }
                ctx.restore();
            }`),
        // 孤点に小さな菱形 (斜めだけに繋がる点の目印)
        K.CUE_STARS(`            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.45);
                ctx.lineWidth = Math.max(1, cellSize * 0.035);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if ((x + y) % 2 !== 0) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, r = cellSize * 0.13;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - r);
                    ctx.lineTo(cx + r, cy);
                    ctx.lineTo(cx, cy + r);
                    ctx.lineTo(cx - r, cy);
                    ctx.closePath();
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '市松の半分は「孤点」で、斜め方向にだけ繋がる。',
            '残り半分は通常の直交格子。2種類の連の在り方が交錯する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE;
        assert('孤点(0,0)は斜めのみ', getNeighbors(0).length === 1 && getNeighbors(0)[0] === N + 1);
        assert('通常点(1,0)は直交3近傍', getNeighbors(1).length === 3 && getNeighbors(1).includes(0));
        assert('孤点内部は斜め4', getNeighbors(2 * N + 2).length === 4 && getNeighbors(2 * N + 2).includes(N + 1));
        assert('孤点には置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board.fill(0);
        board[N + 1] = 1;
        board[0] = 2; board[2] = 2; board[2 * N] = 2; board[2 * N + 2] = 2;
        assert('斜めの囲みで取れる', getCapturedStones(board, 1).includes(N + 1));
    `,
};
