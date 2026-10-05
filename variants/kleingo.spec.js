// KLEINGO — クライン碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'kleingo.html',
    en: 'KLEINGO',
    jp: 'クライン碁',
    prefix: 'kleingo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('KLEINGO', 'クライン碁', 'kleingo'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        'クライン瓶ルール: 左右端は上下反転で繋がり、上下端も普通にループする。',
        'トーラスよりさらにねじれたトポロジー。全ての端が存在しない。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + クライン瓶<br>
            ※左右端は上下反転で接続、上下端もループ。端は存在しない`],
    [ONE, NBRS_GRID,
`        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            // 左右: 反転ループ (クライン瓶のねじれ)
            if (x > 0) neighbors.push(idx - 1);
            else neighbors.push((BOARD_SIZE - 1 - y) * BOARD_SIZE + BOARD_SIZE - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            else neighbors.push((BOARD_SIZE - 1 - y) * BOARD_SIZE);
            // 上下: 通常ループ
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            else neighbors.push((BOARD_SIZE - 1) * BOARD_SIZE + x);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            else neighbors.push(x);

            return neighbors;
        }`],
    // 左右=反転ループ(オフセット), 上下=通常ループ(中央)
    ...WRAP_MARKS_SPEC(`chev(padding * 0.55, padding + (BOARD_SIZE - 1) * cellSize * 0.3, -1, 0); chev(width - padding * 0.55, padding + (BOARD_SIZE - 1) * cellSize * 0.7, 1, 0); chev(midC, padding * 0.55, 0, -1); chev(midC, width - padding * 0.55, 0, 1);`),
    // クライン瓶: 端の石は対側にも半透明で映る (左右は上下反転)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // クライン瓶: 端の石は対側にも半透明で映る (左右は反転位置)
            {
                ctx.save();
                ctx.globalAlpha = 0.30;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const v = board[y * BOARD_SIZE + x];
                    if (v !== 1 && v !== 2) continue;
                    ctx.fillStyle = v === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                    const ghost = (gx, gy) => {
                        ctx.beginPath();
                        ctx.arc(padding + gx * cellSize, padding + gy * cellSize, cellSize * 0.26, 0, Math.PI * 2);
                        ctx.fill();
                    };
                    if (x === 0) ghost(BOARD_SIZE - 1, BOARD_SIZE - 1 - y);
                    if (x === BOARD_SIZE - 1) ghost(0, BOARD_SIZE - 1 - y);
                    if (y === 0) ghost(x, BOARD_SIZE - 1);
                    if (y === BOARD_SIZE - 1) ghost(x, 0);
                }
                ctx.restore();
            }`],
    ...STONE_SPEC,
],
};
