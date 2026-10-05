// CYLINDGO — 円筒碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'cylindgo.html',
    en: 'CYLINDGO',
    jp: '円筒碁',
    prefix: 'cylindgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('CYLINDGO', '円筒碁', 'cylindgo'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '円筒ルール: 盤の左端と右端が繋がっている (上下は繋がらない)。',
        '端の概念が左右だけ消え、横に回り込んだ取りが成立する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 円筒ルール<br>
            ※左右の端がループして繋がる (上下端は通常通り)`],
    [ONE, NBRS_GRID,
`        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            // 左右はループ (円筒)、上下は通常
            if (x > 0) neighbors.push(idx - 1);
            else neighbors.push(y * BOARD_SIZE + BOARD_SIZE - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            else neighbors.push(y * BOARD_SIZE);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            return neighbors;
        }`],
    ...WRAP_MARKS_SPEC(`chev(padding * 0.55, midC, -1, 0); chev(width - padding * 0.55, midC, 1, 0);`),
    // 円筒: 左右端の石は対側の端にも半透明で映る (ループの可視化)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 円筒: 左右端の石は対側の端にも半透明で映る
            {
                ctx.save();
                ctx.globalAlpha = 0.30;
                for (let y = 0; y < BOARD_SIZE; y++) {
                    [[0, BOARD_SIZE - 1], [BOARD_SIZE - 1, 0]].forEach(([sx, gx]) => {
                        const v = board[y * BOARD_SIZE + sx];
                        if (v !== 1 && v !== 2) return;
                        ctx.fillStyle = v === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                        ctx.beginPath();
                        ctx.arc(padding + gx * cellSize, padding + y * cellSize, cellSize * 0.26, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
                ctx.restore();
            }`],
    ...STONE_SPEC,
],
};
