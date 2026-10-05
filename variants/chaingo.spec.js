// CHAINGO — 連鎖爆発碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'chaingo.html',
    en: 'CHAINGO',
    jp: '連鎖爆発碁',
    prefix: 'chaingo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('CHAINGO', '連鎖爆発碁', 'chaingo'),
    K.params([
        { key: 'chain_max', label: '連鎖の最大追加石数', min: 0, max: 32, def: 8, unit: '石' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '連鎖爆発ルール: 敵連を取ると、空いたマスの周囲8方向 (斜め含む) にある敵石も連鎖して取られる (連鎖分は最大8石)。',
        '斜めの接触が爆発を伝える高火力碁。取り合いがドミノ式に広がる。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 連鎖爆発ルール<br>
            ※取った空点の8方向にある敵石も連鎖して取られる (最大8石)。200手で自動終局`],
    [ONE, `        function endGameByScore() {`,
`        // 8方向近傍 (連鎖爆発用)
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

        function endGameByScore() {`],
    [ONE, CAPTURE_BLOCK,
`            // 連鎖爆発: 呼吸点0の敵連を取り、空いたマスの8方向の敵石も再帰的に取る (連鎖分は最大8石)
            const captured = [];
            const done = new Set();
            const queue = [...getCapturedStones(board, opponent)];
            const chainCap = queue.length + (P('chain_max') ?? 8);
            while (queue.length && captured.length < chainCap) {
                const cur = queue.shift();
                if (done.has(cur) || board[cur] !== opponent) continue;
                done.add(cur); captured.push(cur);
                nbrs8(cur).forEach(n => {
                    if (board[n] === opponent && !done.has(n)) queue.push(n);
                });
            }
            if (captured.length > 0) {
                // 連鎖爆発演出: 取れた連から連鎖した全セルで火花が走る
                captured.forEach(idx => {
                    board[idx] = 0;
                    fxBurst(idx, '#f97316', 6, 1.3);
                });
                if (captured.length > 1) {
                    fxText(captured[0], '連鎖!', '#fb923c', 950);
                    fxShake(4, 260);
                }
                captures[player] += captured.length;
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
