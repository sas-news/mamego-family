// INFECTGO — 感染碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'infectgo.html',
    en: 'INFECTGO',
    jp: '感染碁',
    prefix: 'infectgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('INFECTGO', '感染碁', 'infectgo'),
    K.params([
        { key: 'interval', label: '感染間隔', min: 2, max: 25, def: 7, unit: '手' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '感染ルール: 合計7手ごとに、味方石と繋がっていない孤立石が隣接する敵石を全て自分の色に感染させる。',
        '孤立石は感染源として兵器になる。連を維持するか散らすかの駆け引き。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 感染ルール<br>
            ※7手ごとに孤立石が隣の敵石を自色に変える。200手で自動終局`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 感染: N手ごとに孤立石が敵石を自色化 (間隔は設定で調整)
            if (history.length % (P('interval') || 7) === 0) {
                const flips = [];
                for (let i = 0; i < board.length; i++) {
                    const c0 = board[i];
                    if (c0 !== 1 && c0 !== 2) continue;
                    if (getNeighbors(i).some(n => board[n] === c0)) continue;
                    getNeighbors(i).forEach(n => {
                        if (board[n] === 3 - c0) flips.push([n, c0]);
                    });
                }
                // 感染演出: 胞子が広がり敵石を染める
                flips.forEach(([n]) => {
                    fxGlow(n, '#a3e635', 750);
                    fxBurst(n, '#65a30d', 7, 1.2);
                });
                if (flips.length > 0) fxText(flips[0][0], '感染', '#a3e635', 950);
                flips.forEach(([n]) => { board[n] = 0; });
                pieces.forEach(pc => {
                    pc.cells = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                });
                cleanUpPieces();
                flips.forEach(([n, c]) => {
                    board[n] = c;
                    pieces.push({
                        id: Date.now() + Math.random(), player: c, type: 'STONE', rot: 0,
                        cells: [{ x: n % BOARD_SIZE, y: (n / BOARD_SIZE) | 0 }]
                    });
                });
            }
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    ...EVENT_CHIP_SPEC(`'変色' + ((P('interval') || 7) - history.length % (P('interval') || 7)) + '手'`),
    ...STONE_SPEC,
],
};
