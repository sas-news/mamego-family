// GRENADEGO — 榴弾碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

const NBRS8_FN = `        // 8方向近傍
        function nbrs8(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            const out8 = [...getNeighbors(i)];
            [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx, dy]) => {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE)
                    out8.push(ny * BOARD_SIZE + nx);
            });
            return out8;
        }
`;
module.exports = {
    file: 'grenadego.html',
    en: 'GRENADEGO',
    jp: '榴弾碁',
    prefix: 'grenadego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('GRENADEGO', '榴弾碁', 'grenadego'),
    K.params([
        { key: 'boom_max', label: '道連れの最大数', min: 0, max: 24, def: 8, unit: '石' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '榴弾ルール: 取られた連は爆発し、周囲8方向の石 (両色・最大8個) も道連れに消える。',
        '爆発に巻き込まれた自分の石もアゲハマに加算される。囲みすぎると自爆する攻撃的碁。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 榴弾ルール<br>
            ※取られた連は爆発し周囲8方向の石 (両色・最大8個) を道連れ。200手で自動終局`],
    [ONE, `        function endGameByScore() {`, NBRS8_FN + `
        function endGameByScore() {`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                // 榴弾: 取られたマスの8方向の石 (両色・最大8個) も爆発で消える
                const boom = new Set();
                captured.forEach(idx => nbrs8(idx).forEach(n => {
                    if ((board[n] === 1 || board[n] === 2) && boom.size < (P('boom_max') ?? 8)) boom.add(n);
                }));
                if (boom.size > 0) {
                    // 榴弾の誘爆: 取跡で連鎖する爆発 + 画面揺れ
                    fxText(captured[0], '榴弾!', '#fb923c', 950);
                    fxShake(6, 330);
                }
                boom.forEach(i => {
                    board[i] = 0;
                    fxGlow(i, '#fbbf24', 650);
                    fxBurst(i, '#f97316', 8, 1.5);
                    fxBurst(i, '#78716c', 4, 0.9);
                });
                captures[player] += captured.length + boom.size;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    ...STONE_SPEC,
],
};
