// HYDRAGO — ヒドラ碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'hydrago.html',
    en: 'HYDRAGO',
    jp: 'ヒドラ碁',
    prefix: 'hydrago',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('HYDRAGO', 'ヒドラ碁', 'hydrago'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        'ヒドラルール: 取られた石は隣のランダムな空点に1つずつ復活する (復活先がなければ消える)。',
        'ただし復活は各石1回だけ — 再生した石をもう一度取れば完全に取り切れる。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + ヒドラルール<br>
            ※取られた石は隣のランダムな空点に1回だけ復活。200手で自動終局`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let hydraUsed = new Set(); // 復活済みの石 (二度目は消える)`],
    [ONE, RESET_BOARD,
`${RESET_BOARD}
            hydraUsed = new Set();`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                // ヒドラ: 取られた石は隣の空点に1回だけランダム復活
                captured.forEach(idx => {
                    if (hydraUsed.has(idx)) { hydraUsed.delete(idx); return; }
                    const cand = getNeighbors(idx).filter(i => board[i] === 0);
                    if (cand.length) {
                        const ni = cand[(Math.random() * cand.length) | 0];
                        board[ni] = opponent;
                        hydraUsed.add(ni);
                        // 再生: 取跡から新しい頭が生える
                        fxSlide(idx, ni, 420);
                        fxGlow(ni, 'rgba(52,211,153,0.85)', 650);
                    }
                });
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    // 再生済みヒドラ頭に緑の小点
    ...STONE_MARKS_SPEC(`            // 再生済みヒドラ頭: 緑の小点 (もう取り切れる印)
            {
                ctx.save();
                ctx.fillStyle = 'rgba(52,211,153,0.95)';
                for (const idx of hydraUsed) {
                    const v = board[idx];
                    if (v !== 1 && v !== 2) continue;
                    const cx = padding + (idx % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(idx / BOARD_SIZE) * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.10, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                hydraUsed: [...hydraUsed],
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            hydraUsed = new Set(snap.hydraUsed || []);`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    hydraUsed: [...hydraUsed],
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            hydraUsed = new Set(s.hydraUsed || []);`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                hydraUsed: [...hydraUsed],
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (Array.isArray(data.hydraUsed)) hydraUsed = new Set(data.hydraUsed);`],
    ...STONE_SPEC,
],
};
