// SANDGO — ハサミ碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'sandgo.html',
    en: 'SANDGO',
    jp: 'ハサミ碁',
    prefix: 'sandgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('SANDGO', 'ハサミ碁', 'sandgo'),
    [ONE, RV_BASE, rv([
        'ハサミ取り: 着手後、自分の石で上下か左右に一直線に挟まれた敵石は呼吸点に関係なく取られる。',
        '挟まれた側は自分の番では取られないので、隙間に逃げ込む手は安全。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + ハサミ取り<br>
            ※敵石を上下/左右に一直線に挟むと呼吸点に関係なく取れる`],
    [ONE, `            // ネクストモードでは次のピースを供給`,
`            // ハサミ取り: 着手側の石で上下または左右に挟まれた敵石を追加捕獲
            {
                const squeezed = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== opponent) continue;
                    const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                    const l = sx > 0 ? board[i - 1] : -1;
                    const r = sx < BOARD_SIZE - 1 ? board[i + 1] : -1;
                    const u = sy > 0 ? board[i - BOARD_SIZE] : -1;
                    const d = sy < BOARD_SIZE - 1 ? board[i + BOARD_SIZE] : -1;
                    if ((l === player && r === player) || (u === player && d === player)) {
                        squeezed.push(i);
                    }
                }
                if (squeezed.length > 0) {
                    squeezed.forEach(i => { board[i] = 0; fxBurst(i, '#f59e0b', 7, 1.3); });
                    fxText(squeezed[0], 'ハサミ!', '#d97706', 900);
                    fxShake(3, 220);
                    captures[player] += squeezed.length;
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            }

            // ネクストモードでは次のピースを供給`],
    ...STONE_SPEC,
],
};
