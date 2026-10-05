// FRONTGO — 前線碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'frontgo.html',
    en: 'FRONTGO',
    jp: '前線碁',
    prefix: 'frontgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('FRONTGO', '前線碁', 'frontgo'),
    K.params([
        { key: 'interval', label: '前線前進間隔', min: 1, max: 12, def: 4, unit: '手' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '前線ルール: 4手ごとに前線が1行下へ進む。前線より上の行の石は確定済みで取られなくなる。',
        '上から確定していくので、盤面上部の陣取りが早い者勝ちになる。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 前線ルール<br>
            ※4手ごとに前線が1行下へ。前線より上の石は取られない。200手で自動終局`],
    [ONE, `        function endGameByScore() {`,
`        const frontRow = () => Math.min(((history.length / (P('interval') || 4)) | 0), BOARD_SIZE - 1);
        function endGameByScore() {`],
    [ONE, CAPTURE_BLOCK,
`            let captured = getCapturedStones(board, opponent);
            // 前線: 前線より上の石は確定済みで取られない
            captured = captured.filter(i => ((i / BOARD_SIZE) | 0) >= frontRow());
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 前線の前進 (N手ごと): 確定した行を光らせ前線降下を告げる
            if (history.length % (P('interval') || 4) === 0 && frontRow() > 0) {
                const sr = frontRow() - 1;
                for (let x = 0; x < BOARD_SIZE; x++) {
                    fxGlow(sr * BOARD_SIZE + x, 'rgba(230,180,80,0.75)', 750);
                }
                fxText(sr * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '前線↓', 'rgba(230,190,90,0.95)', 1000);
            }
            // 手数上限で自動終局 (最下行での追跡膠着を防ぐ)
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + ' 前線' + (frontRow() + 1) + '行';`],
    // 前線: 確定済みの上方を薄いヴェールで覆い、前線を破線で示す
    CUE_STARS(`            // 前線の表示: 確定済み領域の薄いヴェール + 前線の破線
            {
                const fr = frontRow();
                const x0 = padding - cellSize * 0.5, x1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                if (fr > 0) {
                    ctx.save();
                    ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.07);
                    ctx.fillRect(x0, padding - cellSize * 0.5, x1 - x0, fr * cellSize);
                    ctx.restore();
                }
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.5);
                ctx.setLineDash([cellSize * 0.15, cellSize * 0.11]);
                ctx.lineWidth = Math.max(1, cellSize * 0.03);
                const fy = padding + (fr - 0.5) * cellSize;
                ctx.beginPath();
                ctx.moveTo(x0, fy);
                ctx.lineTo(x1, fy);
                ctx.stroke();
                ctx.restore();
            }`),
    ...STONE_SPEC,
],
};
