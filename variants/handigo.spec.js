// HANDIGO — 置碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'handigo.html',
    en: 'HANDIGO',
    jp: '置碁',
    prefix: 'handigo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('HANDIGO', '置碁', 'handigo'),
    [ONE, RV_BASE, rv([
        '置碁: 対局開始時に黒石をハンデ数だけ事前配置する (設定で なし/2/4/6/9 子)。',
        '置碁ありの場合はコミは0.5目になる (実質ハンデなし互先=コミ6.5)。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 置碁ハンデ<br>
            ※設定で黒石を事前配置 (2〜9子)。置碁時はコミ0.5目`],
    // 設定に置碁セクション
    [ONE, `            <!-- 2. 対戦モード -->`,
`            <!-- 置碁 -->
            <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-neutral-500">置碁 (ハンデ)</label>
                <div class="grid grid-cols-5 gap-2">
                    <button data-handi="0" class="btn-handi py-2 rounded-lg border border-neutral-300 font-bold text-xs hover:bg-neutral-100 transition-all">なし</button>
                    <button data-handi="2" class="btn-handi py-2 rounded-lg border border-neutral-300 font-bold text-xs hover:bg-neutral-100 transition-all">2子</button>
                    <button data-handi="4" class="btn-handi py-2 rounded-lg border border-neutral-300 font-bold text-xs hover:bg-neutral-100 transition-all">4子</button>
                    <button data-handi="6" class="btn-handi py-2 rounded-lg border border-neutral-300 font-bold text-xs hover:bg-neutral-100 transition-all">6子</button>
                    <button data-handi="9" class="btn-handi py-2 rounded-lg border border-neutral-300 font-bold text-xs hover:bg-neutral-100 transition-all">9子</button>
                </div>
            </div>

            <!-- 2. 対戦モード -->`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let handicap = 0; // 置碁のハンデ数 (0=互先)

        // 置碁位置 (標準的な置き順: 対角隅→辺→天元)
        function getHandicapPoints(n) {
            const low = n > 9 ? 3 : 2;
            const mid = (n - 1) / 2, hi = n - 1 - low;
            return [[low, hi], [hi, low], [hi, hi], [low, low],
                    [low, mid], [hi, mid], [mid, low], [mid, hi], [mid, mid]];
        }`],
    [ONE, `            pieces = [];
            turn = 1;`,
`            pieces = [];
            // 置碁: ハンデ数だけ黒石を事前配置
            if (handicap > 0) {
                getHandicapPoints(BOARD_SIZE).slice(0, handicap).forEach(([hx, hy], k) => {
                    board[hy * BOARD_SIZE + hx] = 1;
                    pieces.push({ id: Date.now() + k, player: 1, type: 'STONE', rot: 0, cells: [{ x: hx, y: hy }] });
                    fxGlow(hy * BOARD_SIZE + hx, '#fbbf24', 700 + k * 60);
                    if (k === 0) fxText(hy * BOARD_SIZE + hx, '置碁 ' + handicap + '子', '#f59e0b', 1300);
                });
            }
            komi = handicap > 0 ? 0.5 : 6.5;
            turn = 1;`],
    [ONE, `                    holdUsed,
                    gameMode,`,
`                    holdUsed,
                    handicap,
                    gameMode,`],
    [ONE, `            holdUsed = !!s.holdUsed;`,
`            holdUsed = !!s.holdUsed;
            handicap = Number.isInteger(s.handicap) ? s.handicap : 0;`],
    [ONE, `            document.querySelectorAll('.btn-mode').forEach(b => {
                const active = b.dataset.mode === gameMode;`,
`            document.querySelectorAll('.btn-handi').forEach(b => {
                const active = parseInt(b.dataset.handi) === handicap;
                b.classList.toggle('bg-neutral-900', active);
                b.classList.toggle('text-white', active);
            });
            document.querySelectorAll('.btn-mode').forEach(b => {
                const active = b.dataset.mode === gameMode;`],
    [ONE, `        // モード選択ボタン`,
`        // 置碁ボタン
        document.querySelectorAll('.btn-handi').forEach(btn => {
            btn.addEventListener('click', (e) => {
                soundManager.playClick();
                document.querySelectorAll('.btn-handi').forEach(b => b.classList.remove('bg-neutral-900', 'text-white'));
                e.target.classList.add('bg-neutral-900', 'text-white');
                handicap = parseInt(e.target.dataset.handi);
                saveState();
            });
        });

        // モード選択ボタン`],
    ...STONE_SPEC,
],
};
