// BUDGETGO — 手数碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'budgetgo.html',
    en: 'BUDGETGO',
    jp: '手数碁',
    prefix: 'budgetgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('BUDGETGO', '手数碁', 'budgetgo'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 20, max: 200, def: 60, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '手数ルール: 合計60手に達すると自動終局し、その時点で得点計算する。',
        'パスで手数を稼ぐことはできない (パスも1手に数える)。手番横が残り手数。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 手数ルール<br>
            ※合計60手で自動終局。手番横が残り手数`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 残り手数の警告: 10/5/2手で盤中央に告知
            {
                const rem = (P('max_moves') || 60) - history.length;
                if (rem === 10 || rem === 5 || rem === 2) {
                    const cc = Math.floor(BOARD_SIZE / 2) * (BOARD_SIZE + 1);
                    fxText(cc, '残り' + rem + '手', '#f59e0b', 1200);
                    if (rem <= 2) fxShake(3, 200);
                }
            }
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 60)) { endGameByScore(); return; }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + ' 残' + Math.max(0, (P('max_moves') || 60) - history.length) + '手';`],
    ...STONE_SPEC,
],
};
