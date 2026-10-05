// QUARTERGO — 象限碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'quartergo.html',
    en: 'QUARTERGO',
    jp: '象限碁',
    prefix: 'quartergo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('QUARTERGO', '象限碁', 'quartergo'),
    [ONE, RV_BASE, rv([
        '象限ルール: 盤を4象限 (左上/右上/左下/右下) に分け、着手はその手番の象限内のみ。',
        '手番ごとに象限が時計回りに切り替わる (盤面の光っている区画が使用可能)。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 象限ルール<br>
            ※着手はその手番の象限のみ。手番ごとに許可象限が回転`],
    [ONE, `        function endGameByScore() {`,
`        // 象限: 現在許可されている象限 (0=左上,1=右上,2=左下,3=右下)
        function allowedQuadrant() {
            return history.length % 4;
        }
        function quadIndex(x, y) {
            const mid = BOARD_SIZE / 2;
            return (x >= mid ? 1 : 0) + (y >= mid ? 2 : 0);
        }

        function endGameByScore() {`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 象限ルール: 全セルが許可象限内
            if (cells.some(p => quadIndex(p.x, p.y) !== allowedQuadrant())) return false;`],
    // 許可象限を薄くハイライト
    [ONE, `            // 星 (天元・星の点)`,
`            // 象限ルール: 許可象限のハイライト
            {
                const mid = BOARD_SIZE / 2;
                const aq = allowedQuadrant();
                const qx = (aq & 1) ? mid : 0;
                const qy = (aq & 2) ? mid : 0;
                ctx.fillStyle = 'rgba(37, 99, 235, 0.10)';
                ctx.fillRect(padding + (qx - 0.5) * cellSize, padding + (qy - 0.5) * cellSize,
                    mid * cellSize, mid * cellSize);
            }

            // 星 (天元・星の点)`],
    // 許可象限の枠が脈動する
    [ONE, FX_BOOT,
`${FX_BOOT}
        fxAmbient((ctx2, now, pad, cs) => {
            const mid = BOARD_SIZE / 2;
            const aq = allowedQuadrant();
            const qx = (aq & 1) ? mid : 0, qy = (aq & 2) ? mid : 0;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(37,99,235,' + (0.30 + 0.22 * Math.sin(now / 450)) + ')';
            ctx2.lineWidth = Math.max(1.5, cs * 0.09);
            ctx2.strokeRect(pad + (qx - 0.5) * cs, pad + (qy - 0.5) * cs, mid * cs, mid * cs);
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
