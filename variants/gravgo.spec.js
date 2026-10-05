// GRAVGO — 重力碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'gravgo.html',
    en: 'GRAVGO',
    jp: '重力碁',
    prefix: 'gravgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('GRAVGO', '重力碁', 'gravgo'),
    [ONE, RV_BASE, rv([
        '重力ルール: 石は盤の最下段か、真下に他の石がある交点にしか置けない。',
        '取りで支えを失った石は浮いたまま残る (落下はしない)。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 重力ルール<br>
            ※石は最下段または他の石の直上にしか置けない`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 重力ルール: 最下段か、真下の交点が既に占有されている場所のみ置ける
            if (!cells.every(p => p.y === BOARD_SIZE - 1 || board[(p.y + 1) * BOARD_SIZE + p.x] !== 0)) return false;`],
    // 着地の重み: 支えとなる真下の石 (または地面) を瞬間的に光らせる
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 重力の見える化: 着手を支える直下の石/地面を光らせる
            move.cells.forEach(p => {
                if (p.y < BOARD_SIZE - 1) fxGlow((p.y + 1) * BOARD_SIZE + p.x, 'rgba(200,170,90,0.8)', 550);
                else fxGlow(p.y * BOARD_SIZE + p.x, 'rgba(200,170,90,0.55)', 450);
            });`],
    // 重力方向の印: 下端余白の小さな三角
    CUE_STARS(`            // 重力方向の印: 下端中央の下向き三角
            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.6);
                const gx = padding + (BOARD_SIZE - 1) / 2 * cellSize, gy = width - padding * 0.42;
                const gs = cellSize * 0.11;
                ctx.beginPath();
                ctx.moveTo(gx - gs, gy - gs * 0.6);
                ctx.lineTo(gx + gs, gy - gs * 0.6);
                ctx.lineTo(gx, gy + gs * 0.8);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }`),
    // 地面: 最下段の下に地盤の帯
    CUE_GRID(`            // 地面: 最下段の下に地盤の帯
            {
                ctx.save();
                const gy = padding + (BOARD_SIZE - 0.5) * cellSize;
                const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                ctx.fillStyle = 'rgba(120,95,60,0.30)';
                ctx.fillRect(0, gy, w, cellSize * 0.5);
                ctx.strokeStyle = 'rgba(120,95,60,0.5)';
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                ctx.beginPath();
                ctx.moveTo(0, gy);
                ctx.lineTo(w, gy);
                ctx.stroke();
                ctx.restore();
            }`),
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
],
};
