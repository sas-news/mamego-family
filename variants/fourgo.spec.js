// FOURGO — 四方重力碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'fourgo.html',
    en: 'FOURGO',
    jp: '四方重力碁',
    prefix: 'fourgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('FOURGO', '四方重力碁', 'fourgo'),
    K.params([
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '四方重力ルール: 手番ごとに重力方向が 下→左→上→右 と回転する。',
        '着手はその手番の重力方向で「端に接するか、直下に石がある」点のみ。',
        '手番表示の矢印が現在の重力方向。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 四方重力ルール<br>
            ※重力方向が手番ごとに回転 (下→左→上→右)。矢印方向の端か石の上のみ配置可`],
    [ONE, `        function endGameByScore() {`,
`        // 四方重力: 現在の重力方向ベクトル
        function gravityDir() {
            return [[0, 1], [-1, 0], [0, -1], [1, 0]][history.length % 4];
        }

        function endGameByScore() {`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 四方重力: 重力方向の端か、その直下に石がある点のみ
            {
                const gd = gravityDir();
                if (cells.some(p => {
                    const nx = p.x + gd[0], ny = p.y + gd[1];
                    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return false;
                    return board[ny * BOARD_SIZE + nx] === 0;
                })) return false;
            }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + ' ' + ['↓','←','↑','→'][history.length % 4];`],
    // 重力の見える化: 着手を支える石/縁を光らせる
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 四方重力: 重力方向の支えセルを光らせる
            {
                const gd2 = gravityDir();
                move.cells.forEach(p => {
                    const sx2 = p.x + gd2[0], sy2 = p.y + gd2[1];
                    if (sx2 >= 0 && sx2 < BOARD_SIZE && sy2 >= 0 && sy2 < BOARD_SIZE) {
                        fxGlow(sy2 * BOARD_SIZE + sx2, 'rgba(200,170,90,0.75)', 550);
                    }
                });
            }`],
    // 現在の重力方向をその辺の余白に三角で示す
    CUE_STARS(`            // 重力方向の印: 現在方向の辺の余白に三角
            {
                const gd = gravityDir();
                const s = cellSize * 0.13;
                const mid = padding + (BOARD_SIZE - 1) / 2 * cellSize;
                const acx = mid + gd[0] * (width / 2 - padding * 0.42);
                const acy = mid + gd[1] * (width / 2 - padding * 0.42);
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.65);
                ctx.beginPath();
                ctx.moveTo(acx + gd[0] * s, acy + gd[1] * s);
                ctx.lineTo(acx - gd[0] * s * 0.6 - gd[1] * s * 0.55, acy - gd[1] * s * 0.6 + gd[0] * s * 0.55);
                ctx.lineTo(acx - gd[0] * s * 0.6 + gd[1] * s * 0.55, acy - gd[1] * s * 0.6 - gd[0] * s * 0.55);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }`),
    // 重力方向へ塵が漂う筋 (常時)
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const gd = gravityDir();
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(190,170,110,0.28)';
            ctx2.lineWidth = Math.max(1, cs * 0.04);
            ctx2.lineCap = 'round';
            for (let k = 0; k < 12; k++) {
                const sx2 = ((k * 37.7) % 1) * w, sy2 = ((k * 61.3) % 1) * w;
                const t = ((now / 1400) + k * 0.29) % 1;
                let px = sx2 + gd[0] * t * w, py = sy2 + gd[1] * t * w;
                px = ((px % w) + w) % w; py = ((py % w) + w) % w;
                const len = cs * (0.3 + (k % 3) * 0.12);
                ctx2.beginPath();
                ctx2.moveTo(px - gd[0] * len, py - gd[1] * len);
                ctx2.lineTo(px, py);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
],
};
