// GREEDGO — 強欲碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'greedgo.html',
    en: 'GREEDGO',
    jp: '強欲碁',
    prefix: 'greedgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('GREEDGO', '強欲碁', 'greedgo'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '強欲ルール: 敵連の呼吸点が1つだけ残っている (アタリ) 場合、その呼吸点を取る手しか打てない。',
        '取れるなら取れ。逃げる猶予がない即断の碁。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 強欲ルール<br>
            ※敵連がアタリ状態なら取る手しか打てない。200手で自動終局`],
    [ONE, `        function endGameByScore() {`,
`        // 強欲: 敵連の呼吸点が1つのものがあれば取る手のみ合法
        // (強制される取り点の盤面 idx 一覧も返せるよう分離)
        function forcedCaptureCells(player) {
            const opp = player === 1 ? 2 : 1;
            const seen = new Set();
            const out = [];
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== opp || seen.has(i)) continue;
                const grp = getConnectedGroup(i, opp);
                grp.forEach(g => seen.add(g));
                const libs = new Set();
                grp.forEach(g => getNeighbors(g).forEach(n => { if (board[n] === 0) libs.add(n); }));
                if (libs.size === 1) out.push([...libs][0]);
            }
            return out;
        }
        function canCaptureMove(player) { return forcedCaptureCells(player).length > 0; }

        function endGameByScore() {`],
    [ONE, `            const opponent = player === 1 ? 2 : 1;
            const captured = getCapturedStones(tempBoard, opponent);`,
`            const opponent = player === 1 ? 2 : 1;
            const captured = getCapturedStones(tempBoard, opponent);

            // 強欲: この手で取れず、他に取れる手があれば非合法
            if (captured.length === 0 && canCaptureMove(player)) return false;`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    // 強欲: 取る手が必須のとき、その点を赤リングと「取」で強調
    CUE_STARS(`            // 強欲: 強制される取り点を赤く強調
            if (!gameOver && gamePhase === 'playing' && canCaptureMove(turn)) {
                ctx.save();
                forcedCaptureCells(turn).forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = 'rgba(239,68,68,0.9)';
                    ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(239,68,68,0.9)';
                    ctx.font = 'bold ' + Math.round(cellSize * 0.34) + 'px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('取', cx, cy);
                });
                ctx.restore();
            }`),
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
],
};
