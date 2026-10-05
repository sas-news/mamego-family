// KOGO — 孤立碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'kogo.html',
    en: 'KOGO',
    jp: '孤立碁',
    prefix: 'kogo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('KOGO', '孤立碁', 'kogo'),
    [ONE, RV_BASE, rv([
        '孤立ルール: 自分の石に隣接する空点には置けない。自連は一切作れず、全石が単独のまま。',
        '取り・呼吸点・自殺禁止・コウは通常通り。単石は最大4呼吸点しか持てないため脆い。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 孤立ルール<br>
            ※自分の石に隣接する点には置けない (全石が孤立単石)`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 孤立ルール: 自分の石に隣接する点には置けない
            if (cells.some(p =>
                getNeighbors(p.y * BOARD_SIZE + p.x).some(n => board[n] === player))) return false;`],
    // 孤立の可視化: 手番側の石に隣接する空点 (禁手) に小さな×
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 孤立: 手番側の石に隣接する空点は禁手 — 小さな×を刻む
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(220,38,38,0.42)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                const t = cellSize * 0.13;
                ctx.beginPath();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 0) continue;
                    if (!getNeighbors(i).some(n => board[n] === turn)) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                    ctx.moveTo(cx - t, cy - t); ctx.lineTo(cx + t, cy + t);
                    ctx.moveTo(cx - t, cy + t); ctx.lineTo(cx + t, cy - t);
                }
                ctx.stroke();
                ctx.restore();
            }`],
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
],
};
