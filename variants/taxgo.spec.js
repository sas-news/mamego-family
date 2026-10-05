// TAXGO — 関税碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'taxgo.html',
    en: 'TAXGO',
    jp: '関税碁',
    prefix: 'taxgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('TAXGO', '関税碁', 'taxgo'),
    K.params([
        { key: 'tax', label: '関税', min: 0, max: 5, def: 1, unit: '目' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '関税ルール: 敵陣側の半分 (黒なら下半分、白なら上半分) に石を置くたび相手に+1目が入る。',
        '侵入は強力だが税がかかる — 攻め込みコストを考える碁。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 関税ルール<br>
            ※敵陣半分 (黒=下側/白=上側) への着手は相手に+1目`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let toll = { 1: 0, 2: 0 }; // 相手に支払った関税`],
    [ONE, RESET_HELD,
`${RESET_HELD}
            toll = { 1: 0, 2: 0 };`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 関税: 敵陣半分への着手は相手に+1目
            {
                const mid = Math.ceil(BOARD_SIZE / 2);
                if (move.cells.some(p => player === 1 ? p.y >= mid : p.y < BOARD_SIZE - mid)) {
                    toll[player] += (P('tax') ?? 1);
                    // 課税: 金の飛沫と関税告知
                    const ti = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxBurst(ti, '#facc15', 6, 1.1);
                    fxText(ti, '関税+' + (P('tax') ?? 1), '#eab308', 1000);
                }
            }`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + toll[2];
            const whiteTotal = territory.white + captures[2] + toll[1] + komi;`],
    [ONE, `<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の関税収入:</span> <strong>+\${toll[2]}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の関税収入:</span> <strong>+\${toll[1]}</strong></div>`],
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                toll: { ...toll },
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            if (snap.toll) toll = { ...snap.toll };`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    toll: { ...toll },
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            if (s.toll) toll = { ...s.toll };`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                toll: { ...toll },
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.toll) toll = { ...data.toll };`],
    // 関税: 上下の課税域 (上半分=白が課税/下半分=黒が課税) を薄く色分けし境界を破線で示す
    CUE_GRID(`            // 課税域の地色分け (上=白に+1の着手域, 下=黒に+1の着手域)
            {
                const mid = Math.ceil(BOARD_SIZE / 2);
                const y0 = padding - cellSize * 0.5, y1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                const x0 = padding - cellSize * 0.5, x1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                const t1 = padding + (BOARD_SIZE - mid - 0.5) * cellSize;
                const t2 = padding + (mid - 0.5) * cellSize;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.p1Stroke, 0.07);
                ctx.fillRect(x0, y0, x1 - x0, t1 - y0);
                ctx.fillStyle = alphaColor(currentTheme.p2Fill, 0.15);
                ctx.fillRect(x0, t2, x1 - x0, y1 - t2);
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.4);
                ctx.lineWidth = 1;
                ctx.setLineDash([cellSize * 0.16, cellSize * 0.12]);
                ctx.beginPath();
                ctx.moveTo(x0, t1); ctx.lineTo(x1, t1);
                ctx.moveTo(x0, t2); ctx.lineTo(x1, t2);
                ctx.stroke();
                ctx.restore();
            }`),
    ...STONE_SPEC,
],
};
