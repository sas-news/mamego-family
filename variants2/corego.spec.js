// COREGO — 内核碁: 中央5x5の内核にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'corego.html',
    en: 'COREGO',
    jp: '内核碁',
    prefix: 'corego',
    desc: '着手は中央5x5の内核のみ。周縁は虚空、全ての闘争は核の中。',
    kind: 'core',
    spec: [
        ...K.rb('COREGO', '内核碁', 'corego'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 内核碁ルール: 中央5x5の交点にのみ着手可
            {
                const c = (BOARD_SIZE - 1) / 2;
                for (const p of cells) {
                    if (Math.abs(p.x - c) > 2 || Math.abs(p.y - c) > 2) return false;
                }
            }`],
        K.CUE_GRID(`            // 内核: 中央5x5の外側を暗く沈め、核を照らす
            {
                const cc = (BOARD_SIZE - 1) / 2;
                ctx.save();
                ctx.fillStyle = alphaColor(shiftColor(currentTheme.boardBg, -0.5), 0.45);
                const x0 = padding + (cc - 2.5) * cellSize, y0 = padding + (cc - 2.5) * cellSize;
                const x1 = padding + (cc + 2.5) * cellSize, y1 = padding + (cc + 2.5) * cellSize;
                const W = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                ctx.fillRect(-cellSize, -cellSize, W + cellSize * 2, y0 + cellSize);
                ctx.fillRect(-cellSize, y1, W + cellSize * 2, W);
                ctx.fillRect(-cellSize, y0, x0 + cellSize, y1 - y0);
                ctx.fillRect(x1, y0, W, y1 - y0);
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は中央5x5の内核のみ。周縁は暗い虚空。',
            '小さな核で激しい取り合いが即座に始まる。地はほぼ全域が争点。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const c = (BOARD_SIZE - 1) / 2;
        assert('天元は置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('核の端(c-2)は置ける', isValidPlacement([{ x: c - 2, y: c + 2 }], 1) === true);
        assert('核の外(c-3)は不可', isValidPlacement([{ x: c - 3, y: c }], 1) === false);
        assert('盤の角は不可', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
    `,
};
