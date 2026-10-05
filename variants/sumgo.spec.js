// SUMGO — 実子碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'sumgo.html',
    en: 'SUMGO',
    jp: '実子碁',
    prefix: 'sumgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('SUMGO', '実子碁', 'sumgo'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '実子ルール: 得点 = 地 + 盤上の生き石 + アゲハマ (+白はコミ)。中国式の子地皆数に近い。',
        '石を置くこと自体が得点なので地の詰め合いより勢力拡大が重要。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 実子得点<br>
            ※得点=地+盤上の石数+アゲハマ (中国式風)`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackStones = board.filter(v => v === 1).length;
            const whiteStones = board.filter(v => v === 2).length;
            const blackTotal = territory.black + blackStones + captures[1];
            const whiteTotal = territory.white + whiteStones + captures[2] + komi;`],
    [ONE, `<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の生き石:</span> <strong>\${blackStones}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の生き石:</span> <strong>\${whiteStones}</strong></div>`],
    // 実子: 盤上の生き石数を常時表示 (石がそのまま得点)
    ...EVENT_CHIP_SPEC(`'実子 ' + board.filter(v => v === 1).length + '-' + board.filter(v => v === 2).length`),
    ...STONE_SPEC,
],
};
