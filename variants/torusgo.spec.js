// TORUSGO — トーラス碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'torusgo.html',
    en: 'TORUSGO',
    jp: 'トーラス碁',
    prefix: 'torusgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('TORUSGO', 'トーラス碁', 'torusgo'),
    [ONE, RV_BASE, rv([
        '盤面はトーラス: 上下・左右の端がつながっており、隅や辺が存在しない。',
        '端を越えても連・呼吸点・取り・地の判定はそのまま続く。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + トーラス盤<br>
            ※上下左右の端がつながっている (隅・辺なし)`],
    [ONE, NBRS_GRID,
`        // トーラス: 上下左右の端がループするので全点が等価 (隅・辺なし)
        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const xm = (x - 1 + BOARD_SIZE) % BOARD_SIZE;
            const xp = (x + 1) % BOARD_SIZE;
            const ym = (y - 1 + BOARD_SIZE) % BOARD_SIZE;
            const yp = (y + 1) % BOARD_SIZE;
            return [
                y * BOARD_SIZE + xm, y * BOARD_SIZE + xp,
                ym * BOARD_SIZE + x, yp * BOARD_SIZE + x
            ];
        }`],
    [ONE, `                const cells = shape.map(([dx, dy]) => ({ x: tx + dx, y: ty + dy }));`,
`                const cells = shape.map(([dx, dy]) => ({
                    x: ((tx + dx) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE,
                    y: ((ty + dy) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE
                }));`],
    [ONE, VALID_BOUNDS,
`            // トーラス盤: セル座標は正規化済み。端を回って同一点に重なる配置は不可。
            const seen = new Set();
            for (const p of cells) {
                const key = p.y * BOARD_SIZE + p.x;
                if (seen.has(key)) return false;
                seen.add(key);
                if (board[key] !== 0) return false;
            }`],
    ...WRAP_MARKS_SPEC(`chev(midC, padding * 0.55, 0, -1); chev(midC, width - padding * 0.55, 0, 1); chev(padding * 0.55, midC, -1, 0); chev(width - padding * 0.55, midC, 1, 0);`),
    // トーラス: 端の石は対側の端にも半透明で映る (ループの可視化)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // トーラス: 端の石は対側の端にも半透明で映る
            {
                ctx.save();
                ctx.globalAlpha = 0.30;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const v = board[y * BOARD_SIZE + x];
                    if (v !== 1 && v !== 2) continue;
                    ctx.fillStyle = v === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                    const ghost = (gx, gy) => {
                        ctx.beginPath();
                        ctx.arc(padding + gx * cellSize, padding + gy * cellSize, cellSize * 0.26, 0, Math.PI * 2);
                        ctx.fill();
                    };
                    if (x === 0) ghost(BOARD_SIZE - 1, y);
                    if (x === BOARD_SIZE - 1) ghost(0, y);
                    if (y === 0) ghost(x, BOARD_SIZE - 1);
                    if (y === BOARD_SIZE - 1) ghost(x, 0);
                }
                ctx.restore();
            }`],
    ...STONE_SPEC,
],
};
