// MOLEGO — もぐら碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'molego.html',
    en: 'MOLEGO',
    jp: 'もぐら碁',
    prefix: 'molego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('MOLEGO', 'もぐら碁', 'molego'),
    K.params([
        { key: 'mol_rate', label: 'もぐら移動確率', min: 0.02, max: 0.8, def: 0.18, step: 0.02 },
    ]),
    [ONE, RV_BASE, rv([
        'もぐらルール: 着手ごとに盤上の各碁石が約18%の確率で隣の空点へ移動する。',
        '移動はランダム。移動で空いた点・新しい接続は通常ルールどおり機能する。',
        '盤面がなかなか落ち着かないため、盤面マス数と同じ手数で自動終了して地集計に入る。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + もぐらルール<br>
            ※着手ごとに各碁石がランダムに隣の空点へ移動することがある`],
    [ONE, `        let history = []; // 1手戻る用: 各着手前のスナップショットのスタック`,
`        let history = []; // 1手戻る用: 各着手前のスナップショットのスタック
        const MOL_RATE = 0.18; // もぐらルール: 各碁石の移動確率
        function applyMole() {
            const order = [];
            for (let i = 0; i < board.length; i++) if (board[i] !== 0) order.push(i);
            for (let i = order.length - 1; i > 0; i--) {
                const j = (Math.random() * (i + 1)) | 0;
                [order[i], order[j]] = [order[j], order[i]];
            }
            order.forEach(i => {
                if (board[i] === 0 || Math.random() > (P('mol_rate') || MOL_RATE)) return;
                const empty = getNeighbors(i).filter(n => board[n] === 0);
                if (!empty.length) return;
                const dst = empty[(Math.random() * empty.length) | 0];
                board[dst] = board[i]; board[i] = 0;
                fxSlide(i, dst, 380); // もぐらが潜る軌跡
                fxSplash(dst, 'rgba(150,115,75,0.8)', 6); // 顔を出す土
            });
            cleanUpPieces();
        }`],
    [ONE, `            // ネクストモードでは次のピースを供給`,
`            // もぐら処理: 各碁石が確率で隣へ移動
            applyMole();

            // ネクストモードでは次のピースを供給`],
    // 手数制限: もぐら移動で盤面が収束しないため盤面マス数の手数で自動終了
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            if (history.length >= BOARD_SIZE * BOARD_SIZE) endGameByScore();`],
    ...STONE_SPEC,
],
};
