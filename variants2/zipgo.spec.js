// ZIPGO — 縞封碁: 偶数手は直前手と同じ行、奇数手は同じ列に封じられる
const K = require('../gen_kit.js');
module.exports = {
    file: 'zipgo.html',
    en: 'ZIPGO',
    jp: '縞封碁',
    prefix: 'zipgo',
    desc: '奇数手は前の手の列、偶数手は行になぞられて指される縞模様の碁。',
    kind: 'zip',
    spec: [
        ...K.rb('ZIPGO', '縞封碁', 'zipgo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 縞封碁ルール: 直前の着手と座標を共有する線上に封じられる
            // 偶数手 = 前の手と同じ行 (横縞)、奇数手 = 同じ列 (縦縞)
            {
                if (lastMove && lastMove.cells.length > 0) {
                    const mv = history.length + 1;
                    const tgt = lastMove.cells[0];
                    for (const p of cells) {
                        if (mv % 2 === 0) {
                            if (p.y !== tgt.y) return false;
                        } else {
                            if (p.x !== tgt.x) return false;
                        }
                    }
                }
            }`],
        K.CUE_GRID(`            // 縞封: なぞるべき行/列を帯色で照らす
            {
                if (lastMove && lastMove.cells.length > 0) {
                    const mv2 = history.length + 1;
                    const tg = lastMove.cells[0];
                    ctx.save();
                    ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.14);
                    if (mv2 % 2 === 0) {
                        ctx.fillRect(-cellSize, padding + (tg.y - 0.5) * cellSize,
                            padding * 2 + BOARD_SIZE * cellSize, cellSize);
                    } else {
                        ctx.fillRect(padding + (tg.x - 0.5) * cellSize, -cellSize,
                            cellSize, padding * 2 + BOARD_SIZE * cellSize);
                    }
                    ctx.restore();
                }
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '偶数手は直前の着手と同じ行、奇数手は同じ列にのみ着手できる (初手は自由)。',
            '互いの手をなぞり合い、盤面は横縞と縦縞のジグザグに封じ込められていく。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        pieces.length = 0;
        history.length = 0;
        lastMove = null;
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1); // 1手目
        assert('2手目(偶数)は同じ行のみ', isValidPlacement([{ x: 7, y: 3 }], 2) === true);
        assert('2手目に別行は不可', isValidPlacement([{ x: 7, y: 5 }], 2) === false);
        executeMove({ cells: [{ x: 7, y: 3 }] }, 2); // 2手目
        assert('3手目(奇数)は同じ列のみ', isValidPlacement([{ x: 7, y: 6 }], 1) === true);
        assert('3手目に別列は不可', isValidPlacement([{ x: 6, y: 6 }], 1) === false);
    `,
};
