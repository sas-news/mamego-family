// PUSHCHAINGO — 連鎖押し碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'pushchaingo.html',
    en: 'PUSHCHAINGO',
    jp: '連鎖押し碁',
    prefix: 'pushchaingo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('PUSHCHAINGO', '連鎖押し碁', 'pushchaingo'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '連鎖押しルール: 置いた石に隣接する敵石を1マス押す。行き先が敵石なら連鎖して押し続ける。',
        '行き先が盤外か自分の石なら押せない (何も起きない)。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 連鎖押しルール<br>
            ※隣接する敵石を1マス押す。押された先が敵石なら連鎖`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 連鎖押し: 隣接する敵石を方向へ押す (列が続けば連鎖)
            {
                const opp2 = player === 1 ? 2 : 1;
                move.cells.forEach(p => {
                    getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => {
                        if (board[n] !== opp2) return;
                        const dx = (n % BOARD_SIZE) - p.x;
                        const dy = ((n / BOARD_SIZE) | 0) - p.y;
                        const chain = [];
                        let cx = n % BOARD_SIZE, cy = (n / BOARD_SIZE) | 0;
                        while (true) {
                            if (board[cy * BOARD_SIZE + cx] === 0) break;
                            if (board[cy * BOARD_SIZE + cx] === player) return;
                            chain.push(cy * BOARD_SIZE + cx);
                            cx += dx; cy += dy;
                            if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) return;
                        }
                        for (let k = chain.length - 1; k >= 0; k--) {
                            board[chain[k] + dx + dy * BOARD_SIZE] = board[chain[k]];
                            board[chain[k]] = 0;
                            fxSlide(chain[k], chain[k] + dx + dy * BOARD_SIZE, 360); // 押される軌跡
                        }
                    });
                });
                cleanUpPieces();
            }`],
    ...STONE_SPEC,
],
};
