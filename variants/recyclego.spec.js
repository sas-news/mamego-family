// RECYCLEGO — 再生碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'recyclego.html',
    en: 'RECYCLEGO',
    jp: '再生碁',
    prefix: 'recyclego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('RECYCLEGO', '再生碁', 'recyclego'),
    K.params([
        { key: 'revive_delay', label: '復活までの手数', min: 3, max: 30, def: 10, unit: '手' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '再生ルール: 取られた石は10手後に元の持ち主の色でランダムな空点に復活する。',
        'ただし再生は各石1回だけ — 再生した石をもう一度取れば完全に取り切れる。アゲハマは通常通り計上。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 再生ルール<br>
            ※取られた石は10手後に元の持ち主の石として1回だけ復活。200手で自動終局`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let returnQueue = []; // { player, due } — 再生待ちの石
        let revivedUsed = new Set(); // 再生済みの石 (二度目は消える)`],
    [ONE, RESET_BOARD,
`${RESET_BOARD}
            returnQueue = [];
            revivedUsed = new Set();`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    board[idx] = 0;
                    // 再生: 10手後に元の持ち主の色で復活 (各石1回だけ)
                    if (revivedUsed.has(idx)) revivedUsed.delete(idx);
                    else returnQueue.push({ player: opponent, due: history.length + (P('revive_delay') || 10) });
                });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 再生: 期限到来の石をランダムな空点に復活 (復活した石は再生済み)
            returnQueue = returnQueue.filter(q => {
                if (q.due > history.length) return true;
                const empties = [];
                for (let i = 0; i < board.length; i++) if (board[i] === 0) empties.push(i);
                if (!empties.length) return true;
                const ni = empties[(Math.random() * empties.length) | 0];
                board[ni] = q.player;
                revivedUsed.add(ni);
                // 復活演出: 緑の光と飛沫
                fxGlow(ni, 'rgba(74,222,128,0.9)', 800);
                fxBurst(ni, '#4ade80', 8, 1.2);
                fxText(ni, '復活', '#34d399', 1000);
                pieces.push({
                    id: Date.now() + Math.random(), player: q.player, type: 'STONE', rot: 0,
                    cells: [{ x: ni % BOARD_SIZE, y: (ni / BOARD_SIZE) | 0 }]
                });
                return false;
            });
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                returnQueue: returnQueue.map(q => ({ ...q })),
                revivedUsed: [...revivedUsed],
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            returnQueue = snap.returnQueue ? snap.returnQueue.map(q => ({ ...q })) : returnQueue;
            revivedUsed = new Set(snap.revivedUsed || []);`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    returnQueue: returnQueue.map(q => ({ ...q })),
                    revivedUsed: [...revivedUsed],
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            returnQueue = Array.isArray(s.returnQueue) ? s.returnQueue.map(q => ({ ...q })) : [];
            revivedUsed = new Set(s.revivedUsed || []);`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                returnQueue: returnQueue.map(q => ({ ...q })),
                revivedUsed: [...revivedUsed],
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (Array.isArray(data.returnQueue)) returnQueue = data.returnQueue.map(q => ({ ...q }));
            if (Array.isArray(data.revivedUsed)) revivedUsed = new Set(data.revivedUsed);`],
    ...EVENT_CHIP_SPEC(`(returnQueue.length ? '復活' + (Math.min(...returnQueue.map(q => q.due)) - history.length) + '手' : '')`),
    ...STONE_SPEC,
],
};
