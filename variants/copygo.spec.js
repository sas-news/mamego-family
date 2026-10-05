// COPYGO — 模倣碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'copygo.html',
    en: 'COPYGO',
    jp: '模倣碁',
    prefix: 'copygo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('COPYGO', '模倣碁', 'copygo'),
    [ONE, RV_BASE, rv([
        '模倣ルール: 相手の直前の着手と盤の中心に点対称な位置にしか打てない (鏡写し)。',
        'その位置が埋まっていれば自由に打てる。序盤は完全なコピー戦になる古典的な対称碁。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 模倣ルール<br>
            ※相手の直前着手の点対称位置にしか打てない (埋まっていれば自由)`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 模倣ルール: 相手直前着手の点対称位置が空いていればそこにしか打てない
            if (lastMove && lastMove.player !== player) {
                const need = lastMove.cells.map(p => ({ x: BOARD_SIZE - 1 - p.x, y: BOARD_SIZE - 1 - p.y }));
                const mirrorOk = need.every(p => board[p.y * BOARD_SIZE + p.x] === 0);
                const isMirror = cells.length === need.length &&
                    cells.every((p, i) => p.x === need[i].x && p.y === need[i].y);
                if (mirrorOk && !isMirror) return false;
            }`],
    // 模倣: 相手の手と点対称位置を破線リンクと目印で示す
    CUE_STARS(`            // 模倣: 次の一手は点対称位置 — リンク線と必着手リング
            if (lastMove && lastMove.player !== turn && !gameOver) {
                const need = lastMove.cells.map(p => ({ x: BOARD_SIZE - 1 - p.x, y: BOARD_SIZE - 1 - p.y }));
                if (need.every(p => board[p.y * BOARD_SIZE + p.x] === 0)) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(217,70,239,0.7)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                    // 元の石と模倣点を結ぶ薄いリンク
                    ctx.setLineDash([cellSize * 0.10, cellSize * 0.09]);
                    lastMove.cells.forEach((p, i) => {
                        const m = need[i];
                        ctx.beginPath();
                        ctx.moveTo(padding + p.x * cellSize, padding + p.y * cellSize);
                        ctx.lineTo(padding + m.x * cellSize, padding + m.y * cellSize);
                        ctx.stroke();
                    });
                    // 模倣点の必着手リング
                    ctx.setLineDash([cellSize * 0.16, cellSize * 0.12]);
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                    need.forEach(m => {
                        ctx.beginPath();
                        ctx.arc(padding + m.x * cellSize, padding + m.y * cellSize, cellSize * 0.40, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                    ctx.restore();
                }
            }`),
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
],
};
