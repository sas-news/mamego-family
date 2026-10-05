// DRAFTGO — ドラフト碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'draftgo.html',
    en: 'DRAFTGO',
    jp: 'ドラフト碁',
    prefix: 'draftgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('DRAFTGO', 'ドラフト碁', 'draftgo'),
    ...ALGO_RULES_SPEC,
    ...ALGO_SIZE_SPEC,
    ...ALGO_PIECES_SPEC,
    K.params([
        { key: 'draft_picks', label: 'ドラフト獲得数', min: 1, max: 3, def: 3, unit: '種' },
    ]),
    [ONE, RV_BASE, rv([
        '対局前にドラフト: 7種の碁カンから黒→白の順に交互に3種ずつピック。',
        '対局中は各プレイヤーが獲得した3種のみが供給される (自軍バッグ1巡)。',
    ])],
    [ONE, INFO_BASE,
`            アルカン分子「碁カン」を配置し合う変則囲碁 (ドラフト制)<br>
            PC: クリックで配置 / 回転=⟳ボタン・Rキー・右クリック・ホイール / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定<br>
            ※対局開始前にドラフト: 黒→白と交互に3種ずつピースを獲得。以後は獲得ピースのみ出現`],
    // ドラフトパネル
    [ONE, `        <!-- ゲーム操作ボタンエリア -->`,
`        <!-- ドラフトパネル -->
        <div id="draftPanel" class="hidden w-full flex-col gap-2 p-3 rounded-xl border transition-colors">
            <span id="draftLabel" class="text-xs font-bold tracking-wider opacity-80">ドラフト</span>
            <div id="draftPool" class="flex flex-wrap gap-1.5 justify-center"></div>
            <div class="flex justify-between text-[11px] font-bold">
                <span id="draftBlackBox"></span>
                <span id="draftWhiteBox"></span>
            </div>
        </div>

        <!-- ゲーム操作ボタンエリア -->`],
    [ONE, NEXTBOX_HTML,
`                <div id="nextBox" class="hidden items-center gap-2.5">
                    <canvas id="nextPieceCanvas" width="46" height="46"></canvas>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold tracking-widest">NEXT</span>
                        <span class="text-[10px] opacity-60 leading-tight">ドラフト獲得<br>ピースのみ</span>
                    </div>
                </div>`],
    ...PER_PLAYER_SPEC,
    // ドラフト状態変数
    [ONE, `let PLAYER_PIECES = { 1: [...PIECE_TYPES], 2: [...PIECE_TYPES] }; // プレイヤー別使用ピース`,
`let PLAYER_PIECES = { 1: [...PIECE_TYPES], 2: [...PIECE_TYPES] }; // ドラフトで確定
        let draftState = null; // { pool:[types], picks:{1:[],2:[]}, turn } ドラフト中のみ非null
        let aiDraftTimer = null;
        const DRAFT_PICKS = 3; // 各プレイヤーの獲得ピース種数`],
    // draftPick系 + UI (updatePieceTrayUI直前に挿入)
    [ONE, `        function updatePieceTrayUI() {`,
`        // ---- ドラフトフェーズ ----
        function initDraft() {
            draftState = { pool: shuffleTypes(PIECE_TYPES), picks: { 1: [], 2: [] }, turn: 1 };
            pieceQueues = { 1: [], 2: [] };
        }

        function applyDraftPick(type) {
            if (!draftState) return;
            draftState.pool = draftState.pool.filter(t => t !== type);
            draftState.picks[draftState.turn].push(type);
            soundManager.playPlace();
            // ピック演出: 選ばれたボタンを金色に瞬かせる
            {
                const btn = draftPool && draftPool.querySelector('button[data-type="' + type + '"]');
                if (btn) {
                    btn.style.outline = '3px solid #f59e0b';
                    btn.style.outlineOffset = '2px';
                    setTimeout(() => { btn.style.outline = 'none'; btn.style.outlineOffset = '0'; }, 450);
                }
            }
            const draftPicks = P('draft_picks') || DRAFT_PICKS;
            if (draftState.picks[1].length >= draftPicks && draftState.picks[2].length >= draftPicks) {
                finishDraft();
            } else {
                draftState.turn = draftState.turn === 1 ? 2 : 1;
            }
            updateUI();
            saveState();
            if (gameMode === 'online' && onlineRoomId) syncOnlineState();
            maybeAiDraft();
        }

        function draftPick(type) {
            if (!draftState || gameOver || !draftState.pool.includes(type)) return;
            if (gameMode === 'online' && draftState.turn !== myOnlineRole) return;
            if (gameMode === 'ai' && draftState.turn === aiPlayer) return;
            applyDraftPick(type);
        }

        function aiDraftPick() {
            if (!draftState || gameOver) return;
            applyDraftPick(draftState.pool[Math.floor(Math.random() * draftState.pool.length)]);
        }

        function maybeAiDraft() {
            if (aiDraftTimer) return;
            if (!(draftState && gameMode === 'ai' && draftState.turn === aiPlayer)) return;
            aiDraftTimer = setTimeout(() => { aiDraftTimer = null; aiDraftPick(); }, 600);
        }

        function finishDraft() {
            PLAYER_PIECES = { 1: [...draftState.picks[1]], 2: [...draftState.picks[2]] };
            draftState = null;
            pieceQueues = { 1: shuffleTypes(PLAYER_PIECES[1]), 2: shuffleTypes(PLAYER_PIECES[2]) };
            turn = 1;
            currentPieceType = drawNextPiece();
            // ドラフト完了の告知 (パネルが隠れる直前に盤中央へ)
            const dc = Math.floor(BOARD_SIZE / 2) * (BOARD_SIZE + 1);
            fxGlow(dc, 'rgba(245,158,11,0.9)', 900);
            fxText(dc, 'ドラフト完了!', '#f59e0b', 1200);
        }

        function buildDraftPool() {
            draftPool.innerHTML = '';
            PIECE_TYPES.forEach(t => {
                const b = document.createElement('button');
                b.dataset.type = t;
                b.className = 'w-10 h-10 rounded-lg border hover:opacity-80 active:scale-95 transition-all disabled:opacity-40';
                const c = document.createElement('canvas');
                c.width = 40; c.height = 40;
                b.appendChild(c);
                drawMiniPiece(c, t, 0, 1);
                b.addEventListener('click', () => { soundManager.init(); draftPick(t); });
                draftPool.appendChild(b);
            });
        }

        function updateDraftUI() {
            if (!draftPanel) return;
            draftPanel.classList.toggle('hidden', !draftState);
            draftPanel.classList.toggle('flex', !!draftState);
            if (!draftState) return;
            const p = draftState.turn;
            draftLabel.textContent = \`ドラフト: \${p === 1 ? '黒' : '白'}の選択 (\${draftState.picks[p].length}/\${(P('draft_picks') || DRAFT_PICKS)})\`;
            draftPool.querySelectorAll('button').forEach(b => {
                const left = draftState.pool.includes(b.dataset.type);
                b.style.opacity = left ? 1 : 0.25;
                b.disabled = !left
                    || (gameMode === 'online' && p !== myOnlineRole)
                    || (gameMode === 'ai' && p === aiPlayer);
            });
            draftBlackBox.textContent = \`黒: \${draftState.picks[1].join('・') || '—'}\`;
            draftWhiteBox.textContent = \`白: \${draftState.picks[2].join('・') || '—'}\`;
        }

        function updatePieceTrayUI() {`],
    // DOM参照
    [ONE, `        const nextPieceCanvas = document.getElementById('nextPieceCanvas');`,
`        const nextPieceCanvas = document.getElementById('nextPieceCanvas');
        const draftPanel = document.getElementById('draftPanel');
        const draftLabel = document.getElementById('draftLabel');
        const draftPool = document.getElementById('draftPool');
        const draftBlackBox = document.getElementById('draftBlackBox');
        const draftWhiteBox = document.getElementById('draftWhiteBox');`],
    // 着手・パス・回転・ホールドはドラフト中禁止
    [ALL, `gamePhase !== 'playing' || !isMyTurn()) return;`, `gamePhase !== 'playing' || draftState || !isMyTurn()) return;`],
    // ドラフト中のパスは自動ピックとして扱う (ドラフト操作がない限り対局が進行しないデッドロックを防ぐ)
    [ONE, `            if (gameOver || gamePhase !== 'playing' || draftState || !isMyTurn()) return;

            prevBoard = null; // パスでコウ制限は解除`,
`            if (gameOver || gamePhase !== 'playing') return;
            // ドラフト中のパス: 自分のピック順なら代わりにランダム自動ピック
            // (ドラフト中は turn が黒のままなので isMyTurn ではなく draftState.turn で判定する)
            if (draftState) {
                const myPick = gameMode === 'online'
                    ? draftState.turn === myOnlineRole
                    : !(gameMode === 'ai' && draftState.turn === aiPlayer);
                if (myPick) aiDraftPick();
                return;
            }
            if (!isMyTurn()) return;

            prevBoard = null; // パスでコウ制限は解除`],
    [ONE, `            if (!isMyTurn()) return;

            const anchor = getAnchorFromEvent(e);`,
`            if (draftState || !isMyTurn()) return;

            const anchor = getAnchorFromEvent(e);`],
    [ONE, `            btnHold.disabled = holdUsed || gameOver || gamePhase !== 'playing' || !isMyTurn();`,
`            btnHold.disabled = holdUsed || gameOver || gamePhase !== 'playing' || !!draftState || !isMyTurn();`],
    // updateUI → updateDraftUI
    [ONE, UI_TAIL,
`            btnUndo.disabled = !canUndo();
            updatePieceTrayUI();
            render();
            updateDraftUI();
        }`],
    // resetGame → initDraft (供給はドラフト完了後に開始)
    [ONE, `            if (pieceMode === 'next') {
                pieceQueues = { 1: shuffledBag(1), 2: shuffledBag(2) };
                currentPieceType = drawNextPiece();
            }`,
`            pieceMode = 'next';
            initDraft();`],
    // saveState/loadState/online に draftState・PLAYER_PIECES を追加
    [ONE, `                    pieceQueues,
                    heldPieces,`,
`                    pieceQueues,
                    draftState,
                    playerPieces: PLAYER_PIECES,
                    heldPieces,`],
    [ONE, `            pieceQueues = (s.pieceQueues && typeof s.pieceQueues === 'object')
                ? { 1: validTypes(s.pieceQueues[1]), 2: validTypes(s.pieceQueues[2]) }
                : { 1: [], 2: [] };
            if (pieceMode === 'next' && pieceQueues[turn].length === 0) pieceQueues[turn] = shuffledBag(turn);`,
`            pieceQueues = (s.pieceQueues && typeof s.pieceQueues === 'object')
                ? { 1: validTypes(s.pieceQueues[1]), 2: validTypes(s.pieceQueues[2]) }
                : { 1: [], 2: [] };
            draftState = s.draftState || null;
            if (s.playerPieces && typeof s.playerPieces === 'object') {
                PLAYER_PIECES = { 1: validTypes(s.playerPieces[1]), 2: validTypes(s.playerPieces[2]) };
            }
            if (!draftState && pieceMode === 'next' && pieceQueues[turn].length === 0) {
                pieceQueues[turn] = shuffledBag(turn);
            }
            if (draftState) maybeAiDraft();`],
    [ONE, `            if (data.pieceQueues) pieceQueues = data.pieceQueues;`,
`            if (data.pieceQueues) pieceQueues = data.pieceQueues;
            draftState = data.draftState || null;
            if (data.playerPieces) PLAYER_PIECES = data.playerPieces;
            if (draftState) maybeAiDraft();`],
    [ONE, `                pieceQueues,
                heldPieces,`,
`                pieceQueues,
                draftState,
                playerPieces: PLAYER_PIECES,
                heldPieces,`],
    // onloadでドラフトプール構築
    [ONE, `            buildPalette();`,
`            buildPalette();
            buildDraftPool();`],
],
};
