// LIBGO — 呼吸碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'libgo.html',
    en: 'LIBGO',
    jp: '呼吸碁',
    prefix: 'libgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('LIBGO', '呼吸碁', 'libgo'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '呼吸得点: 得点 = 自分の全連の呼吸点の合計 + アゲハマ (+白はコミ)。地は数えない。',
        '囲うより呼吸の多い形を作るほうが得 — 伸び伸びした形が強い碁。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 呼吸得点<br>
            ※得点=自連の呼吸点合計+アゲハマ (地は数えない)`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            // 呼吸得点: 各自の連の呼吸点合計を得点に
            const libSum = p => {
                const seen = new Set(); let total = 0;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== p || seen.has(i)) continue;
                    const grp = getConnectedGroup(i, p);
                    grp.forEach(g => seen.add(g));
                    const libs = new Set();
                    grp.forEach(g => getNeighbors(g).forEach(n => { if (board[n] === 0) libs.add(n); }));
                    total += libs.size;
                }
                return total;
            };
            const blackLibs = libSum(1), whiteLibs = libSum(2);
            const blackTotal = blackLibs + captures[1];
            const whiteTotal = whiteLibs + captures[2] + komi;`],
    [ONE, `<div class="flex justify-between"><span>黒の地:</span> <strong>\${territory.black}</strong></div>`,
`<div class="flex justify-between"><span>黒の呼吸点:</span> <strong>\${blackLibs}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白の地:</span> <strong>\${territory.white}</strong></div>`,
`<div class="flex justify-between"><span>白の呼吸点:</span> <strong>\${whiteLibs}</strong></div>`],
    // 呼吸: 全連の呼吸点合計を得点として常時表示
    [ONE, `        function endGameByScore() {`,
`        // 呼吸: 全連の呼吸点合計 (常時得点表示にも利用)
        function libScore(p) {
            const seen = new Set(); let total = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== p || seen.has(i)) continue;
                const grp = getConnectedGroup(i, p);
                grp.forEach(g => seen.add(g));
                const libs = new Set();
                grp.forEach(g => getNeighbors(g).forEach(n => { if (board[n] === 0) libs.add(n); }));
                total += libs.size;
            }
            return total;
        }

        function endGameByScore() {`],
    ...EVENT_CHIP_SPEC(`'呼吸 ' + libScore(1) + '-' + libScore(2)`),
    ...STONE_SPEC,
],
};
