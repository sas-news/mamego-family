// LIVEGO — 活石碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'livego.html',
    en: 'LIVEGO',
    jp: '活石碁',
    prefix: 'livego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('LIVEGO', '活石碁', 'livego'),
    ...EVENT_CHIP_SPEC(`'生 黒' + board.filter(v => v === 1).length + ' / 白' + board.filter(v => v === 2).length`),
    [ONE, RV_BASE, rv([
        '得点は「地」ではなく盤上に残った自分の石の数。アゲハマも加算 (生き石+アゲハマ+コミ)。',
        '石を多く生き残らせることがそのまま得点になる。地の囲い込みは意味を持たない。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 活石得点<br>
            ※得点=盤上の自分の石数+アゲハマ (地は数えない)`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackStones = board.filter(v => v === 1).length;
            const whiteStones = board.filter(v => v === 2).length;
            const blackTotal = blackStones + captures[1];
            const whiteTotal = whiteStones + captures[2] + komi;`],
    [ONE, `<div class="flex justify-between"><span>黒の地:</span> <strong>\${territory.black}</strong></div>`,
          `<div class="flex justify-between"><span>黒の生き石:</span> <strong>\${blackStones}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白の地:</span> <strong>\${territory.white}</strong></div>`,
          `<div class="flex justify-between"><span>白の生き石:</span> <strong>\${whiteStones}</strong></div>`],
    // 活石の鼓動: 盤上の石が微かに呼吸する (生存そのものが得点のルール感)
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 1 && board[i] !== 2) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const ph = Math.sin(now / 900 + x * 0.9 + y * 0.7);
                if (ph < 0.85) continue;
                ctx2.fillStyle = board[i] === 1 ? 'rgba(148, 163, 184, 0.10)' : 'rgba(255, 255, 255, 0.12)';
                ctx2.beginPath();
                ctx2.arc(pad + x * cs, pad + y * cs, cs * 0.42 * (ph - 0.85) / 0.15, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
