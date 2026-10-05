// SWITCHGO — 転換碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'switchgo.html',
    en: 'SWITCHGO',
    jp: '転換碁',
    prefix: 'switchgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('SWITCHGO', '転換碁', 'switchgo'),
    K.params([
        { key: 'interval', label: '転換間隔', min: 4, max: 40, def: 12, unit: '手' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '転換ルール: 合計12手ごとに盤上の全ての石の色が反転する (黒⇔白)。',
        '節目直前の配置で形成した形が相手のものになる — 反転を意識した布石が肝心。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 転換ルール<br>
            ※12手ごとに盤上の全石の色が黒⇔白に反転。200手で自動終局`],
    [ONE, `        function endGameByScore() {`,
`        // 転換: 全石の色反転 + ピース所有色も入れ替え
        function applySwitch() {
            board = board.map(v => v === 1 ? 2 : v === 2 ? 1 : v);
            pieces.forEach(pc => { pc.player = pc.player === 1 ? 2 : 1; });
            deadStones = new Set([...deadStones]); // 死に石表示は維持
            soundManager.playCapture();
            // 転換演出: 盤全体の反転を大きな揺れと告知で
            const cc = Math.floor(BOARD_SIZE / 2) * (BOARD_SIZE + 1);
            fxShake(6, 360);
            fxGlow(cc, 'rgba(244,114,182,0.8)', 800);
            fxText(cc, '転換!', '#f472b6', 1100);
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 転換: N手ごとに全石が反転 (間隔は設定で調整)
            if (history.length % (P('interval') || 12) === 0) applySwitch();
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    ...EVENT_CHIP_SPEC(`'転換' + ((P('interval') || 12) - history.length % (P('interval') || 12)) + '手'`),
    ...STONE_SPEC,
],
};
