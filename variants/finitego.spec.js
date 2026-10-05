// FINITEGO — 有限碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'finitego.html',
    en: 'FINITEGO',
    jp: '有限碁',
    prefix: 'finitego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('FINITEGO', '有限碁', 'finitego'),
    K.params([
        { key: 'max_stones', label: '石の最大数', min: 4, max: 40, def: 12, unit: '個' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '有限ルール: 各プレイヤーが盤上に持てる石は最大12個。13個目を置くと最も古い石が消える。',
        '消えた石はアゲハマにならない。取り合いに加えて「どの石を残すか」の管理が要る。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 有限ルール<br>
            ※各プレイヤーの石は最大12個。超過すると最古の石が消える。200手で自動終局`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 有限: 自石は最大12個 — 超過分は最古から消える
            {
                const mine = pieces.filter(pc => pc.player === player);
                if (mine.length > (P('max_stones') || 12)) {
                    const old = mine[0];
                    old.cells.forEach(p => {
                        board[p.y * BOARD_SIZE + p.x] = 0;
                        fxBurst(p.y * BOARD_SIZE + p.x, '#a78bfa', 8, 1.4);
                    });
                    fxText(old.cells[0].y * BOARD_SIZE + old.cells[0].x, '消滅', '#a78bfa', 1100);
                    pieces = pieces.filter(pc => pc !== old);
                }
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    // 有限: 手持ち石数と上限表示 + 次に消える最古石を刻む
    ...EVENT_CHIP_SPEC(`'石数 ' + board.filter(v => v === turn).length + '/' + (P('max_stones') || 12)`),
    ...STONE_MARKS_SPEC(`            // 有限: 上限に達した自連の最古石 (次に消える石) に時限刻印
            {
                const mine = pieces.filter(pc => pc.player === turn && pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === turn));
                if (mine.length >= (P('max_stones') || 12)) {
                    const p = mine[0].cells[0];
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    ctx.save();
                    ctx.strokeStyle = '#a78bfa';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                    ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.55, 0, Math.PI * 2); ctx.stroke();
                    const t = cellSize * 0.09;
                    ctx.beginPath();
                    ctx.moveTo(cx - t, cy - t); ctx.lineTo(cx + t, cy - t); ctx.lineTo(cx - t, cy + t); ctx.lineTo(cx + t, cy + t);
                    ctx.closePath(); ctx.stroke();
                    ctx.restore();
                }
            }`),
    ...STONE_SPEC,
],
};
