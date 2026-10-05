// SWAMPGO — 沼碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'swampgo.html',
    en: 'SWAMPGO',
    jp: '沼碁',
    prefix: 'swampgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('SWAMPGO', '沼碁', 'swampgo'),
    K.params([
        { key: 'swamp_count', label: '沼の数', min: 1, max: 20, def: 6, unit: '個' },
        { key: 'sink_turns', label: '沈むまでの手数', min: 2, max: 20, def: 6, unit: '手' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '沼ルール: 盤上に6個の沼地 (緑色の枡) がある。沼に置いた石は6手後に沈んで消える。',
        '沼地は置けるが寿命付き。沈む直前に取り合いに使う高等戦術もある。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 沼ルール<br>
            ※緑の沼地に置いた石は6手後に沈む。200手で自動終局`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let swamp = new Set();    // 沼地の盤面インデックス
        let swampSink = {};       // 沼上の石 -> 沈む手数 (history.length基準)`],
    [ONE, RESET_BOARD,
`${RESET_BOARD}
            swamp = new Set();
            swampSink = {};
            // 内側エリアに6個の沼をランダム配置
            while (swamp.size < (P('swamp_count') || 6)) {
                const x = 1 + ((Math.random() * (BOARD_SIZE - 2)) | 0);
                const y = 1 + ((Math.random() * (BOARD_SIZE - 2)) | 0);
                swamp.add(y * BOARD_SIZE + x);
            }`],
    // 沼描画 (石の下の地形)
    [ONE, `        function drawBoardElements(padding, cellSize) {
            const r = cellSize * 0.46;`,
`        function drawBoardElements(padding, cellSize) {
            const r = cellSize * 0.46;

            // 沼地: 泥水のグラデーション
            swamp.forEach(i => {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const sx = padding + x * cellSize, sy = padding + y * cellSize, hh = cellSize * 0.5;
                const g = ctx.createRadialGradient(sx, sy, cellSize * 0.1, sx, sy, cellSize * 0.75);
                g.addColorStop(0, 'rgba(84,120,20,0.60)');
                g.addColorStop(1, 'rgba(50,78,12,0.30)');
                ctx.fillStyle = g;
                ctx.fillRect(sx - hh, sy - hh, cellSize, cellSize);
            });`],
    // 配置時: 沼上なら沈没タイマー登録
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            move.cells.forEach(p => {
                const i = p.y * BOARD_SIZE + p.x;
                if (swamp.has(i)) swampSink[i] = history.length + (P('sink_turns') || 6);
            });`],
    // 手番交代時: 期限切れの沼上の石を沈める
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            Object.keys(swampSink).forEach(k => {
                const i = +k;
                if (swampSink[i] <= history.length || board[i] === 0) {
                    if (board[i] !== 0) {
                        board[i] = 0;
                        fxSplash(i, '#84a02a', 10); // 泥が弾ける
                        fxText(i, 'ぐぽっ', '#a3e635', 750);
                    }
                    delete swampSink[i];
                }
            });
            pieces.forEach(pc => { pc.cells = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player); });
            cleanUpPieces();
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    // undo/保存/同期
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                swamp: [...swamp], swampSink: { ...swampSink },
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            swamp = new Set(snap.swamp || []); swampSink = snap.swampSink ? { ...snap.swampSink } : swampSink;`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    swamp: [...swamp], swampSink: { ...swampSink },
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            swamp = new Set(s.swamp || []); swampSink = s.swampSink ? { ...s.swampSink } : {};`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                swamp: [...swamp], swampSink,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.swamp) swamp = new Set(data.swamp);
            if (data.swampSink) swampSink = { ...data.swampSink };`],
    ...STONE_MARKS_SPEC(`            // 沼の上の石は沈む — 小さな▽を刻む
            {
                ctx.save();
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                ctx.lineJoin = 'round';
                for (const i of swamp) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + ((i / BOARD_SIZE) | 0) * cellSize, s = cellSize * 0.09;
                    ctx.strokeStyle = v === 1 ? 'rgba(240,235,220,0.85)' : 'rgba(50,40,25,0.8)';
                    ctx.beginPath();
                    ctx.moveTo(cx - s, cy - s * 0.6);
                    ctx.lineTo(cx, cy + s);
                    ctx.lineTo(cx + s, cy - s * 0.6);
                    ctx.closePath();
                    ctx.stroke();
                }
                ctx.restore();
            }`),
    // 沼の泡: 沼地でぽこぽこ泡が昇る
    [ONE, FX_BOOT,
`${FX_BOOT}
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            swamp.forEach(i => {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const t = (now / 2600 + (i % 7) * 0.35) % 1;
                const bx = pad + x * cs + Math.sin(i * 3.3) * cs * 0.25;
                const by = pad + y * cs + cs * 0.3 - t * cs * 0.5;
                ctx2.globalAlpha = 0.5 * (1 - t);
                ctx2.strokeStyle = '#bef264';
                ctx2.lineWidth = Math.max(1, cs * 0.03);
                ctx2.beginPath();
                ctx2.arc(bx, by, cs * (0.05 + t * 0.09), 0, Math.PI * 2);
                ctx2.stroke();
            });
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
