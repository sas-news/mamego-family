// TWICEGO — 二手碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'twicego.html',
    en: 'TWICEGO',
    jp: '二手碁',
    prefix: 'twicego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('TWICEGO', '二手碁', 'twicego'),
    K.params([
        { key: 'stones_per_turn', label: '手番ごとの石数', min: 1, max: 4, def: 2, unit: '石' },
    ]),
    [ONE, RV_BASE, rv([
        '二手碁: 各手番で2石ずつ置く (同じ色が2連続で着手する)。',
        '途中でパスすれば残りの着手を放棄して手番が渡る。手番表示の「n手目/2」で残りを確認できる。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 二手ルール<br>
            ※各手番で2石置く (途中パスで残りを放棄)`],
    [ONE, `        let consecutivePasses = 0;`,
`        let consecutivePasses = 0;
        let turnPlacements = 0; // この手番で置いた石数 (2で手番交代)
        let turnPlaced = []; // この手番で置いた石の idx (順序印用)`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turnPlaced.push(move.cells[0].y * BOARD_SIZE + move.cells[0].x);
            turnPlacements++;
            if (turnPlacements >= (P('stones_per_turn') || 2)) {
                turnPlacements = 0;
                turnPlaced = [];
                turn = opponent; // 2石置き切りで手番交代
            }`],
    // パスは残り着手を放棄して手番を渡す
    [ONE, PASS_INC,
`            prevBoard = null; // パスでコウ制限は解除
            consecutivePasses++;
            turnPlacements = 0;
            turnPlaced = [];`],
    // 手番表示に「n手目/2」を追加
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + \` · \${turnPlacements + 1}手目/\${(P('stones_per_turn') || 2)}\`;`],
    // 状態保存・復元・同期に turnPlacements を追加
    [ONE, SAVE_TAIL,
`                    heldPieces,
                    holdUsed,
                    turnPlacements,
                    gameMode,`],
    [ONE, LOAD_HOLD,
`            holdUsed = !!s.holdUsed;
            turnPlacements = Number.isInteger(s.turnPlacements) ? s.turnPlacements : 0;`],
    [ONE, SNAP_PUSH,
`                heldPieces: { ...heldPieces },
                holdUsed,
                turnPlacements
            });`],
    [ONE, SNAP_POP,
`            holdUsed = !!snap.holdUsed;
            turnPlacements = snap.turnPlacements || 0;`],
    [ONE, ONLINE_SEND,
`                heldPieces,
                holdUsed,
                turnPlacements,
                deadStones: [...deadStones],`],
    [ONE, ONLINE_RECV,
`            holdUsed = !!data.holdUsed;
            turnPlacements = data.turnPlacements || 0;`],
    // この手番で置いた石に①②の順序印
    ...STONE_MARKS_SPEC(`            // 二手: この手番で置いた石に順序印
            {
                const nums = ['①', '②'];
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.max(9, cellSize * 0.42) + 'px sans-serif';
                turnPlaced.forEach((i, k) => {
                    if (board[i] !== turn) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = turn === 1 ? '#fde68a' : '#92400e';
                    ctx.fillText(nums[k] || '•', cx, cy);
                });
                ctx.restore();
            }`),
    ...STONE_SPEC,
],
};
