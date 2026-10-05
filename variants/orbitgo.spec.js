// ORBITGO — 周回碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'orbitgo.html',
    en: 'ORBITGO',
    jp: '周回碁',
    prefix: 'orbitgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('ORBITGO', '周回碁', 'orbitgo'),
    K.params([
        { key: 'orbit_step', label: '周回するマス数', min: 1, max: 8, def: 1, unit: 'マス' },
    ]),
    [ONE, RV_BASE, rv([
        '周回ルール: 着手ごとに盤の最外周リング上の石が1マスずつ時計回りに移動する。',
        '外周に置いた石はぐるぐる回り続ける。連が裂かれることもある。',
        '周回で盤面がなかなか落ち着かないため、盤面マス数と同じ手数で自動終了して地集計に入る。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 周回ルール<br>
            ※着手ごとに外周リング上の石が1マス時計回りに移動`],
    [ONE, `        function endGameByScore() {`,
`        // 周回: 外周リングの座標列 (時計回り順)
        function ringPositions() {
            const n = BOARD_SIZE;
            const pos = [];
            for (let x = 0; x < n; x++) pos.push([x, 0]);
            for (let y = 1; y < n; y++) pos.push([n - 1, y]);
            for (let x = n - 2; x >= 0; x--) pos.push([x, n - 1]);
            for (let y = n - 2; y >= 1; y--) pos.push([0, y]);
            return pos;
        }
        // 着手ごとに外周リングを時計回りに移動 (移動量は設定の orbit_step、既定1マス)
        function applyOrbit() {
            const idxs = ringPositions().map(([x, y]) => y * BOARD_SIZE + x);
            const vals = idxs.map(i => board[i]);
            const step = Math.min(idxs.length - 1, Math.max(1, P('orbit_step') || 1));
            for (let s = 0; s < step; s++) vals.unshift(vals.pop());
            idxs.forEach((i, k) => {
                board[i] = vals[k];
                if (vals[k] !== 0) fxSlide(idxs[(k - step + idxs.length) % idxs.length], i, 380);
            });
            const mapIdx = {};
            idxs.forEach((i, k) => { mapIdx[i] = idxs[(k + step) % idxs.length]; });
            const shift = p => {
                const i = p.y * BOARD_SIZE + p.x;
                if (!(i in mapIdx)) return p;
                const ni = mapIdx[i];
                return { x: ni % BOARD_SIZE, y: (ni / BOARD_SIZE) | 0 };
            };
            pieces.forEach(pc => { pc.cells = pc.cells.map(shift); });
            if (lastMove) lastMove = { player: lastMove.player, cells: lastMove.cells.map(shift) };
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 周回: 外周リングが1マス進む
            applyOrbit();
            // 手数制限: 周回で盤面が収束しないため盤面マス数の手数で自動終了
            if (history.length >= BOARD_SIZE * BOARD_SIZE) endGameByScore();`],
    // 外周リングの回転方向 (時計回り) を枠外の矢印で示す
    CUE_STARS(`            // 外周リングの回転方向を示す矢印
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.55);
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                const ah = cellSize * 0.11, al = cellSize * 0.18;
                const arrow = (cx, cy, dx, dy) => {
                    ctx.beginPath();
                    ctx.moveTo(cx - dx * al - dy * ah, cy - dy * al + dx * ah);
                    ctx.lineTo(cx, cy);
                    ctx.lineTo(cx - dx * al + dy * ah, cy - dy * al - dx * ah);
                    ctx.stroke();
                };
                const mc = padding + (BOARD_SIZE - 1) / 2 * cellSize;
                const e0 = padding * 0.5, e1 = width - padding * 0.5;
                arrow(mc, e0, 1, 0);
                arrow(e1, mc, 0, 1);
                arrow(mc, e1, -1, 0);
                arrow(e0, mc, 0, -1);
                ctx.restore();
            }`),
    ...STONE_SPEC,
],
};
