// RUSHGO — スピード碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

const RUSH_TIMER_FN = `
        // ---- 制限時間タイマー ----
        function armMoveTimer() {
            clearMoveTimer();
            const active = timeLimit > 0 && !gameOver && gamePhase === 'playing' && isMyTurn();
            const timerFill = document.getElementById('timerFill');
            const timerText = document.getElementById('timerText');
            if (!active) { if (timerText) timerText.textContent = '-'; if (timerFill) timerFill.style.width = '100%'; return; }
            moveDeadline = Date.now() + timeLimit * 1000;
            tickMoveTimer();
            moveTimerInterval = setInterval(tickMoveTimer, 100);
        }
        function tickMoveTimer() {
            const timerFill = document.getElementById('timerFill');
            const timerText = document.getElementById('timerText');
            const remain = Math.max(0, moveDeadline - Date.now());
            if (timerText) timerText.textContent = (remain / 1000).toFixed(1);
            if (timerFill) {
                timerFill.style.width = (remain / (timeLimit * 1000) * 100) + '%';
                timerFill.style.background = remain < 2500 ? '#ef4444' : ''; // 残り2.5秒で赤点滅
            }
            if (remain <= 0) {
                clearMoveTimer();
                if (!gameOver && gamePhase === 'playing' && isMyTurn()) {
                    // 時間切れ: 盤中央に警告と揺れ
                    const cc = Math.floor(BOARD_SIZE / 2) * (BOARD_SIZE + 1);
                    fxShake(4, 220);
                    fxText(cc, '時間切れ!', '#ef4444', 1100);
                    handlePass();
                }
            }
        }
        function clearMoveTimer() {
            if (moveTimerInterval) { clearInterval(moveTimerInterval); moveTimerInterval = null; }
        }
`;
module.exports = {
    file: 'rushgo.html',
    en: 'RUSHGO',
    jp: 'スピード碁',
    prefix: 'rushgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('RUSHGO', 'スピード碁', 'rushgo'),
    [ONE, RV_BASE, rv([
        '1手ごとの制限時間付き (設定でなし/5/10/30秒)。時間切れは自動パスになる。',
        'タイムバーはステータスカードの下に常時表示される。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + スピードルール<br>
            ※1手の制限時間を超えると自動でパスされる`],
    // タイマー表示 (ステータスカード内)
    [ONE, `                    <span id="komiDisplay" class="font-bold font-mono">6.5</span>
                </div>
            </div>
        </div>`,
`                    <span id="komiDisplay" class="font-bold font-mono">6.5</span>
                </div>
            </div>

            <!-- 制限時間タイマー -->
            <div class="flex items-center gap-2 pt-1 border-t border-current/10">
                <span class="text-xs opacity-70">残り:</span>
                <div class="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                    <div id="timerFill" class="h-full bg-current transition-all duration-100" style="width: 100%"></div>
                </div>
                <span id="timerText" class="font-mono text-xs font-bold w-10 text-right">-</span>
            </div>
        </div>`],
    // 設定に制限時間セクション追加
    [ONE, `            <!-- 2. 対戦モード -->`,
`            <!-- 制限時間 -->
            <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-neutral-500">1手の制限時間</label>
                <div class="grid grid-cols-4 gap-2">
                    <button data-tlimit="0" class="btn-tlimit py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">なし</button>
                    <button data-tlimit="5" class="btn-tlimit py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">5秒</button>
                    <button data-tlimit="10" class="btn-tlimit py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">10秒</button>
                    <button data-tlimit="30" class="btn-tlimit py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">30秒</button>
                </div>
            </div>

            <!-- 2. 対戦モード -->`],
    [ONE, `        let history = []; // 1手戻る用: 各着手前のスナップショットのスタック`,
`        let history = []; // 1手戻る用: 各着手前のスナップショットのスタック
        let timeLimit = 10;    // 1手の制限時間 (秒)。0=無制限
        let moveDeadline = 0;
        let moveTimerInterval = null;`],
    [ONE, `                    holdUsed,
                    gameMode,`,
`                    holdUsed,
                    timeLimit,
                    gameMode,`],
    [ONE, `            holdUsed = !!s.holdUsed;`,
`            holdUsed = !!s.holdUsed;
            timeLimit = [0, 5, 10, 30].includes(s.timeLimit) ? s.timeLimit : 10;`],
    [ONE, `            document.querySelectorAll('.btn-mode').forEach(b => {
                const active = b.dataset.mode === gameMode;`,
`            document.querySelectorAll('.btn-tlimit').forEach(b => {
                const active = parseInt(b.dataset.tlimit) === timeLimit;
                b.classList.toggle('bg-neutral-900', active);
                b.classList.toggle('text-white', active);
            });
            document.querySelectorAll('.btn-mode').forEach(b => {
                const active = b.dataset.mode === gameMode;`],
    [ONE, `        // モード選択ボタン`,
`        // 制限時間ボタン
        document.querySelectorAll('.btn-tlimit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                soundManager.playClick();
                document.querySelectorAll('.btn-tlimit').forEach(b => b.classList.remove('bg-neutral-900', 'text-white'));
                e.target.classList.add('bg-neutral-900', 'text-white');
                timeLimit = parseInt(e.target.dataset.tlimit);
                saveState();
                updateUI();
            });
        });

        // モード選択ボタン`],
    [ONE, `        function updateUI() {`, RUSH_TIMER_FN + `
        function updateUI() {`],
    [ONE, UI_TAIL,
`            btnUndo.disabled = !canUndo();
            updatePieceTrayUI();
            render();
            armMoveTimer();
        }`],
    ...STONE_SPEC,
],
};
