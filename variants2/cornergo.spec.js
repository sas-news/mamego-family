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
        K.CUE_GRID(`            // 隅田川: 四隅の洲域を浅瀬色で照らす
            {
                const M = BOARD_SIZE - 1;
                ctx.save();
                const cell = (x, y) => {
                    const gx = padding + (x - 0.5) * cellSize, gy = padding + (y - 0.5) * cellSize;
                    const g = ctx.createLinearGradient(gx, gy, gx, gy + cellSize * 3);
                    g.addColorStop(0, 'rgba(125,190,220,0.30)');
                    g.addColorStop(1, 'rgba(80,140,190,0.16)');
                    ctx.fillStyle = g;
                    ctx.fillRect(gx, gy, cellSize * 3, cellSize * 3);
                };
                cell(0, 0); cell(M - 2, 0); cell(0, M - 2); cell(M - 2, M - 2);
                ctx.restore();
            }`),
        // 洲に揺れるさざ波
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        fxAmbient((ctx2, now, pad, cs) => {
            const M = BOARD_SIZE - 1;
            ctx2.save();
            ctx2.strokeStyle = '#bee3f8';
            ctx2.lineWidth = Math.max(1, cs * 0.04);
            [[0, 0], [M - 2, 0], [0, M - 2], [M - 2, M - 2]].forEach(([sx, sy], k) => {
                const cx = pad + (sx + 1) * cs, cy = pad + (sy + 1) * cs;
                const ph = Math.sin(now / 620 + k * 1.5);
                ctx2.globalAlpha = 0.18 + ph * 0.14;
                ctx2.beginPath();
                ctx2.arc(cx, cy, cs * (0.9 + ph * 0.2), 0, Math.PI * 2);
                ctx2.stroke();
            });
            ctx2.restore();
        });`],
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
