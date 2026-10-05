// CHAOTICGO — 混沌碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'chaoticgo.html',
    en: 'CHAOTICGO',
    jp: '混沌碁',
    prefix: 'chaoticgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('CHAOTICGO', '混沌碁', 'chaoticgo'),
    K.params([
        { key: 'drift_interval', label: '漂流間隔', min: 2, max: 30, def: 8, unit: '手' },
        { key: 'tide_interval', label: '潮汐間隔', min: 3, max: 30, def: 10, unit: '手' },
        { key: 'rain_interval', label: '石雨間隔', min: 3, max: 30, def: 9, unit: '手' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '混沌ルール: 盤面が常に変化する全乗せモード。',
        '・8手ごとに全石がランダム方向へ漂流 / ・10手ごとに外周が水没↔復活 (潮汐) / ・9手ごとにランダムな空点へ壁が降る (石雨)',
        '陣形も盤面も維持できない。最終的に地+アゲハマ+コミで勝敗。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 混沌ルール<br>
            ※8手で全石漂流 / 10手で外周潮汐 / 9手で壁降下 — 全部同時。200手で自動終局`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let tideHigh = false;`],
    [ONE, RESET_BOARD,
`${RESET_BOARD}
            tideHigh = false;`],
    [ONE, `        function endGameByScore() {`,
`        // 混沌: 漂流 + 潮汐 + 石雨
        function applyDrift() {
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            const [dx, dy] = dirs[(Math.random() * 4) | 0];
            const n = BOARD_SIZE;
            const order = [];
            for (let i = 0; i < n * n; i++)
                order.push({ i, key: (i % n) * dx + ((i / n) | 0) * dy });
            order.sort((a, b) => b.key - a.key);
            const moved = {};
            order.forEach(({ i }) => {
                if (board[i] !== 1 && board[i] !== 2) return;
                const x = i % n, y = (i / n) | 0, nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= n || ny < 0 || ny >= n) return;
                const ni = ny * n + nx;
                if (board[ni] === 0) { board[ni] = board[i]; board[i] = 0; moved[i] = ni; fxSlide(i, ni, 380); }
            });
            if (Object.keys(moved).length) fxShake(2, 180);
            pieces.forEach(pc => {
                pc.cells = pc.cells.map(p => {
                    const i = p.y * BOARD_SIZE + p.x;
                    return moved[i] === undefined ? p
                        : { x: moved[i] % BOARD_SIZE, y: (moved[i] / BOARD_SIZE) | 0 };
                });
            });
            cleanUpPieces();
        }
        function applyTide() {
            tideHigh = !tideHigh;
            const n = BOARD_SIZE;
            for (let i = 0; i < n; i++) {
                [i, (n - 1) * n + i, i * n, i * n + n - 1].forEach(idx => {
                    board[idx] = tideHigh ? 3 : 0;
                    if (tideHigh) fxSplash(idx, '#7dd3fc', 5);
                });
            }
            const cc = Math.floor(n / 2) * n + Math.floor(n / 2);
            fxText(cc, tideHigh ? '\\u6e80\\u6f6e' : '\\u5e72\\u6f6e', '#7dd3fc', 1100);
            if (tideHigh) fxShake(3, 220);
            pieces.forEach(pc => {
                pc.cells = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
            });
            cleanUpPieces();
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 混沌: 漂流 + 潮汐 + 石雨 (各間隔は設定で調整)
            if (history.length % (P('drift_interval') || 8) === 0) applyDrift();
            if (history.length % (P('tide_interval') || 10) === 0) applyTide();
            if (history.length % (P('rain_interval') || 9) === 0) {
                const empties = [];
                for (let i = 0; i < board.length; i++) if (board[i] === 0) empties.push(i);
                if (empties.length) board[empties[(Math.random() * empties.length) | 0]] = 3;
            }
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + (tideHigh ? ' 🌊満' : '');`],
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                tideHigh,
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            if (snap.tideHigh !== undefined) tideHigh = snap.tideHigh;`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    tideHigh,
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            if (s.tideHigh !== undefined) tideHigh = s.tideHigh;`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                tideHigh,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.tideHigh !== undefined) tideHigh = data.tideHigh;`],
    // 潮汐の壁は水面 — 深い青の彫り込み + ゆらぐ波紋
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 水没マス: 深い青 + ゆらぐ波紋で塗る (潮汐で現れる水面)
            {
                const now = fxNow();
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.8);
                    g.addColorStop(0, '#1a6fa8'); g.addColorStop(1, '#0b3d5f');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const ph = Math.sin(now / 600 + x * 0.8 + y * 1.1);
                    ctx.strokeStyle = 'rgba(160,225,255,' + (0.4 + ph * 0.25) + ')';
                    ctx.lineWidth = Math.max(1, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * (0.22 + ph * 0.1), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(140,200,240,0.45)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    if (x > 0 && isV(x - 1, y)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx - hh, cy + hh); }
                    if (x < BOARD_SIZE - 1 && isV(x + 1, y)) { ctx.moveTo(cx + hh, cy - hh); ctx.lineTo(cx + hh, cy + hh); }
                    if (y > 0 && isV(x, y - 1)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx + hh, cy - hh); }
                    if (y < BOARD_SIZE - 1 && isV(x, y + 1)) { ctx.moveTo(cx - hh, cy + hh); ctx.lineTo(cx + hh, cy + hh); }
                }
                ctx.stroke();
                ctx.restore();
            }`],
    ...WALL_GUARD_SPEC,
    // 満潮時に薄い青の揺らめきを全面に敷く
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            if (!tideHigh) return;
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            ctx2.fillStyle = 'rgba(30,90,150,' + (0.06 + Math.sin(now / 900) * 0.03) + ')';
            ctx2.fillRect(0, 0, w, w);
            ctx2.restore();
        });`],
    ...EVENT_CHIP_SPEC(`(() => { const e = [['漂流', P('drift_interval') || 8], ['潮汐', P('tide_interval') || 10], ['石雨', P('rain_interval') || 9]].map(([l, p]) => [l, p - history.length % p]); e.sort((a, b) => a[1] - b[1]); return e[0][0] + e[0][1] + '手'; })()`),
    ...STONE_SPEC,
],
};
