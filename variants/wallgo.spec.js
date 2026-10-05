// WALLGO — 迷路碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'wallgo.html',
    en: 'WALLGO',
    jp: '迷路碁',
    prefix: 'wallgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('WALLGO', '迷路碁', 'wallgo'),
    K.params([
        { key: 'wall_rate', label: '壁の密度', min: 0.03, max: 0.5, def: 0.12, step: 0.01 },
    ]),
    [ONE, RV_BASE, rv([
        '対局開始時に盤上へランダムで壁マス (約12%) が配置される。',
        '壁は石を置けず、呼吸点にも地にもならない中立のブロック。取ることもできない。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 迷路壁<br>
            ※ランダムな壁マスがあり、置けない・呼吸点にも地にもならない`],
    [ONE, BOARD_DECL,
`        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白, 3:壁
        const WALL_RATE = 0.12; // 壁マスの密度`],
    // 壁の生成 (リセット時にランダム配置)
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 迷路ルール: 壁マスをランダム配置
            for (let i = 0; i < board.length; i++) {
                if (Math.random() < (P('wall_rate') || WALL_RATE)) board[i] = 3;
            }`],
    // 壁の描画: 瓦礫の岩ブロック + フォールバックで壁を石として描かないよう除外
    [ONE, COVERED_ANCHOR, texDraw(PAINT_ROCK('#6b6560', '#3f3a35'))],
    [ONE, FALLBACK_SKIP,
`                    if (val !== 1 && val !== 2) continue; // 空点・壁は石として描かない`],
    // 死に石選択で壁を選べないようにする
    [ONE, TOGGLE_GUARD,
`            const color = board[startIdx];
            if (color === 0 || color === 3) return;`],
    ...STONE_SPEC,
],
};
