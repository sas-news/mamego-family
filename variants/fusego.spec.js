// FUSEGO — 融合碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'fusego.html',
    en: 'FUSEGO',
    jp: '融合碁',
    prefix: 'fusego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('FUSEGO', '融合碁', 'fusego'),
    [ONE, RV_BASE, rv([
        '融合ルール: 置いた石に隣接する敵石は「中和」されて中立ブロック (壁) に変わる。',
        '中和された石はアゲハマにならず、そのマスは以後使えない。通常の取り判定も有効。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 融合ルール<br>
            ※置いた石に隣接する敵石は中立ブロックに変わる (アゲハマにならない)`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 融合ルール: 置いた石に隣接する敵石を中立ブロック(壁)に変える
            {
                const opp2 = player === 1 ? 2 : 1;
                const fused = [];
                move.cells.forEach(p => {
                    getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => {
                        if (board[n] === opp2) fused.push(n);
                    });
                });
                fused.forEach(i => { board[i] = 3; fxGlow(i, '#f59e0b', 560); fxBurst(i, '#d6d3d1', 6, 1.1); });
                if (fused.length) {
                    fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '中和!', '#fbbf24', 900);
                    cleanUpPieces();
                }
            }`],
    // 中和ブロックはリベット留めの鋼板
    [ONE, COVERED_ANCHOR, texDraw(PAINT_STEEL)],
    ...WALL_GUARD_SPEC,
    ...STONE_SPEC,
],
};
