// CHARGEGO — 溜め碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'chargego.html',
    en: 'CHARGEGO',
    jp: '溜め碁',
    prefix: 'chargego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('CHARGEGO', '溜め碁', 'chargego'),
    K.params([
        { key: 'armor_turns', label: '装甲の持続', min: 1, max: 15, def: 5, unit: '手' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '溜めルール: パスをすると溜めが貯まり、次に置く石が5手間取られなくなる (装甲)。',
        'パスの代償で絶対に死なない一手が打てる — 侵入・押さえ込みに有効。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 溜めルール<br>
            ※パスで溜めが貯まり次の石が5手間不死になる`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let passCharge = { 1: false, 2: false }; // 溜めフラグ
        let armorUntil = {};                     // 装甲の残り (idx -> 期限手数)`],
    [ONE, RESET_HELD,
`${RESET_HELD}
            passCharge = { 1: false, 2: false };
            armorUntil = {};`],
    // パス時に溜める — 溜まる瞬間の演出 (盤中央に稲光文字 + 微振動)
    [ONE, PASS_INC,
`${PASS_INC}
            passCharge[turn] = true; // 溜め
            {
                const cc = ((BOARD_SIZE - 1) >> 1) * BOARD_SIZE + ((BOARD_SIZE - 1) >> 1);
                fxText(cc, '⚡溜', '#fde047', 900);
                fxShake(2, 140);
            }`],
    // 配置時: 溜めがあれば装甲付与 — 装甲生成の演出
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            if (passCharge[player]) {
                passCharge[player] = false;
                move.cells.forEach(p => {
                    const ai = p.y * BOARD_SIZE + p.x;
                    armorUntil[ai] = history.length + (P('armor_turns') || 5);
                    fxGlow(ai, '#60a5fa', 900);
                    fxBurst(ai, '#93c5fd', 8, 1.1);
                    fxText(ai, '装甲!', '#bfdbfe', 1000);
                });
            }`],
    // 装甲のある敵石は取れない
    [ONE, CAPTURE_BLOCK,
`            let captured = getCapturedStones(board, opponent);
            // 装甲中の石は取れない (期限切れは取れる)
            captured = captured.filter(i => !(armorUntil[i] > history.length));
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; delete armorUntil[idx]; });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + (passCharge[turn] ? ' ⚡溜' : '');`],
    // undo/保存/同期
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                passCharge: { ...passCharge }, armorUntil: { ...armorUntil },
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            passCharge = snap.passCharge ? { ...snap.passCharge } : passCharge;
            armorUntil = snap.armorUntil ? { ...snap.armorUntil } : armorUntil;`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    passCharge: { ...passCharge }, armorUntil: { ...armorUntil },
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            if (s.passCharge) passCharge = { ...s.passCharge };
            if (s.armorUntil) armorUntil = { ...s.armorUntil };`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                passCharge, armorUntil,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.passCharge) passCharge = { ...data.passCharge };
            if (data.armorUntil) armorUntil = { ...data.armorUntil };`],
    // 装甲中の石に薄い青のリング
    ...STONE_MARKS_SPEC(`            // 装甲中の石: 薄い青のリング
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(80,130,220,0.75)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                for (const k in armorUntil) {
                    if (!(armorUntil[k] > history.length)) continue;
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    ctx.beginPath();
                    ctx.arc(padding + (i % BOARD_SIZE) * cellSize, padding + ((i / BOARD_SIZE) | 0) * cellSize, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
    ...STONE_SPEC,
],
};
