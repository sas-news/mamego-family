// RIMGO — 淵碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'rimgo.html',
    en: 'RIMGO',
    jp: '淵碁',
    prefix: 'rimgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('RIMGO', '淵碁', 'rimgo'),
    K.params([
        { key: 'edge_bonus', label: '外周ボーナス', min: 0, max: 4, def: 1, unit: '点/地' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '淵ルール: 終局時、外周1列の自分の地は2倍計算される。',
        '辺の取り合いが通常以上に重要になる外周重視碁。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 淵ルール<br>
            ※外周1列の地は2倍計算`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            // 淵: 外周の地の所有者を判定して2倍分を加算
            const n = BOARD_SIZE;
            const ringVis = new Set();
            let blackEdge = 0, whiteEdge = 0;
            const ringOwner = i => {
                const q = [i], vis = new Set([i]);
                let tb = false, tw = false;
                while (q.length) {
                    const c0 = q.pop();
                    getNeighbors(c0).forEach(m => {
                        if (board[m] === 0 && !vis.has(m)) { vis.add(m); q.push(m); }
                        else if (board[m] === 1) tb = true;
                        else if (board[m] === 2) tw = true;
                    });
                }
                vis.forEach(v => ringVis.add(v));
                return tb && !tw ? 1 : (!tb && tw ? 2 : 0);
            };
            for (let i = 0; i < n; i++) {
                [i, (n - 1) * n + i, i * n, i * n + n - 1].forEach(idx => {
                    if (board[idx] !== 0 || ringVis.has(idx)) return;
                    const o = ringOwner(idx);
                    if (o === 1) blackEdge++; else if (o === 2) whiteEdge++;
                });
            }
            const blackTotal = territory.black + blackEdge * (P('edge_bonus') ?? 1) + captures[1];
            const whiteTotal = territory.white + whiteEdge * (P('edge_bonus') ?? 1) + captures[2] + komi;`],
    [ONE, `<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の淵ボーナス:</span> <strong>+\${blackEdge * (P('edge_bonus') ?? 1)}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の淵ボーナス:</span> <strong>+\${whiteEdge * (P('edge_bonus') ?? 1)}</strong></div>`],
    // 淵: 得点2倍の外周リングを金色に染める
    CUE_GRID(`            // 淵: 得点2倍の外周リングを金色に染める
            {
                const o0 = padding - cellSize * 0.5, o1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                const i0 = padding + cellSize * 0.5, i1 = padding + (BOARD_SIZE - 1.5) * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(217, 119, 6, 0.14)';
                ctx.fillRect(o0, o0, o1 - o0, i0 - o0);
                ctx.fillRect(o0, i1, o1 - o0, o1 - i1);
                ctx.fillRect(o0, i0, i0 - o0, i1 - i0);
                ctx.fillRect(i1, i0, o1 - i1, i1 - i0);
                ctx.restore();
            }`),
    // 淵の境界: 外周1列と内側を隔てる破線の方形
    CUE_STARS(`            // 淵の境界: 外周1列(得点2倍)と内側を隔てる破線
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.4);
                ctx.lineWidth = Math.max(1, cellSize * 0.028);
                ctx.setLineDash([cellSize * 0.16, cellSize * 0.12]);
                const i0 = padding + cellSize * 0.5;
                ctx.strokeRect(i0, i0, (BOARD_SIZE - 2) * cellSize, (BOARD_SIZE - 2) * cellSize);
                ctx.restore();
            }`),
    ...STONE_SPEC,
],
};
