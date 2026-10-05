// DIAGO — 斜め碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'diago.html',
    en: 'DIAGO',
    jp: '斜め碁',
    prefix: 'diago',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('DIAGO', '斜め碁', 'diago'),
    [ONE, RV_BASE, rv([
        '近傍は斜めを含む8方向: 斜めに隣接する石も連になり、呼吸点・取り・地の判定も8方向で行う。',
        '斜めの連だけでも連結扱いになるため、従来よりはるかに強く繋がる。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 斜め連結<br>
            ※近傍は8方向: 斜めに隣接する石も連になる`],
    [ONE, NBRS_GRID,
`        // 斜め碁: 近傍は斜めを含む8方向 (連・呼吸点・取り・地すべて8方向)
        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) continue;
                    neighbors.push(ny * BOARD_SIZE + nx);
                }
            }
            return neighbors;
        }`],
    // 8方向連: 斜めに隣接する同色石を細線で結ぶ (石の下に敷く)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 斜め連結の補助線
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.3);
                ctx.lineWidth = Math.max(1, cellSize * 0.06);
                ctx.beginPath();
                for (let dy = 0; dy < BOARD_SIZE - 1; dy++) for (let dx = 0; dx < BOARD_SIZE - 1; dx++) {
                    const v = board[dy * BOARD_SIZE + dx];
                    if (v !== 1 && v !== 2) continue;
                    if (board[(dy + 1) * BOARD_SIZE + (dx + 1)] === v) { ctx.moveTo(padding + dx * cellSize, padding + dy * cellSize); ctx.lineTo(padding + (dx + 1) * cellSize, padding + (dy + 1) * cellSize); }
                }
                for (let dy = 0; dy < BOARD_SIZE - 1; dy++) for (let dx = 1; dx < BOARD_SIZE; dx++) {
                    const v = board[dy * BOARD_SIZE + dx];
                    if (v !== 1 && v !== 2) continue;
                    if (board[(dy + 1) * BOARD_SIZE + (dx - 1)] === v) { ctx.moveTo(padding + dx * cellSize, padding + dy * cellSize); ctx.lineTo(padding + (dx - 1) * cellSize, padding + (dy + 1) * cellSize); }
                }
                ctx.stroke();
                ctx.restore();
            }`],
    // 斜め盤の質感: 全交点に薄い斜め筋を散りばめる (斜め連結の盤)
    [ONE, `            // 格子線`, `            // 斜め筋の地紋
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.12);
                ctx.lineWidth = Math.max(1, cellSize * 0.03);
                const t = cellSize * 0.11;
                ctx.beginPath();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.moveTo(cx - t, cy - t); ctx.lineTo(cx + t, cy + t);
                    ctx.moveTo(cx - t, cy + t); ctx.lineTo(cx + t, cy - t);
                }
                ctx.stroke();
                ctx.restore();
            }

            // 格子線`],
    ...STONE_SPEC,
],
};
