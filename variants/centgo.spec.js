// CENTGO — 中心碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'centgo.html',
    en: 'CENTGO',
    jp: '中心碁',
    prefix: 'centgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('CENTGO', '中心碁', 'centgo'),
    K.params([
        { key: 'init_radius', label: '初期半径', min: 1, max: 8, def: 2 },
        { key: 'grow_interval', label: '拡大間隔', min: 2, max: 24, def: 6, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '中心ルール: 着手できるのは中心からの半径 (2 + 総手数÷6) 以内の点のみ。',
        '盤が埋まるにつれ使える領域が外側へ広がる。6手ごとに半径+1。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 中心ルール<br>
            ※中心からの円内のみ配置可。6手ごとに半径が広がる`],
    [ONE, `        function endGameByScore() {`,
`        // 中心ルール: 許可半径は総手数とともに拡大
        function centRadius() {
            return Math.min((BOARD_SIZE - 1) / 2, (P('init_radius') || 2) + Math.floor(history.length / (P('grow_interval') || 6)));
        }

        function endGameByScore() {`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 中心ルール: 許可半径内のみ
            {
                const cc = (BOARD_SIZE - 1) / 2;
                const rr = centRadius();
                if (cells.some(p => {
                    const dx = p.x - cc, dy = p.y - cc;
                    return dx * dx + dy * dy > rr * rr + 0.01;
                })) return false;
            }`],
    // 許可領域の円を描画
    [ONE, `            // 星 (天元・星の点)`,
`            // 中心ルール: 現在の許可領域 (円)
            {
                const cc = (BOARD_SIZE - 1) / 2;
                ctx.strokeStyle = 'rgba(37, 99, 235, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.arc(padding + cc * cellSize, padding + cc * cellSize, (centRadius() + 0.5) * cellSize, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // 星 (天元・星の点)`],
    ...EVENT_CHIP_SPEC(`'拡大' + ((P('grow_interval') || 6) - history.length % (P('grow_interval') || 6)) + '手'`),
    // 領域拡大の瞬間: 中心からの波紋
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 中心: N手ごとに許可領域が拡大する瞬間を可視化
            if (history.length % (P('grow_interval') || 6) === 0) {
                const cc = ((BOARD_SIZE - 1) / 2) | 0;
                const ci = cc * BOARD_SIZE + cc;
                fxText(ci, '領域拡大', '#3b82f6', 1100);
                fxGlow(ci, '#60a5fa', 800);
                fxBurst(ci, '#60a5fa', 18, 2.4);
            }`],
    ...STONE_SPEC,
],
};
