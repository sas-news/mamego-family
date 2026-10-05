// TIDEGO — 潮汐碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'tidego.html',
    en: 'TIDEGO',
    jp: '潮汐碁',
    prefix: 'tidego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('TIDEGO', '潮汐碁', 'tidego'),
    K.params([
        { key: 'interval', label: '潮汐間隔', min: 4, max: 30, def: 10, unit: '手' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '潮汐ルール: 10手ごとに満ち干が交代。満潮時は盤の外周1列が水没 (壁) になり、そこにある石は消える。',
        '干潮時は外周が戻る。外周の陣地は定期的に失われる。手番横の表示が潮位。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 潮汐ルール<br>
            ※10手ごとに外周が水没↔復活。手番横の🌊が満潮。200手で自動終局`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let tideHigh = false; // 満潮フラグ`],
    [ONE, RESET_BOARD,
`${RESET_BOARD}
            tideHigh = false;`],
    [ONE, `        function endGameByScore() {`,
`        // 潮汐: 外周1列を水没/復活させる
        function applyTide() {
            tideHigh = !tideHigh;
            const n = BOARD_SIZE;
            const ci = Math.floor(n / 2) * n + Math.floor(n / 2);
            fxText(ci, tideHigh ? '満潮' : '干潮', '#7dd3fc', 1100);
            fxShake(3, 260);
            for (let i = 0; i < n; i++) {
                [i, (n - 1) * n + i, i * n, i * n + n - 1].forEach(idx => {
                    board[idx] = tideHigh ? 3 : 0;
                    if (tideHigh) fxSplash(idx, '#7dd3fc', 4); // 着水
                    else fxGlow(idx, '#bae6fd', 420);          // 潮が退く
                });
            }
            pieces.forEach(pc => {
                pc.cells = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
            });
            cleanUpPieces();
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 潮汐: N手ごとに満ち干交代 (間隔は設定で調整)
            if (history.length % (P('interval') || 10) === 0) applyTide();
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + (tideHigh ? ' 🌊満' : ' 干');`],
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                tideHigh,
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            if (snap.tideHigh !== undefined) tideHigh = snap.tideHigh;`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    tideHigh,
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            if (s.tideHigh !== undefined) tideHigh = s.tideHigh;`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                tideHigh,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.tideHigh !== undefined) tideHigh = data.tideHigh;`],
    // 水没部は揺れる水面
    [ONE, COVERED_ANCHOR, texDraw(PAINT_WATER('#1b5e8a', '#0a3049'))],
    ...WALL_GUARD_SPEC,
    // 満潮時の水面のきらめき
    [ONE, FX_BOOT, FX_BOOT + AMBIENT_WATER],
    ...EVENT_CHIP_SPEC(`'潮汐' + ((P('interval') || 10) - history.length % (P('interval') || 10)) + '手'`),
    ...STONE_SPEC,
],
};
