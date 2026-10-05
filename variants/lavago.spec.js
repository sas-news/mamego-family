// LAVAGO — 溶岩碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'lavago.html',
    en: 'LAVAGO',
    jp: '溶岩碁',
    prefix: 'lavago',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('LAVAGO', '溶岩碁', 'lavago'),
    K.params([
        { key: 'lava_every', label: '溶岩化の間隔', min: 2, max: 20, def: 8, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '溶岩ルール: 合計8手ごとに盤の最外周リングが溶岩に沈む (空マスが壁になる)。',
        '石は残るが呼吸点を失い、呼吸点0になった連は溶岩に飲まれて相手のアゲハマになる。',
        '盤面は内側へ徐々に狭くなる。全周が沈み切ったらその時点で地集計に入る。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 溶岩ルール<br>
            ※8手ごとに外周の空マスが溶岩 (壁) に沈む。盤面はどんどん狭くなる`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let lavaDepth = 0;      // 溶岩の浸食深度 (何リング目まで沈んだか)
        const LAVA_EVERY = 8;   // この手数ごとに外周リングが溶岩化`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            lavaDepth = 0;`],
    [ONE, `        function endGameByScore() {`,
`        // 溶岩: 外周リングの空マスを壁にし、呼吸点を失った連を溶かす
        function applyLava() {
            const n = BOARD_SIZE;
            if (lavaDepth >= Math.ceil(n / 2)) { endGameByScore(); return; }
            const d = lavaDepth++;
            let changed = false;
            for (let y = d; y < n - d; y++) for (let x = d; x < n - d; x++) {
                if (x !== d && x !== n - 1 - d && y !== d && y !== n - 1 - d) continue;
                const i = y * n + x;
                if (board[i] === 0) { board[i] = 3; changed = true; }
            }
            // 溶岩で呼吸点0になった連は消滅 (相手のアゲハマ)
            [1, 2].forEach(pl => {
                const dead = getCapturedStones(board, pl);
                dead.forEach(i => { board[i] = 0; fxBurst(i, '#ff6d00', 10, 1.2); });
                if (dead.length) captures[pl === 1 ? 2 : 1] += dead.length;
            });
            cleanUpPieces();
            if (changed) fxShake(5, 300); // 大地が沈む感触
            if (lavaDepth >= Math.ceil(n / 2)) endGameByScore();
        }

        function endGameByScore() {`],
    // undo用: スナップショットにも溶岩深度を保存・復元
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                lavaDepth,
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            lavaDepth = snap.lavaDepth || 0;`],
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 溶岩: 泡立つ光彩と舞い上がる火の粉を常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            const n = BOARD_SIZE;
            ctx2.save();
            for (let i = 0; i < n * n; i++) {
                if (board[i] !== 3) continue;
                const x = i % n, y = Math.floor(i / n);
                const cx = pad + x * cs, cy = pad + y * cs;
                const ph = Math.sin(now / 420 + x * 1.7 + y * 2.3);
                if (ph > 0.55) { // ゆらめく溶岩の輝点
                    ctx2.globalAlpha = (ph - 0.55) * 0.9;
                    ctx2.fillStyle = '#ffb347';
                    ctx2.beginPath();
                    ctx2.arc(cx + Math.sin(now / 700 + y) * cs * 0.18, cy + Math.cos(now / 800 + x) * cs * 0.18, cs * 0.13, 0, Math.PI * 2);
                    ctx2.fill();
                }
            }
            // 沈降予告リングの縁を熱く光らせる
            if (lavaDepth < Math.ceil(n / 2)) {
                const d = lavaDepth, pulse = 0.25 + 0.2 * Math.sin(now / 300);
                ctx2.globalAlpha = pulse;
                ctx2.strokeStyle = '#ff5722';
                ctx2.lineWidth = Math.max(2, cs * 0.12);
                const inset = pad + (d - 0.5) * cs, sz = (n - 2 * d + 1) * cs;
                ctx2.strokeRect(inset, inset, sz, sz);
            }
            ctx2.restore();
        });`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    lavaDepth,
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            lavaDepth = s.lavaDepth || 0;
            if (s.boardSize === BOARD_SIZE && board.every(v => v !== 3)) {
                // セーブからの復元時に溶岩壁を再構成 (壁は盤面に含まれるので素通し)
            }`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                lavaDepth,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            lavaDepth = data.lavaDepth || 0;`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 溶岩: LAVA_EVERY手ごとに外周が沈む
            if (history.length % Math.max(1, P('lava_every') || LAVA_EVERY) === 0) {
                // 沈むリングを先に赤く点滅させてから溶岩化
                {
                    const n = BOARD_SIZE, d = lavaDepth;
                    for (let y = d; y < n - d; y++) for (let x = d; x < n - d; x++) {
                        if (x !== d && x !== n - 1 - d && y !== d && y !== n - 1 - d) continue;
                        const i = y * n + x;
                        if (board[i] === 0) fxGlow(i, '#ff5722', 700);
                    }
                }
                applyLava();
            }`],
    // 沈んだリングは焦土色。次に沈むリングを微かな熱気で示す
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`, `            const covered = new Set(); // ピース描画でカバー済みのマス

            // 溶岩セルの表面: 玄武岩 + 脈動する灼熱の亀裂
            {
                const now = fxNow();
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = y * BOARD_SIZE + x;
                    if (board[i] !== 3) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.9);
                    g.addColorStop(0, '#3d2314'); g.addColorStop(1, '#1a0e08');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    // 灼熱の亀裂 (セルごとの位相で脈動)
                    const ph = Math.sin(now / 480 + x * 2.1 + y * 1.3);
                    ctx.strokeStyle = 'rgba(255,' + Math.round(80 + ph * 60) + ',20,' + (0.5 + ph * 0.3) + ')';
                    ctx.lineWidth = Math.max(1, cellSize * 0.07);
                    ctx.beginPath();
                    const s1 = Math.sin(i * 12.9898) * 0.5 + 0.5, s2 = Math.sin(i * 78.233) * 0.5 + 0.5;
                    ctx.moveTo(cx - hh + s1 * cellSize, cy - hh);
                    ctx.lineTo(cx + (s2 - 0.5) * cellSize * 0.4, cy);
                    ctx.lineTo(cx - hh + s2 * cellSize, cy + hh);
                    ctx.moveTo(cx + hh, cy - hh + s1 * cellSize * 0.6);
                    ctx.lineTo(cx + (s1 - 0.5) * cellSize * 0.3, cy + (s2 - 0.5) * cellSize * 0.3);
                    ctx.stroke();
                }
                ctx.restore();
            }
            // 次に沈むリングを微かな熱気で示す
            {
                const d = lavaDepth;
                const n = BOARD_SIZE;
                if (d < Math.ceil(n / 2)) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(215,90,30,0.13)';
                    for (let y = d; y < n - d; y++) for (let x = d; x < n - d; x++) {
                        if (x !== d && x !== n - 1 - d && y !== d && y !== n - 1 - d) continue;
                        const i = y * n + x;
                        if (board[i] === 0) ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                    }
                    ctx.restore();
                }
            }`],
    ...WALL_GUARD_SPEC,
    ...EVENT_CHIP_SPEC(`'沈下' + ((P('lava_every') || LAVA_EVERY) - history.length % (P('lava_every') || LAVA_EVERY)) + '手'`),
    ...STONE_SPEC,
],
};
