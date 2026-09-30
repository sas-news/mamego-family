// POLEGO — 極軸碁: 中央十字を極軸に、そこから隣接してしか広がれない
const K = require('../gen_kit.js');
module.exports = {
    file: 'polego.html',
    en: 'POLEGO',
    jp: '極軸碁',
    prefix: 'polego',
    desc: '着手は中央十字線上か自石に隣接する点。十字の軸から陣地を育てる。',
    kind: 'pole',
    spec: [
        ...K.rb('POLEGO', '極軸碁', 'polego'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 極軸碁ルール: 中央十字線上、または自石に直交隣接する点のみ着手可
            {
                const c = (BOARD_SIZE - 1) / 2;
                for (const p of cells) {
                    if (p.x === c || p.y === c) continue; // 極軸上は常に可
                    const idx = p.y * BOARD_SIZE + p.x;
                    const touchOwn = getNeighbors(idx).some(n => board[n] === player);
                    if (!touchOwn) return false;
                }
            }`],
        K.CUE_GRID(`            // 極軸: 中央十字を薄く照らす
            {
                const c = (BOARD_SIZE - 1) / 2;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.14);
                ctx.fillRect(-cellSize, padding + (c - 0.5) * cellSize,
                    padding * 2 + BOARD_SIZE * cellSize, cellSize);
                ctx.fillRect(padding + (c - 0.5) * cellSize, -cellSize,
                    cellSize, padding * 2 + BOARD_SIZE * cellSize);
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は中央の十字線 (極軸) 上か、自分の石に直交隣接する点のみ。',
            '初手は必ず極軸上。そこから自石に連なるように陣地を広げていく。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const c = (BOARD_SIZE - 1) / 2;
        assert('中央十字の横軸は置ける', isValidPlacement([{ x: 2, y: c }], 1) === true);
        assert('中央十字の縦軸は置ける', isValidPlacement([{ x: c, y: 8 }], 1) === true);
        assert('軸外・孤立点は不可', isValidPlacement([{ x: 2, y: 2 }], 1) === false);
        board[(c - 1) * BOARD_SIZE + c] = 1; // (c, c-1)に黒
        assert('自石の隣なら軸外でも置ける', isValidPlacement([{ x: c - 1, y: c - 1 }], 1) === true);
        board[(c - 2) * BOARD_SIZE + (c + 1)] = 2; // (c+1, c-2)に白
        assert('敵石の隣では広がらない', isValidPlacement([{ x: c + 1, y: c - 3 }], 1) === false);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
