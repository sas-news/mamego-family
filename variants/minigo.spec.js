// MINIGO — 少子碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'minigo.html',
    en: 'MINIGO',
    jp: '少子碁',
    prefix: 'minigo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('MINIGO', '少子碁', 'minigo'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '少子ルール (ミゼール): 得点計算は通常と同じだが、少ない側が勝つ。',
        '地もアゲハマも少ないほうが勝ち — 相手に取らせる・囲わせる逆転の碁。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 少子ルール<br>
            ※合計得点が少ない側の勝ち (ミゼール)`],
    [ONE, `            let winnerTitle = '';
            if (blackTotal > whiteTotal) winnerTitle = '黒の勝ち';
            else if (whiteTotal > blackTotal) winnerTitle = '白の勝ち';
            else winnerTitle = '引き分け';`,
`            let winnerTitle = '';
            // 少子ルール: 少ない側が勝ち
            if (blackTotal < whiteTotal) winnerTitle = '黒の勝ち';
            else if (whiteTotal < blackTotal) winnerTitle = '白の勝ち';
            else winnerTitle = '引き分け';`],
    [ONE, CAPTURE_BLOCK,
`${CAPTURE_BLOCK}

            // ミゼール: 大量に取るほど損 — 取り過ぎの警告
            if (captured.length >= 3) fxText(captured[0], '取り過ぎ注意', '#f97316', 1100);`],
    // ミゼール: 得点の少ない側が勝つ — アゲハマが増える側が劣勢
    ...EVENT_CHIP_SPEC(`'ミゼール アゲハマ ' + captures[1] + '-' + captures[2]`),
    ...STONE_SPEC,
],
};
