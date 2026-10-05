// SELFGO — 自爆碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'selfgo.html',
    en: 'SELFGO',
    jp: '自爆碁',
    prefix: 'selfgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('SELFGO', '自爆碁', 'selfgo'),
    [ONE, RV_BASE, rv([
        '自爆ルール: 自殺手が合法。着手の結果、呼吸点0になった自分の連は消滅し相手のアゲハマになる。',
        '敵の連を取る判定は通常通り先に行われる。捨て石の極致 — わざと自爆して局面を作り変えられる。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 自爆ルール<br>
            ※自殺手が合法。呼吸点0の自連は消えて相手のアゲハマになる`],
    [ONE, `            // 自殺手チェック: この手で自分の石(連)が窒息するなら禁止
            if (getCapturedStones(after, player).length > 0) return false;`,
`            // 自爆ルール: 自殺手も合法 (自連は消滅して相手のアゲハマになる)`],
    [ONE, CAPTURE_BLOCK,
`${CAPTURE_BLOCK}

            // 自爆: 着手の結果、呼吸点0になった自連も消滅 (相手のアゲハマ)
            const selfDead = getCapturedStones(board, player);
            if (selfDead.length > 0) {
                selfDead.forEach(idx => {
                    board[idx] = 0;
                    // 自爆演出: 暗い炎の爆発
                    fxBurst(idx, '#ef4444', 8, 1.4);
                    fxBurst(idx, '#78716c', 4, 0.9);
                });
                fxText(selfDead[0], '自爆!', '#fbbf24', 950);
                fxShake(4, 280);
                captures[opponent] += selfDead.length;
                soundManager.playCapture();
                cleanUpPieces();
            }`],
    ...STONE_SPEC,
],
};
