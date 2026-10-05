// FUELGO — 燃料碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'fuelgo.html',
    en: 'FUELGO',
    jp: '燃料碁',
    prefix: 'fuelgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('FUELGO', '燃料碁', 'fuelgo'),
    K.params([
        { key: 'init_fuel', label: '初期燃料', min: 5, max: 99, def: 25 },
    ]),
    [ONE, RV_BASE, rv([
        '燃料ルール: 各プレイヤーは燃料を25持つ。着手は最寄りの自石までのマンハッタン距離分の燃料を消費。',
        '燃料不足の手は打てない (自石隣接なら0消費)。燃料切れ後は自石隣接のみ。盤上に自石が無ければ消費0。',
        '手番表示の後ろの数値が残燃料。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 燃料ルール<br>
            ※着手は自石までの距離分の燃料を消費 (初期25)。切れると隣接のみ`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let fuel = { 1: (P('init_fuel') || 25), 2: (P('init_fuel') || 25) }; // 燃料ルール
        function fuelCost(player, cells) {
            // 着手セル自身は距離0の自石として数えない
            const placed = new Set(cells.map(p => p.y * BOARD_SIZE + p.x));
            let best = Infinity, has = false;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || placed.has(i)) continue;
                has = true;
                const bx = i % BOARD_SIZE, by = (i / BOARD_SIZE) | 0;
                cells.forEach(p => {
                    best = Math.min(best, Math.abs(p.x - bx) + Math.abs(p.y - by));
                });
            }
            return has ? best : 0;
        }`],
    [ONE, RESET_HELD,
`${RESET_HELD}
            fuel = { 1: (P('init_fuel') || 25), 2: (P('init_fuel') || 25) };`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 燃料ルール: 距離分の燃料が足りなければ置けない
            if (fuelCost(player, cells) > fuel[player]) return false;`],
    [ONE, PIECES_PUSH,
`            // 燃料消費を着手点に表示
            {
                const cost = fuelCost(player, move.cells);
                fuel[player] -= cost;
                if (cost > 0) fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '-' + cost + '⛽', '#f59e0b', 1000);
            }

${PIECES_PUSH}`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + ' ⛽' + fuel[turn];`],
    // undo/保存/同期
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                fuel: { ...fuel },
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            if (snap.fuel) fuel = { ...snap.fuel };`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    fuel: { ...fuel },
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            if (s.fuel) fuel = { ...s.fuel };`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                fuel: { ...fuel },
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.fuel) fuel = { ...data.fuel };`],
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
],
};
