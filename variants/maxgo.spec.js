// MAXGO — 先取碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'maxgo.html',
    en: 'MAXGO',
    jp: '先取碁',
    prefix: 'maxgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('MAXGO', '先取碁', 'maxgo'),
    K.params([
        { key: 'win_captures', label: '先取のアゲハマ数', min: 2, max: 40, def: 10, unit: '石' },
    ]),
    [ONE, RV_BASE, rv([
        '先取ルール: 先に10石取った側がその場で勝利する。',
        '通常の終局 (パス2連続→地集計+コミ) も同時に有効。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 先取ルール<br>
            ※先に10石取った側が即勝利 (地集計も有効)`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        const WIN_CAPTURES = 10; // 先取ルール: この数のアゲハマで即勝利`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                const winCaptures = P('win_captures') || WIN_CAPTURES;
                fxText(captured[0], '先取 ' + Math.min(captures[player], winCaptures) + '/' + winCaptures, '#f59e0b', 900);
                if (captures[player] >= winCaptures) {
                    fxShake(6, 350);
                    winByRule(player, '先取', \`\${player === 1 ? '黒' : '白'}が先に \${winCaptures} 石を取りました\`);
                    return;
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, `        function endGameByScore() {`, WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    // 先取カウント: 手番側のアゲハマ進捗を常時表示
    ...EVENT_CHIP_SPEC(`'先取 ' + Math.min(captures[turn], (P('win_captures') || WIN_CAPTURES)) + '/' + (P('win_captures') || WIN_CAPTURES)`),
    ...STONE_SPEC,
],
};
