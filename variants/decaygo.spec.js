// DECAYGO — 崩壊碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'decaygo.html',
    en: 'DECAYGO',
    jp: '崩壊碁',
    prefix: 'decaygo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('DECAYGO', '崩壊碁', 'decaygo'),
    K.params([
        { key: 'decay_limit', label: '石の寿命', min: 2, max: 32, def: 8, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '碁石に寿命がある: 配置から8手 (自分+相手の着手計) 経過した石は崩壊して消える。',
        '崩壊した石はアゲハマにならない。石は古くなるほど薄く表示される。',
        '崩壊で盤面が埋まり切らないため、盤面マス数と同じ手数で自動終了して地集計に入る。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 崩壊ルール<br>
            ※碁石は配置から8手で崩壊・消滅 (薄いほど寿命が近い)`],
    [ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`,
`        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));
        // 碁石の寿命: 配置から DECAY_LIMIT ターン経過すると崩壊して消える
        const DECAY_LIMIT = 8;`],
    [ONE, BOARD_DECL,
`${BOARD_DECL}
        let ages = Array(BOARD_SIZE * BOARD_SIZE).fill(0);   // 各碁石の経過ターン (崩壊カウンタ)`],
    [ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; ages[p.y * BOARD_SIZE + p.x] = 0; });`],
    [ONE, `            // ネクストモードでは次のピースを供給`,
`            // 崩壊処理: 全碁石のカウンタを進め、寿命超過を除去 (アゲハマにはならない)
            let decayed = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) {
                    ages[i]++;
                    if (ages[i] > (P('decay_limit') || DECAY_LIMIT)) {
                        board[i] = 0; ages[i] = 0; decayed++;
                        // 風化して崩れる演出: 灰の粉塵が崩れ落ちる
                        fxBurst(i, '#a8a29e', 6, 0.9);
                        fxSplash(i, '#d6d3c0', 5);
                    }
                }
            }
            if (decayed > 0) cleanUpPieces();

            // ネクストモードでは次のピースを供給`],
    // 手数制限: 崩壊で盤面が飽和しないため盤面マス数の手数で自動終了
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            if (history.length >= BOARD_SIZE * BOARD_SIZE) endGameByScore();`],
    // 古い石ほど薄く描画 (ピース単位)
    [ONE, `                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);`,
`                // 経過ターンごとに透明度を変えて描画 (古い石ほど薄くなる)
                const byAge = {};
                alive.forEach(p => {
                    const a = ages[p.y * BOARD_SIZE + p.x] || 0;
                    (byAge[a] = byAge[a] || []).push(p);
                });
                Object.keys(byAge).forEach(a => {
                    const alpha = isDead ? 0.35 : Math.max(0.25, 1 - a / ((P('decay_limit') || DECAY_LIMIT) + 1));
                    drawPieceShape(byAge[a], padding, cellSize, fill, stroke, alpha);
                });`],
    [ONE, `                    drawPieceShape([{ x, y }], padding, cellSize, fill, stroke, isDead ? 0.35 : 1);`,
`                    const a = ages[idx] || 0;
                    const alpha = isDead ? 0.35 : Math.max(0.25, 1 - a / ((P('decay_limit') || DECAY_LIMIT) + 1));
                    drawPieceShape([{ x, y }], padding, cellSize, fill, stroke, alpha);`],
    // 永続化・履歴・オンライン同期に ages を追加
    [ONE, `                    board,
                    pieces,`,
`                    board,
                    ages,
                    pieces,`],
    [ONE, `            board = s.board;`,
`            board = s.board;
            ages = Array.isArray(s.ages) && s.ages.length === BOARD_SIZE * BOARD_SIZE
                ? s.ages : new Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
    [ONE, `                board: [...board],
                pieces:`,
`                board: [...board],
                ages: [...ages],
                pieces:`],
    [ONE, `            board = snap.board;`,
`            board = snap.board;
            ages = Array.isArray(snap.ages) ? snap.ages : new Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
    [ONE, `            board = data.board;`,
`            board = data.board;
            ages = Array.isArray(data.ages) && data.ages.length === board.length
                ? data.ages : new Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
    [ONE, `                board,
                pieces,`,
`                board,
                ages,
                pieces,`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            ages = Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
    ...STONE_SPEC,
],
};
