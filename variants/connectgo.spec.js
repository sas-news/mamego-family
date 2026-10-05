// CONNECTGO — 連絡碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'connectgo.html',
    en: 'CONNECTGO',
    jp: '連絡碁',
    prefix: 'connectgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('CONNECTGO', '連絡碁', 'connectgo'),
    [ONE, RV_BASE, rv([
        '連絡ルール: 黒は上辺と下辺、白は左辺と右辺を自分の石で連結すれば即勝利 (Hex型)。',
        '連結には通常の「連」(近傍共有)を使う。取り・地集計も通常通り有効。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 連絡ルール<br>
            ※黒は上下辺、白は左右辺を石で連結すれば即勝利`],
    [ONE, `        function endGameByScore() {`,
`        // 連絡勝利判定: 黒=上下辺、白=左右辺を同色連結
        function checkConnectWin(player) {
            const n = BOARD_SIZE;
            const isB = player === 1;
            const starts = [];
            const targets = new Set();
            for (let i = 0; i < n; i++) {
                const a = isB ? i : i * n;
                const b = isB ? (n - 1) * n + i : i * n + (n - 1);
                if (board[a] === player) starts.push(a);
                targets.add(b);
            }
            const seen = new Set(starts);
            const q = [...starts];
            while (q.length) {
                const cur = q.pop();
                if (targets.has(cur)) return true;
                getNeighbors(cur).forEach(nb => {
                    if (!seen.has(nb) && board[nb] === player) { seen.add(nb); q.push(nb); }
                });
            }
            return false;
        }
` + WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    [ONE, CAPTURE_BLOCK,
`${CAPTURE_BLOCK}

            // 連絡勝利判定
            if (checkConnectWin(player)) {
                winByRule(player, '連絡', player === 1 ? '黒が上辺と下辺を連結しました' : '白が左辺と右辺を連結しました');
                return;
            }`],
    // 連絡目標の端帯: 黒=上下辺, 白=左右辺
    CUE_GRID(`            // 連絡目標: 黒は上下辺・白は左右辺に微かな帯
            {
                const gb = cellSize * 0.17;
                const x0 = padding - cellSize * 0.5, y0 = padding - cellSize * 0.5;
                const x1 = padding + (BOARD_SIZE - 0.5) * cellSize, y1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.p2Fill, 0.22);
                ctx.fillRect(x0, y0, gb, y1 - y0);
                ctx.fillRect(x1 - gb, y0, gb, y1 - y0);
                ctx.fillStyle = alphaColor(currentTheme.p1Stroke, 0.13);
                ctx.fillRect(x0, y0, x1 - x0, gb);
                ctx.fillRect(x0, y1 - gb, x1 - x0, gb);
                ctx.restore();
            }`),
    // 連絡の進捗: 目標辺に接している連に色リング (どこまで繋がったか)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 連絡: 目標辺に接地した連を色リングで強調
            {
                const n = BOARD_SIZE;
                const mark = (pl, edges) => {
                    const seen = new Set();
                    edges.forEach(e => {
                        if (board[e] !== pl || seen.has(e)) return;
                        getConnectedGroup(e, pl).forEach(g => seen.add(g));
                    });
                    return seen;
                };
                const bEdge = [], wEdge = [];
                for (let i = 0; i < n; i++) { bEdge.push(i); bEdge.push((n - 1) * n + i); wEdge.push(i * n); wEdge.push(i * n + n - 1); }
                ctx.save();
                [[mark(1, bEdge), 'rgba(30,30,30,0.55)'], [mark(2, wEdge), 'rgba(255,255,255,0.65)']].forEach(([set, col]) => {
                    ctx.strokeStyle = col;
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                    set.forEach(i => {
                        const cx = padding + (i % n) * cellSize, cy = padding + ((i / n) | 0) * cellSize;
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.52, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`],
    ...STONE_SPEC,
],
};
