// TRIOGO — トリオ碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

const TILE_DRAW_SPEC = [ONE, `        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;`,
`        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;
            if (cellsAbs.length > 1) {
                const tileSet = new Set(cellsAbs.map(p => p.y * BOARD_SIZE + p.x));
                const ins = cellSize * 0.47;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = fill;
                cellsAbs.forEach(p => {
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    ctx.fillRect(cx - ins, cy - ins, ins * 2, ins * 2);
                });
                ctx.strokeStyle = shiftColor(fill, -0.3);
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.lineJoin = 'round';
                ctx.beginPath();
                cellsAbs.forEach(p => {
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    if (!tileSet.has(p.y * BOARD_SIZE + p.x - 1)) { ctx.moveTo(cx - ins, cy - ins); ctx.lineTo(cx + ins, cy - ins); }
                    if (!tileSet.has(p.y * BOARD_SIZE + p.x + 1)) { ctx.moveTo(cx + ins, cy - ins); ctx.lineTo(cx + ins, cy + ins); }
                    if (!tileSet.has((p.y + 1) * BOARD_SIZE + p.x)) { ctx.moveTo(cx + ins, cy + ins); ctx.lineTo(cx - ins, cy + ins); }
                    if (!tileSet.has((p.y - 1) * BOARD_SIZE + p.x)) { ctx.moveTo(cx - ins, cy + ins); ctx.lineTo(cx - ins, cy - ins); }
                });
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.22)';
                cellsAbs.forEach(p => {
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    if (!tileSet.has((p.y - 1) * BOARD_SIZE + p.x)) ctx.fillRect(cx - ins, cy - ins, ins * 2, cellSize * 0.10);
                });
                ctx.restore();
                return;
            }`];

const TRIO_MOLS = `        // トリオミノ: 3連結の形2種 (直鎖 / L字)
        const MOLECULES = {
            TRI_I: { name: 'Iトリオミノ', iupac: '直鎖3', formula: '3連結', atoms: [[0,0],[1,0],[2,0]] },
            TRI_L: { name: 'Lトリオミノ', iupac: 'L字3', formula: '3連結', atoms: [[0,0],[0,1],[1,1]] }
        };`;
module.exports = {
    file: 'triogo.html',
    en: 'TRIOGO',
    jp: 'トリオ碁',
    prefix: 'triogo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('TRIOGO', 'トリオ碁', 'triogo'),
    ...ALGO_RULES_SPEC,
    [ONE, RV_BASE, rv([
        'このゲームで使う碁リオはトリオミノ2種 (直鎖I / 曲がりL、いずれも3連結)。',
    ])],
    [ONE, INFO_BASE,
`            トリオミノ「碁リオ」を配置し合う変則囲碁<br>
            PC: クリックで配置 / 回転=⟳ボタン・Rキー・右クリック・ホイール / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
    [ONE, MOLECULES_BASE, TRIO_MOLS],
    [ONE, OCNT_BASE, '// I:2 / L:4 = 計6パターン'],
    [ONE, `let currentPieceType = 'STONE';`, `let currentPieceType = 'TRI_I';`],
    [ONE, `? s.currentPieceType : 'STONE'`, `? s.currentPieceType : 'TRI_I'`],
    [ONE, '登場アルカン', '登場トリオミノ'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`トリオミノは碁石3個の連結形 (直鎖とL字の2種)。3マス未満の窒息領域には入りません。`],
    [ALL, '碁カン', '碁リオ'],
    [ALL, '全7種1巡', '全2種1巡'],
    [ALL, '7種1巡', '2種1巡'],
    TILE_DRAW_SPEC,
],
};
