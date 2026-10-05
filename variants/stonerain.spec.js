// STONERAIN — 石雨碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'stonerain.html',
    en: 'STONERAIN',
    jp: '石雨碁',
    prefix: 'stonerain',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('STONERAIN', '石雨碁', 'stonerain'),
    K.params([
        { key: 'interval', label: '石雨間隔', min: 3, max: 30, def: 9, unit: '手' },
        { key: 'rain_count', label: '降る壁の数', min: 1, max: 5, def: 1, unit: '個' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '石雨ルール: 合計9手ごとにランダムな空点に中立の壁ブロックが1個降ってくる。',
        '壁は呼吸点にも地にもならず、盤面がだんだん欠けていく。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 石雨ルール<br>
            ※9手ごとにランダムな空点へ中立壁が降る`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 石雨: N手ごとにランダムな空点へ壁が降る (間隔・個数は設定で調整)
            if (history.length % (P('interval') || 9) === 0) {
                const empties = [];
                for (let i = 0; i < board.length; i++) if (board[i] === 0) empties.push(i);
                for (let rc0 = 0; rc0 < (P('rain_count') || 1) && empties.length; rc0++) {
                    const land = empties.splice((Math.random() * empties.length) | 0, 1)[0];
                    board[land] = 3;
                    fxGlow(land, '#fbbf24', 650);
                    fxBurst(land, '#a8a29e', 12, 1.7);
                    fxShake(5, 300);
                    fxText(land, 'ドン!', '#fdba74', 800);
                }
            }
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    // 降りた壁は玄武岩の隕石
    [ONE, COVERED_ANCHOR, texDraw(PAINT_METEOR)],
    ...WALL_GUARD_SPEC,
    ...EVENT_CHIP_SPEC(`'石雨' + ((P('interval') || 9) - history.length % (P('interval') || 9)) + '手'`),
    ...STONE_SPEC,
],
};
