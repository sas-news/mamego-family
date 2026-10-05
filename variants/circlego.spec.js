// CIRCLEGO — 円盤碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'circlego.html',
    en: 'CIRCLEGO',
    jp: '円盤碁',
    prefix: 'circlego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('CIRCLEGO', '円盤碁', 'circlego'),
    K.params([
        { key: 'rim', label: '円の縮み', min: 0, max: 3, def: 0, step: 0.5, unit: 'マス' },
    ]),
    [ONE, RV_BASE, rv([
        '盤面は円形 — 中心から半径 (N-1)/2 より外のマスは壁 (使用不能)。',
        '「隅」が存在しない盤面で戦う囲碁。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 円形盤<br>
            ※円の外側は壁。壁は置けず呼吸点にも地にもならない`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 円形盤: 半径より外を壁にする (縮みは設定の rim、既定0)
            const crad = (BOARD_SIZE - 1) / 2;
            const crim = crad - (P('rim') || 0);
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const ddx = x - crad, ddy = y - crad;
                if (ddx * ddx + ddy * ddy > crim * crim + 0.5) board[y * BOARD_SIZE + x] = 3;
            }`],
    // 正方形の外枠は描かない (円縁が外枠になる)
    [ONE, GRID_RENDER,
`            // 格子線
            ctx.strokeStyle = currentTheme.lineColor;
            ctx.lineWidth = Math.max(1, cellSize * 0.028);
            for (let i = 0; i < BOARD_SIZE; i++) {
                const pos = padding + i * cellSize;
                ctx.beginPath();
                ctx.moveTo(pos, padding);
                ctx.lineTo(pos, width - padding);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(padding, pos);
                ctx.lineTo(width - padding, pos);
                ctx.stroke();
            }

            // 星 (天元・星の点)
            const starPoints = getStarPoints(BOARD_SIZE);
            ctx.fillStyle = currentTheme.starColor;
            const starR = Math.max(2.5, cellSize * 0.10);
            starPoints.forEach(pt => {
                const cx = padding + pt.x * cellSize;
                const cy = padding + pt.y * cellSize;
                ctx.beginPath();
                ctx.arc(cx, cy, starR, 0, Math.PI * 2);
                ctx.fill();
            });`],
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`, CIRCLE_DRAW],
    ...WALL_GUARD_SPEC,
    // 円盤の艶: 円縁をなぞる光の帯がゆっくり回る
    [ONE, FX_BOOT,
`${FX_BOOT}
        fxAmbient((ctx2, now, pad, cs) => {
            const cr = (BOARD_SIZE - 1) / 2;
            const bx = pad + cr * cs, by = pad + cr * cs, rr = (cr - (P('rim') || 0) + 0.55) * cs;
            const a0 = now / 2400;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(255,255,255,0.16)';
            ctx2.lineWidth = Math.max(1.5, cs * 0.10);
            ctx2.beginPath();
            ctx2.arc(bx, by, rr, a0, a0 + Math.PI * 0.35);
            ctx2.stroke();
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
