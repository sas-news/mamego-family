// GROWGO — 増殖碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'growgo.html',
    en: 'GROWGO',
    jp: '増殖碁',
    prefix: 'growgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('GROWGO', '増殖碁', 'growgo'),
    K.params([
        { key: 'grow_rate', label: '増殖確率', min: 0.05, max: 1, def: 0.3, step: 0.05 },
    ]),
    [ONE, RV_BASE, rv([
        '増殖ルール: 着手ごとに、石に隣接する空点のうち約30%へ同じ色の石が増殖する。',
        '増殖はどの連の最後の呼吸点も埋めない (増殖だけでは石は取られないが、アタリまで追い込める)。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 増殖ルール<br>
            ※着手ごとに石が隣の空点へランダムに増殖する`],
    [ONE, `        let history = []; // 1手戻る用: 各着手前のスナップショットのスタック`,
`        let history = []; // 1手戻る用: 各着手前のスナップショットのスタック
        const GROW_RATE = 0.30; // 増殖ルール: 空点ごとの増殖確率
        function applyGrowth() {
            const cand = [];
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) continue;
                const adj = getNeighbors(i).filter(n => board[n] !== 0);
                if (adj.length) cand.push([i, adj]);
            }
            for (let i = cand.length - 1; i > 0; i--) {
                const j = (Math.random() * (i + 1)) | 0;
                [cand[i], cand[j]] = [cand[j], cand[i]];
            }
            const used = new Set();
            cand.forEach(([i, adj]) => {
                if (used.has(i) || Math.random() > (P('grow_rate') || GROW_RATE)) return;
                // 増殖先がどの連の最後の呼吸点でもある場合は増殖しない (増殖による連鎖全滅を防ぐ)
                const chokes = getNeighbors(i).some(n => {
                    const c = board[n];
                    if (c === 0) return false;
                    const libs = new Set();
                    getConnectedGroup(n, c).forEach(cell =>
                        getNeighbors(cell).forEach(m => { if (board[m] === 0) libs.add(m); }));
                    return libs.size === 1 && libs.has(i);
                });
                if (chokes) return;
                const s = adj[(Math.random() * adj.length) | 0];
                board[i] = board[s]; used.add(i);
                fxGlow(i, 'rgba(90,220,120,0.85)', 650); // 増殖した点が芽吹く
            });
            cleanUpPieces();
        }`],
    [ONE, `            // ネクストモードでは次のピースを供給`,
`            // 増殖処理
            applyGrowth();

            // ネクストモードでは次のピースを供給`],
    ...STONE_SPEC,
],
};
