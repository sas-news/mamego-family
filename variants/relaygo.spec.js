// RELAYGO — 追撃碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'relaygo.html',
    en: 'RELAYGO',
    jp: '追撃碁',
    prefix: 'relaygo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('RELAYGO', '追撃碁', 'relaygo'),
    K.params([
        { key: 'max_dist', label: '追撃範囲', min: 1, max: 10, def: 4, unit: 'マス' },
    ]),
    [ONE, RV_BASE, rv([
        '追撃ルール: 相手の直前の着手からマンハッタン距離4以内にしか置けない。',
        '戦線が相手の着手を追いかける形で進む。序盤1手目のみ自由配置。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 追撃ルール<br>
            ※相手の直前着手から距離4以内のみ配置可`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 追撃ルール: 相手の直前着手から距離4以内
            if (lastMove && lastMove.player !== player) {
                const ok = cells.some(p => lastMove.cells.some(lp =>
                    Math.abs(lp.x - p.x) + Math.abs(lp.y - p.y) <= (P('max_dist') || 4)));
                if (!ok) return false;
            }`],
    // 追撃域: 相手の直前着手から距離4の菱形を示す
    CUE_GRID(`            // 追撃域: 相手の直前着手からマンハッタン距離4の範囲
            if (lastMove && lastMove.player !== turn && !gameOver) {
                ctx.save();
                lastMove.cells.forEach(lp => {
                    const cx = padding + lp.x * cellSize, cy = padding + lp.y * cellSize;
                    const r = (P('max_dist') || 4) * 1.1 * cellSize;
                    ctx.fillStyle = 'rgba(251,146,60,0.06)';
                    ctx.strokeStyle = 'rgba(251,146,60,0.5)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.setLineDash([cellSize * 0.14, cellSize * 0.10]);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - r);
                    ctx.lineTo(cx + r, cy);
                    ctx.lineTo(cx, cy + r);
                    ctx.lineTo(cx - r, cy);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                });
                ctx.restore();
            }`),
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
],
};
