// LASTGO — 終着碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'lastgo.html',
    en: 'LASTGO',
    jp: '終着碁',
    prefix: 'lastgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('LASTGO', '終着碁', 'lastgo'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '終着ルール: 双方パスで終局したとき、地の数ではなく「最後に石を置いた側」が勝つ (正常形の終局)。',
        '置ききれる場所を残す側が有利 — 序盤から終盤の手数まで読む碁。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 終着ルール<br>
            ※終局時「最後に石を置いた側」の勝ち (地は数えない)`],
    [ONE, `        function endGameByScore() {
            gameOver = true;
            const territory = calculateTerritory();`,
WIN_BY_RULE_FN + `
        function endGameByScore() {
            gameOver = true;
            // 終着ルール: 最後に石を置いた側が勝ち
            if (lastMove) {
                winByRule(lastMove.player, '終着', \`\${lastMove.player === 1 ? '黒' : '白'}が最後の着手をしました\`);
                return;
            }
            const territory = calculateTerritory();`],
    // 終着: 現状の「最後の着手者」(=そのまま終われば勝者) を常時表示
    ...EVENT_CHIP_SPEC(`'終着権 ' + (lastMove ? (lastMove.player === 1 ? '黒' : '白') : '-')`),
    ...STONE_SPEC,
],
};
