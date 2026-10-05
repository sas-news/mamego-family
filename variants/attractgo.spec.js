// ATTRACTGO — 吸引碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'attractgo.html',
    en: 'ATTRACTGO',
    jp: '吸引碁',
    prefix: 'attractgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('ATTRACTGO', '吸引碁', 'attractgo'),
    K.params([
        { key: 'attract_dist', label: '吸引する距離', min: 2, max: 6, def: 2, unit: 'マス' },
    ]),
    [ONE, RV_BASE, rv([
        '吸引ルール: 置いた石の直線2マス先にいる敵石は、間のマスが空いていれば1マス引き寄せられる。',
        '引き寄せられた後の取り判定は通常通り行われる。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 吸引ルール<br>
            ※置いた石は直線2マス先の敵石を1マス引き寄せる`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 吸引ルール: 置いた石の直線2マス先にいる敵石を1マス引き寄せる
            {
                const opp2 = player === 1 ? 2 : 1;
                move.cells.forEach(p => {
                    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                        const ax = p.x + dx, ay = p.y + dy;
                        const bx = p.x + dx * (P('attract_dist') || 2), by = p.y + dy * (P('attract_dist') || 2);
                        if (bx < 0 || bx >= BOARD_SIZE || by < 0 || by >= BOARD_SIZE) return;
                        if (ax < 0 || ax >= BOARD_SIZE || ay < 0 || ay >= BOARD_SIZE) return;
                        const ai = ay * BOARD_SIZE + ax, bi = by * BOARD_SIZE + bx;
                        if (board[bi] === opp2 && board[ai] === 0) {
                            board[ai] = opp2; board[bi] = 0;
                            fxSlide(bi, ai, 360); // 引き寄せられる軌跡
                        }
                    });
                });
                cleanUpPieces();
            }`],
    ...STONE_SPEC,
],
};
