// ASYMGO — 非対称碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'asymgo.html',
    en: 'ASYMGO',
    jp: '非対称碁',
    prefix: 'asymgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('ASYMGO', '非対称碁', 'asymgo'),
    ...ALGO_RULES_SPEC,
    ...ALGO_SIZE_SPEC,
    ...ALGO_PIECES_SPEC,
    [ONE, RV_BASE, rv([
        '非対称ルール: 使える碁カンがプレイヤーで違う。',
        '黒=直鎖アルカン (ブタン・ペンタン・ヘキサン) / 白=分枝アルカン (イソブタン・イソペンタン・ネオペンタン・ネオヘキサン)。',
        '供給は各プレイヤー自分のセットから1巡バッグ。自由選択モードでも自軍の種類のみ選べる。',
    ])],
    [ONE, INFO_BASE,
`            アルカン分子「碁カン」を配置し合う変則囲碁 (非対称)<br>
            PC: クリックで配置 / 回転=⟳ボタン・Rキー・右クリック・ホイール / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定<br>
            ※黒=直鎖 (ブタン・ペンタン・ヘキサン) / 白=分枝 (イソブタン・イソペンタン・ネオペンタン・ネオヘキサン)`],
    // 使用セットの凡例
    [ONE, NEXTBOX_HTML,
`                <div id="nextBox" class="hidden items-center gap-2.5">
                    <canvas id="nextPieceCanvas" width="46" height="46"></canvas>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold tracking-widest">NEXT</span>
                        <span class="text-[10px] opacity-60 leading-tight">自軍バッグ<br>から供給</span>
                    </div>
                </div>
                <span class="text-[10px] opacity-60">使用ピース — 黒: 直鎖 / 白: 分枝</span>`],
    ...PER_PLAYER_SPEC,
    // 黒=直鎖 / 白=分枝 のセットに書き換え
    [ONE, `let PLAYER_PIECES = { 1: [...PIECE_TYPES], 2: [...PIECE_TYPES] }; // プレイヤー別使用ピース`,
`let PLAYER_PIECES = { 1: ['BUTANE', 'PENTANE', 'HEXANE'], 2: ['ISOBUTANE', 'ISOPENTANE', 'NEOPENTANE', 'NEOHEXANE'] }; // 黒=直鎖 / 白=分枝`],
    // 配置時に系統色のリング (黒=直鎖は琥珀 / 白=分枝は水色)
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}
            move.cells.forEach(p => fxGlow(p.y * BOARD_SIZE + p.x, player === 1 ? '#f59e0b' : '#38bdf8', 520));`],
],
};
