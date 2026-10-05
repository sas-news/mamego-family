// PULSEGO — 脈動碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'pulsego.html',
    en: 'PULSEGO',
    jp: '脈動碁',
    prefix: 'pulsego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('PULSEGO', '脈動碁', 'pulsego'),
    K.params([
        { key: 'interval', label: '脈動間隔', min: 2, max: 20, def: 6, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '脈動ルール: 合計6手ごとに盤上の全連がランダムな呼吸点へ1石伸びる (自動増殖)。',
        '囲いきる前に連が伸びるので、取り合いは時間との勝負。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 脈動ルール<br>
            ※6手ごとに全連がランダムな空点へ1石伸びる`],
    [ONE, `        function endGameByScore() {`,
`        // 脈動: 全連をランダムな呼吸点へ1石伸ばす
        function applyPulse() {
            pieces.forEach(pc => {
                const libs = new Set();
                pc.cells.forEach(p => {
                    getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => {
                        if (board[n] === 0) libs.add(n);
                    });
                });
                if (!libs.size) return;
                const arr = [...libs];
                const ni = arr[(Math.random() * arr.length) | 0];
                board[ni] = pc.player;
                pc.cells.push({ x: ni % BOARD_SIZE, y: (ni / BOARD_SIZE) | 0 });
                // 脈動増殖: 連から新しい芽が滑り出る
                const src = getNeighbors(ni).find(n => pc.cells.slice(0, -1).some(p => p.y * BOARD_SIZE + p.x === n));
                if (src !== undefined) fxSlide(src, ni, 420);
                fxGlow(ni, 'rgba(52,211,153,0.8)', 560);
            });
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 脈動: N手ごとに全連が増殖 (間隔は設定で調整)
            if (history.length % (P('interval') || 6) === 0) applyPulse();`],
    ...EVENT_CHIP_SPEC(`'脈動' + ((P('interval') || 6) - history.length % (P('interval') || 6)) + '手'`),
    ...STONE_SPEC,
],
};
