// ZOMBEGO — ゾンビ碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'zombego.html',
    en: 'ZOMBEGO',
    jp: 'ゾンビ碁',
    prefix: 'zombego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('ZOMBEGO', 'ゾンビ碁', 'zombego'),
    K.params([
        { key: 'wander_prob', label: '徘徊確率', min: 0.1, max: 1, def: 1, step: 0.1 },
    ]),
    [ONE, RV_BASE, rv([
        'ゾンビルール: 取られた石は中立の「ゾンビ」(壁ブロック) になり、毎手ランダムに隣の空点へ徘徊する。',
        'ゾンビは置けず呼吸点にも地にもならない。徘徊で開いたり塞いだりする盤面が生まれる。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + ゾンビルール<br>
            ※取られた石は中立ゾンビになり毎手ランダム徘徊する`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let zombies = []; // ゾンビの盤面インデックス一覧`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            zombies = [];`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // ゾンビ: 取られたマスは中立ゾンビ(壁)になる
                captured.forEach(idx => { board[idx] = 3; zombies.push(idx); fxGlow(idx, '#a3e635', 620); });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // ゾンビ徘徊: 各ゾンビがランダムな空点へ1マス移動
            zombies = zombies.filter(zi => board[zi] === 3);
            zombies.forEach((zi, k) => {
                if (Math.random() >= (P('wander_prob') || 1)) return; // 徘徊確率 (設定で調整)
                const cand = getNeighbors(zi).filter(i => board[i] === 0);
                if (!cand.length) return;
                const ni = cand[(Math.random() * cand.length) | 0];
                board[ni] = 3; board[zi] = 0; zombies[k] = ni;
                fxSlide(zi, ni, 520); // 徘徊の軌跡
            });`],
    // undo/保存/同期
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                zombies: [...zombies],
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            zombies = snap.zombies ? [...snap.zombies] : zombies;`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    zombies: [...zombies],
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            zombies = Array.isArray(s.zombies) ? [...s.zombies] : [];`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                zombies,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (Array.isArray(data.zombies)) zombies = [...data.zombies];`],
    // ゾンビは腐ったオリーブ肌 + 瞬く赤い目
    [ONE, COVERED_ANCHOR, texDraw(PAINT_ZOMBIE)],
    ...WALL_GUARD_SPEC,
    // ゾンビの目の瞬きを動かす霧
    [ONE, FX_BOOT, FX_BOOT + AMBIENT_MIST('150,180,110')],
    ...STONE_SPEC,
],
};
