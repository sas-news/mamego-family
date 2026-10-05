// RINGO — 環状碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'ringo.html',
    en: 'RINGO',
    jp: '環状碁',
    prefix: 'ringo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('RINGO', '環状碁', 'ringo'),
    K.params([
        { key: 'hole_radius', label: '中央の壁の半径', min: 0, max: 4, def: 1 },
    ]),
    [ONE, RV_BASE, rv([
        '盤の中央3×3が壁 (使用不能領域) のドーナツ状盤面。',
        '壁は石を置けず、呼吸点にも地にもならない。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 環状盤<br>
            ※中央3×3が壁。壁は置けず呼吸点にも地にもならない`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 環状盤: 中央を壁にする (半径は設定の hole_radius、既定1=3x3)
            const c0 = Math.floor(BOARD_SIZE / 2);
            const holeR = Math.max(0, Math.min(4, P('hole_radius') || 1));
            for (let dy = -holeR; dy <= holeR; dy++) for (let dx = -holeR; dx <= holeR; dx++)
                board[(c0 + dy) * BOARD_SIZE + (c0 + dx)] = 3;`],
    // 中央は深い井戸
    [ONE, COVERED_ANCHOR, texDraw(PAINT_RIFT('rgba(70,110,170,0.45)'))],
    ...WALL_GUARD_SPEC,
    ...STONE_SPEC,
],
};
