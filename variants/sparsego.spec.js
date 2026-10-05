// SPARSEGO — 離散碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'sparsego.html',
    en: 'SPARSEGO',
    jp: '離散碁',
    prefix: 'sparsego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('SPARSEGO', '離散碁', 'sparsego'),
    [ONE, RV_BASE, rv([
        '離散ルール: いかなる石 (敵味方問わず) に隣接する空点には置けない。',
        '全ての石は孤立し、取り合いは発生しない。地の囲い合いのみの静かな碁。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 離散ルール<br>
            ※どの石にも隣接する点には置けない (全石が孤立)`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 離散ルール: いかなる石の隣にも置けない
            if (cells.some(p =>
                getNeighbors(p.y * BOARD_SIZE + p.x).some(n => board[n] === 1 || board[n] === 2))) return false;`],
    // 離散の可視化: あらゆる石に隣接する空点 (禁手) に薄い×
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 離散: どの石にも隣接する空点は禁手 — 薄い×を刻む
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(120,80,60,0.38)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                const t = cellSize * 0.13;
                ctx.beginPath();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 0) continue;
                    if (!getNeighbors(i).some(n => board[n] === 1 || board[n] === 2)) continue;
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
