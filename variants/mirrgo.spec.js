// MIRRGO — 対称碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'mirrgo.html',
    en: 'MIRRGO',
    jp: '対称碁',
    prefix: 'mirrgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('MIRRGO', '対称碁', 'mirrgo'),
    K.params([
        { key: 'mirror_axis', label: '対称軸', options: [{ v: 'v', l: '縦軸' }, { v: 'h', l: '横軸' }, { v: 'both', l: '両軸' }], def: 'v' },
    ]),
    [ONE, RV_BASE, rv([
        '対称ルール: 着手すると盤の縦中央線に対して鏡映した位置にも同じ石が置かれる (最大で着手の2倍)。',
        '鏡映先が塞がっているセルは置かれない。鏡映側で自分の連が窒息する場合はその鏡映をスキップする。',
        '鏡映した石も通常の石として取り・呼吸点に関与する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 対称ルール<br>
            ※着手は縦中央線で鏡映され、空いていれば両側に置かれる`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 対称ルール: 対称軸 (設定の mirror_axis、既定は縦中央線) に鏡映した位置にも同じ形を置く
            const mirrorAxis = P('mirror_axis') || 'v';
            const mirCandidates = [];
            move.cells.forEach(p => {
                if (mirrorAxis !== 'h') mirCandidates.push({ sx: p.x, sy: p.y, x: BOARD_SIZE - 1 - p.x, y: p.y });
                if (mirrorAxis !== 'v') mirCandidates.push({ sx: p.x, sy: p.y, x: p.x, y: BOARD_SIZE - 1 - p.y });
            });
            const mirrored = mirCandidates
                .filter(p => board[p.y * BOARD_SIZE + p.x] === 0);
            if (mirrored.length > 0) {
                // 鏡映による相手石の捕獲を先に解決してから、自連の窒息を判定
                const sim = [...board];
                mirrored.forEach(p => { sim[p.y * BOARD_SIZE + p.x] = player; });
                const opp2 = player === 1 ? 2 : 1;
                getCapturedStones(sim, opp2).forEach(i => { sim[i] = 0; });
                if (getCapturedStones(sim, player).length === 0) {
                    mirrored.forEach(p => {
                        board[p.y * BOARD_SIZE + p.x] = player;
                        // 鏡映転移: 本体から対称軸を跨いで石が飛ぶ
                        fxSlide(p.sy * BOARD_SIZE + p.sx, p.y * BOARD_SIZE + p.x, 420);
                    });
                    const mirrorCells = mirrored.map(p => ({ x: p.x, y: p.y }));
                    pieces.push({ id: Date.now() + Math.random(), player, type: move.type, rot: move.rot, cells: mirrorCells });
                    lastMove.cells.push(...mirrorCells.map(p => ({ ...p })));
                }
            }`],
    // 縦中央線 (対称軸) の破線
    CUE_STARS(`            // 対称軸: 縦中央線に薄い破線
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.45);
                ctx.lineWidth = Math.max(1, cellSize * 0.03);
                ctx.setLineDash([cellSize * 0.14, cellSize * 0.10]);
                const mx = padding + (BOARD_SIZE - 1) / 2 * cellSize;
                const mAxis = P('mirror_axis') || 'v';
                ctx.beginPath();
                if (mAxis !== 'h') { ctx.moveTo(mx, padding); ctx.lineTo(mx, width - padding); }
                if (mAxis !== 'v') { ctx.moveTo(padding, mx); ctx.lineTo(width - padding, mx); }
                ctx.stroke();
                ctx.restore();
            }`),
    ...STONE_SPEC,
],
};
