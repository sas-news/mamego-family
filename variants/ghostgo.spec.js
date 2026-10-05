// GHOSTGO — 幽霊碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'ghostgo.html',
    en: 'GHOSTGO',
    jp: '幽霊碁',
    prefix: 'ghostgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('GHOSTGO', '幽霊碁', 'ghostgo'),
    K.params([
        { key: 'ghost_life', label: '幽霊の残存', min: 2, max: 20, def: 6, unit: '手' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '幽霊ルール: 取られた石は消えず「幽霊」となって6手間そのマスを塞ぐ。',
        '幽霊は置けず呼吸点にもならないが、6手経つと消えて空点に戻る。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 幽霊ルール<br>
            ※取られたマスは幽霊となり6手間だけ塞がる`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let ghostTimer = []; // 幽霊の残りターン (idxごと)`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            ghostTimer = Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 幽霊: 取られたマスは幽霊(4)として6手間残る
                captured.forEach(idx => { board[idx] = 4; ghostTimer[idx] = (P('ghost_life') || 6); fxGlow(idx, 'rgba(165,190,235,0.9)', 650); });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 幽霊の消滅カウントダウン
            for (let gi = 0; gi < ghostTimer.length; gi++) {
                if (ghostTimer[gi] > 0 && --ghostTimer[gi] === 0 && board[gi] === 4) {
                    board[gi] = 0;
                    fxSplash(gi, '#aabde0', 7);
                }
            }
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    // 幽霊の描画
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 幽霊マスの描画 (漂う半透明の亡霊 + 残り手数)
            {
                const now = fxNow();
                for (let gy = 0; gy < BOARD_SIZE; gy++) {
                    for (let gx = 0; gx < BOARD_SIZE; gx++) {
                        const gi = gy * BOARD_SIZE + gx;
                        if (board[gi] !== 4) continue;
                        const bx = padding + gx * cellSize;
                        const by = padding + gy * cellSize;
                        const remain = ghostTimer[gi] || 0;
                        const bob = Math.sin(now / 420 + gi * 1.9) * cellSize * 0.04;
                        const gw = cellSize * 0.30;
                        ctx.save();
                        ctx.globalAlpha = 0.22 + 0.55 * (remain / (P('ghost_life') || 6));
                        // 丸い頭と波打つ裾のシルエット
                        const g2 = ctx.createLinearGradient(bx, by - gw, bx, by + gw * 1.4);
                        g2.addColorStop(0, 'rgba(196,210,240,0.95)');
                        g2.addColorStop(1, 'rgba(150,170,210,0.30)');
                        ctx.fillStyle = g2;
                        ctx.beginPath();
                        ctx.arc(bx, by + bob - cellSize * 0.05, gw, Math.PI, 0);
                        ctx.lineTo(bx + gw, by + bob + gw * 0.5);
                        for (let k = 0; k < 3; k++) {
                            const wx = bx + gw - (k + 0.5) * (gw * 2 / 3);
                            ctx.quadraticCurveTo(wx + gw / 6, by + bob + gw * 1.0 + Math.sin(now / 300 + k + gi) * cellSize * 0.03,
                                wx - gw / 6, by + bob + gw * 0.55);
                        }
                        ctx.closePath();
                        ctx.fill();
                        // 目と口
                        ctx.fillStyle = 'rgba(30,35,60,0.8)';
                        ctx.beginPath();
                        ctx.arc(bx - gw * 0.35, by + bob - gw * 0.2, cellSize * 0.045, 0, Math.PI * 2);
                        ctx.arc(bx + gw * 0.35, by + bob - gw * 0.2, cellSize * 0.045, 0, Math.PI * 2);
                        ctx.arc(bx, by + bob + gw * 0.15, cellSize * 0.05, 0, Math.PI * 2);
                        ctx.fill();
                        // 残り手数
                        ctx.fillStyle = 'rgba(225,235,255,0.95)';
                        ctx.font = 'bold ' + Math.round(cellSize * 0.30) + 'px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(String(remain), bx, by + cellSize * 0.42);
                        ctx.restore();
                    }
                }
            }`],
    [ONE, FALLBACK_SKIP,
`                    if (val !== 1 && val !== 2) continue; // 空点・幽霊は石として描かない`],
    [ONE, TOGGLE_GUARD,
`            const color = board[startIdx];
            if (color === 0 || color === 4) return;`],
    // 幽霊の永続化・同期
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    ghostTimer,
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            ghostTimer = Array.isArray(s.ghostTimer) ? s.ghostTimer : Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                ghostTimer,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (Array.isArray(data.ghostTimer)) ghostTimer = data.ghostTimer;`],
    // undo用スナップショット
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                ghostTimer: [...ghostTimer],
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            ghostTimer = snap.ghostTimer ? [...snap.ghostTimer] : ghostTimer;`],
    // 漂う霧 (幽霊の揺らぎを動かす駆動にもなる)
    [ONE, FX_BOOT, FX_BOOT + AMBIENT_MIST('170,190,220')],
    ...STONE_SPEC,
],
};
