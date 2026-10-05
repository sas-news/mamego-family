// HALFGO — 陣地碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'halfgo.html',
    en: 'HALFGO',
    jp: '陣地碁',
    prefix: 'halfgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('HALFGO', '陣地碁', 'halfgo'),
    [ONE, RV_BASE, rv([
        '陣地ルール: 黒は盤の左半分、白は右半分にしか置けない。中央列は両者共通。',
        '敵の陣地には侵入できない — 境界線上の攻防と自陣の囲い合いが勝負。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 陣地ルール<br>
            ※黒は左半分、白は右半分のみ配置可 (中央列は共通)`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 陣地ルール: 黒は左半分、白は右半分のみ (中央列は共通)
            const hmid = Math.floor(BOARD_SIZE / 2);
            if (cells.some(p => player === 1 ? p.x > hmid : p.x < hmid)) return false;`],
    // 陣地: 左半=黒域・右半=白域を微かに地色分けし、境界を破線で示す
    CUE_GRID(`            // 陣地の地色分け (左=黒側, 右=白側) と境界の破線
            {
                const hmid = Math.floor(BOARD_SIZE / 2);
                const y0 = padding - cellSize * 0.5, y1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                const x0 = padding - cellSize * 0.5, x1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                const bx = padding + hmid * cellSize, bh = cellSize * 0.5;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.p1Stroke, 0.05);
                ctx.fillRect(x0, y0, bx - bh - x0, y1 - y0);
                ctx.fillStyle = alphaColor(currentTheme.p2Fill, 0.16);
                ctx.fillRect(bx + bh, y0, x1 - bx - bh, y1 - y0);
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.4);
                ctx.lineWidth = 1;
                ctx.setLineDash([cellSize * 0.16, cellSize * 0.12]);
                ctx.beginPath();
                ctx.moveTo(bx - bh, y0);
                ctx.lineTo(bx - bh, y1);
                ctx.moveTo(bx + bh, y0);
                ctx.lineTo(bx + bh, y1);
                ctx.stroke();
                ctx.restore();
            }`),
    // 境界の中央共通列をゆっくり照らす光
    [ONE, FX_BOOT,
`${FX_BOOT}
        fxAmbient((ctx2, now, pad, cs) => {
            const hmid = Math.floor(BOARD_SIZE / 2);
            const bx = pad + hmid * cs;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(250,215,110,' + (0.10 + 0.10 * Math.sin(now / 650)) + ')';
            ctx2.lineWidth = Math.max(1.5, cs * 0.12);
            ctx2.beginPath();
            ctx2.moveTo(bx, pad - cs * 0.5);
            ctx2.lineTo(bx, pad + (BOARD_SIZE - 0.5) * cs);
            ctx2.stroke();
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
