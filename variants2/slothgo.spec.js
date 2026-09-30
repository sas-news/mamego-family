// SLOTHGO — 遅滞碁: 直近2手の行と列には着手できない
const K = require('../gen_kit.js');
module.exports = {
    file: 'slothgo.html',
    en: 'SLOTHGO',
    jp: '遅滞碁',
    prefix: 'slothgo',
    desc: '直前2つの着手の行と列は封鎖される。熱した筋が冷めるまで打てない。',
    kind: 'sloth',
    spec: [
        ...K.rb('SLOTHGO', '遅滞碁', 'slothgo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 遅滞碁ルール: 直近2手 (色問わず) の行と列は封鎖中
            {
                const recent = [];
                if (lastMove && lastMove.cells.length > 0) recent.push(lastMove.cells[0]);
                if (history.length > 0) {
                    const lm = history[history.length - 1].lastMove;
                    if (lm && lm.cells.length > 0) recent.push(lm.cells[0]);
                }
                for (const m of recent) {
                    for (const p of cells) {
                        if (p.x === m.x || p.y === m.y) return false;
                    }
                }
            }`],
        K.CUE_GRID(`            // 遅滞: 封鎖中の行と列を暗い帯で示す
            {
                const rec = [];
                if (lastMove && lastMove.cells.length > 0) rec.push(lastMove.cells[0]);
                if (history.length > 0) {
                    const lm = history[history.length - 1].lastMove;
                    if (lm && lm.cells.length > 0) rec.push(lm.cells[0]);
                }
                ctx.save();
                ctx.fillStyle = alphaColor(shiftColor(currentTheme.boardBg, -0.5), 0.30);
                for (const m of rec) {
                    ctx.fillRect(-cellSize, padding + (m.y - 0.5) * cellSize,
                        padding * 2 + BOARD_SIZE * cellSize, cellSize);
                    ctx.fillRect(padding + (m.x - 0.5) * cellSize, -cellSize,
                        cellSize, padding * 2 + BOARD_SIZE * cellSize);
                }
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '直近2手 (自分・相手問わず) と同じ行・列には着手できない。',
            '打たれた筋は次の2手の間冷めるまで封鎖される。盤を広く使わされる碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        pieces.length = 0;
        history.length = 0;
        lastMove = null;
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1);
        assert('直前手の列は封鎖', isValidPlacement([{ x: 3, y: 8 }], 2) === false);
        assert('直前手の行は封鎖', isValidPlacement([{ x: 8, y: 4 }], 2) === false);
        assert('別行列なら置ける', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        // 直近2手 = (8,8)と(3,4)
        assert('2手前の行もまだ封鎖', isValidPlacement([{ x: 6, y: 4 }], 1) === false);
        assert('2手前の列もまだ封鎖', isValidPlacement([{ x: 3, y: 6 }], 1) === false);
        assert('無関係な点は置ける', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
