// PUSHGO — 押し碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'pushgo.html',
    en: 'PUSHGO',
    jp: '押し碁',
    prefix: 'pushgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('PUSHGO', '押し碁', 'pushgo'),
    K.params([
        { key: 'push_dist', label: '押す距離', min: 1, max: 4, def: 1, unit: 'マス' },
    ]),
    [ONE, RV_BASE, rv([
        '押しルール: 置いた石に隣接する敵石は、その方向へ1マス押される。',
        '押し先が盤外または占有されている場合は押せない。押された後の取り判定は通常通り行われる。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 押しルール<br>
            ※置いた石に隣接する敵石は1マス押される (押し先が空の場合のみ)`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 押しルール: 置いた石に隣接する敵石を遠方へ1マス押す
            {
                const opp2 = player === 1 ? 2 : 1;
                move.cells.forEach(p => {
                    const pi = p.y * BOARD_SIZE + p.x;
                    getNeighbors(pi).forEach(ni => {
                        if (board[ni] !== opp2) return;
                        const nx = ni % BOARD_SIZE, ny = Math.floor(ni / BOARD_SIZE);
                        const tx = nx + (nx - p.x) * (P('push_dist') || 1), ty = ny + (ny - p.y) * (P('push_dist') || 1);
                        if (tx < 0 || tx >= BOARD_SIZE || ty < 0 || ty >= BOARD_SIZE) return;
                        const ti = ty * BOARD_SIZE + tx;
                        if (board[ti] !== 0) return;
                        board[ti] = opp2; board[ni] = 0;
                        fxSlide(ni, ti, 340); // 押し出される軌跡
                    });
                });
                cleanUpPieces();
            }`],
    ...STONE_SPEC,
],
};
