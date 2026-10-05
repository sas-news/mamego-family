// NOKOGO — 無コウ碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'nokogo.html',
    en: 'NOKOGO',
    jp: '無コウ碁',
    prefix: 'nokogo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('NOKOGO', '無コウ碁', 'nokogo'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '無コウルール: コウ禁止が存在しない。直前の盤面と同じ形に戻る着手も合法。',
        'コウ争いが即座に繰り返せるため、単劫は互いに取り合い続ける膠着になる。',
        '安全装置: 合計200手に達すると自動終局し得点計算する (劫争いの無限継続を防ぐ)。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 無コウルール<br>
            ※コウ禁止なし — 同一盤面の再現も合法。200手で自動終局`],
    [ONE, `            // コウ判定: 相手の直前の着手前と同一の盤面になる手は禁止
            if (captured.length > 0 && prevBoard) {
                if (after.every((v, i) => v === prevBoard[i])) return false;
            }`,
`            // 無コウ: コウ判定は行わない (同一盤面の再現も合法)`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局 (劫ループの膠着を防ぐ)
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    // 無コウ: 直前盤面への完全な逆戻り (劫返し) を可視化
    [ONE, CAPTURE_BLOCK,
`${CAPTURE_BLOCK}

            // 無コウ: 相手の着手前と同一盤面に戻った = 劫返し
            if (captured.length > 0 && prevBoard && board.every((v, i) => v === prevBoard[i])) {
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '劫返し!', '#a78bfa', 1000);
                fxGlow(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '#a78bfa', 700);
            }`],
    ...EVENT_CHIP_SPEC(`'無コウ 残' + Math.max(0, (P('max_moves') || 200) - history.length) + '手'`),
    ...STONE_SPEC,
],
};
