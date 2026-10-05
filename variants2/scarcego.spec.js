// SCARCEGO — 寡占碁: 1つの行に置ける石は白黒合わせて4個まで
const K = require('../gen_kit.js');
module.exports = {
    file: 'scarcego.html',
    en: 'SCARCEGO',
    jp: '寡占碁',
    prefix: 'scarcego',
    desc: '各行に置ける石は合計4個まで。寡占された行は閉鎖される。',
    kind: 'scarce',
    spec: [
        ...K.rb('SCARCEGO', '寡占碁', 'scarcego'),
        K.params([
            { key: 'row_max', label: '行あたりの石数上限', min: 1, max: 12, def: 4, unit: '個' },
        ]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 寡占碁ルール: 1行に置ける石は合計4個まで (色問わず)
            {
                const rowCount = new Array(BOARD_SIZE).fill(0);
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 0) rowCount[Math.floor(i / BOARD_SIZE)]++;
                }
                for (const p of cells) {
                    if (rowCount[p.y] >= Math.max(1, P('row_max') || 4)) return false;
                }
            }`],
        ...K.EVENT_CHIP_SPEC(`'行の石上限: ' + (P('row_max') || 4)`),
        // 寡占: 各行の石数カウンタ (右端) と満杯行の閉鎖色
        K.CUE_GRID(`            {
                const rowCount = new Array(BOARD_SIZE).fill(0);
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 0) rowCount[Math.floor(i / BOARD_SIZE)]++;
                }
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const cy = padding + y * cellSize;
                    if (rowCount[y] >= Math.max(1, P('row_max') || 4)) {
                        ctx.fillStyle = 'rgba(200,60,60,0.15)';
                        ctx.fillRect(padding - cellSize * 0.5, cy - cellSize * 0.5, width - padding * 2 + cellSize, cellSize);
                    }
                    ctx.fillStyle = rowCount[y] >= Math.max(1, P('row_max') || 4) ? '#c0392b' : alphaColor(currentTheme.lineColor, 0.7);
                    ctx.font = 'bold ' + (cellSize * 0.27).toFixed(1) + 'px sans-serif';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(rowCount[y] + '/' + (P('row_max') || 4), width - padding + cellSize * 0.32, cy);
                }
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_BASE, K.rv([
            '1つの行に置ける石は黒白合わせて4個まで。満杯の行にはもう置けない。',
            '行が寡占されて閉じると石は縦へ逃げる。取られれば行が再び開く。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        assert('空行には置ける', isValidPlacement([{ x: 0, y: 2 }], 1) === true);
        board[2 * BOARD_SIZE + 1] = 1;
        board[2 * BOARD_SIZE + 3] = 2;
        board[2 * BOARD_SIZE + 5] = 1;
        board[2 * BOARD_SIZE + 7] = 2; // 2行目に4石
        assert('4石の行は閉鎖', isValidPlacement([{ x: 9, y: 2 }], 1) === false);
        assert('他の行は影響なし', isValidPlacement([{ x: 9, y: 3 }], 1) === true);
        board[2 * BOARD_SIZE + 7] = 0; // 1石消えて3石に
        assert('3石に戻れば再び開放', isValidPlacement([{ x: 9, y: 2 }], 1) === true);
    `,
};
