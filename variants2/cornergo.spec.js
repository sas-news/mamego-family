// CORNERGO — 隅田川碁: 四隅から始まり、占有域から川のように拡大する
const K = require('../gen_kit.js');
module.exports = {
    file: 'cornergo.html',
    en: 'CORNERGO',
    jp: '隅田川碁',
    prefix: 'cornergo',
    desc: '着手は四隅の洲か自石に隣接する点。隅から川が広がるように染まる。',
    kind: 'corner',
    spec: [
        ...K.rb('CORNERGO', '隅田川碁', 'cornergo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 隅田川碁ルール: 四隅の3x3洲域、または自石に直交隣接する点のみ着手可
            {
                const M = BOARD_SIZE - 1;
                const inShoal = (x, y) =>
                    (x <= 2 && y <= 2) || (x >= M - 2 && y <= 2) ||
                    (x <= 2 && y >= M - 2) || (x >= M - 2 && y >= M - 2);
                for (const p of cells) {
                    if (inShoal(p.x, p.y)) continue; // 隅の洲は常に開かれている
                    const idx = p.y * BOARD_SIZE + p.x;
                    const touchOwn = getNeighbors(idx).some(n => board[n] === player);
                    if (!touchOwn) return false;
                }
            }`],
        K.CUE_GRID(`            // 隅田川: 四隅の洲域を薄く照らす
            {
                const M = BOARD_SIZE - 1;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.13);
                const cell = (x, y) => ctx.fillRect(padding + (x - 0.5) * cellSize,
                    padding + (y - 0.5) * cellSize, cellSize * 3, cellSize * 3);
                cell(0, 0); cell(M - 2, 0); cell(0, M - 2); cell(M - 2, M - 2);
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は四隅の3x3洲域か、自分の石に直交隣接する点のみ。',
            '隅から始めて自石に連なりながら川のように中央へ広がっていく。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const M = BOARD_SIZE - 1;
        assert('左上の洲は置ける', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
        assert('右下の洲は置ける', isValidPlacement([{ x: M - 1, y: M - 1 }], 1) === true);
        assert('中央は孤立して置けない', isValidPlacement([{ x: 6, y: 6 }], 1) === false);
        board[2 * BOARD_SIZE + 2] = 1; // (2,2)に黒
        assert('洲の石に連なって拡大可', isValidPlacement([{ x: 3, y: 2 }], 1) === true);
        assert('白は自石が無いと拡大不可', isValidPlacement([{ x: 3, y: 2 }], 2) === false);
    `,
};
