// POLYGO — ポリ碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'polygo.html',
    en: 'POLYGO',
    jp: 'ポリ碁',
    prefix: 'polygo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('POLYGO', 'ポリ碁', 'polygo'),
    [ONE, RCM_BASE, K.RCM_ALGO],
    ...ALGO_SIZE_SPEC,
    K.params([
        { key: 'monomers', label: '鎖の長さ', min: 2, max: 8, def: 4, unit: 'マス' },
    ]),
    [ONE, RV_BASE, rv([
        '毎手、盤上に4連のポリマー鎖を自由に描いて置く (形は固定ではない)。',
        '鎖は隣接する空点にのみ伸ばせる。完成した鎖上をタップするか「配置する」で確定。',
        '窒息領域: 4マス未満の空領域は呼吸点にも地にもならない。',
    ])],
    [ONE, RC_BASE, rc([
        '鎖の構築: タップ/クリックで隣接する空点にモノマーを追加 (4連で完成)。',
        '確定: 完成した鎖の上をタップ、または「配置する」ボタン。',
        '1マス戻す: 右クリック・Rキー・「↩ 1マス戻す」ボタン。鎖の途中をタップするとそこまで切り戻せる。',
    ])],
    [ONE, INFO_BASE,
`            ポリマー鎖を自由に描く変則囲碁<br>
            タップ/クリックでモノマーを追加し、4連のポリマー鎖を構築 (隣接する空点にのみ伸ばせます)<br>
            完成した鎖の上をタップ or 「配置する」で確定。末尾を戻す=右クリック・Rキー・「↩ 1マス戻す」`],
    // ピース定義 → モノマー鎖
    [ONE, `        // アルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // すべて4原子以上なので「4マス未満の窒息領域」ルールがそのまま機能する。
        // 通常の碁石: 1手につき空いている交点へ1石を置く標準的な囲碁。
        const MOLECULES = {
            STONE: { name: '碁石', iupac: '', formula: '', atoms: [[0,0]] }
        };`,
`        // ポリマー鎖: ピースは固定形を持たず、毎手 MONOMERS 連の自由な鎖を描く。
        const MOLECULES = {}; // 固定ピースなし`],
    [ONE, `        const PIECE_TYPES = Object.keys(MOLECULES);
        const PIECE_DEFS = {};
        PIECE_TYPES.forEach(t => { PIECE_DEFS[t] = MOLECULES[t].atoms; });
        // 最小分子サイズ (窒息領域の判定しきい値)
        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`,
`        const PIECE_TYPES = Object.keys(MOLECULES);
        const PIECE_DEFS = {};
        PIECE_TYPES.forEach(t => { PIECE_DEFS[t] = MOLECULES[t].atoms; });
        // 窒息領域のしきい値はモノマー数と同じ (設定の monomers、既定4)
        let PIECE_SIZE = 4;
        let MONOMERS = 4;
        function syncPolyParams() {
            MONOMERS = Math.max(2, Math.min(8, P('monomers') || 4));
            PIECE_SIZE = MONOMERS;
        }
        syncPolyParams();
        // 設定変更で鎖の長さを即時反映 (構築中の鎖は破棄)
        function onVariantParam(p) {
            if (p.key === 'monomers') {
                syncPolyParams();
                chainCells = [];
                refreshChainPreview();
                updatePieceTrayUI();
                render();
            }
        }`],
    [ONE, `        // 各分子の回転バリエーションを事前生成 (重複排除)
        ${OCNT_BASE}
        const ORIENTATIONS = {};
        PIECE_TYPES.forEach(type => {
            let cells = normalizeCells(PIECE_DEFS[type]);
            const seen = new Set();
            const list = [];
            for (let i = 0; i < 4; i++) {
                const n = normalizeCells(cells);
                const k = cellsKey(n);
                if (!seen.has(k)) {
                    seen.add(k);
                    list.push(n);
                }
                cells = rot90(cells);
            }
            ORIENTATIONS[type] = list;
        });`,
`        const ORIENTATIONS = {}; // 固定形なし

        // 構築中のポリマー鎖 (盤面座標の配列)
        let chainCells = [];

        function refreshChainPreview() {
            previewPos = chainCells.length
                ? { cells: chainCells, valid: chainCells.length === MONOMERS && isValidPlacement(chainCells, turn) }
                : null;
        }`],
    [ONE, SHUFFLE_FN,
`        function shuffledBag() { return []; } // ポリマー鎖は自由描画のみ`],
    [ONE, PMODE_DECL,
`        let pieceMode = 'free'; // ポリマー鎖は自由描画のみ`],
    [ONE, `            pieceMode = ['free', 'next'].includes(s.pieceMode) ? s.pieceMode : 'next';`,
`            pieceMode = 'free';`],
    [ONE, `let currentPieceType = 'STONE';`, `let currentPieceType = 'POLY';`],
    [ONE, `? s.currentPieceType : 'STONE'`, `? s.currentPieceType : 'POLY'`],
    // 設定: 供給モード → 説明文 / 図鑑 → 除去
    [ONE, SUPPLY_SEC,
`            <!-- 3. ポリマー説明 -->
            <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-neutral-500">ピース</label>
                <p class="text-xs text-neutral-500">毎ターン、隣接する空点へ4連のポリマー鎖を自由に描いて配置します。形は毎手自分で決められます。</p>
            </div>`],
    [ONE, CATALOG_ROW, ''],
    [ONE, `        btnOpenCatalog.addEventListener('click', () => {`,
          `        if (btnOpenCatalog) btnOpenCatalog.addEventListener('click', () => {`],
    [ONE, `        btnCloseCatalog.addEventListener('click', () => {`,
          `        if (btnCloseCatalog) btnCloseCatalog.addEventListener('click', () => {`],
    // トレイUI: 鎖の構築状況表示 + ボタン流用
    [ONE, TRAY_UI_BASE,
`        // ポリマー鎖の構築状況をトレイに表示 (進捗ドット + 確定ボタン制御)
        function updatePieceTrayUI() {
            currentPieceLabel.textContent = 'モノマー鎖';
            const c = currentPieceCanvas.getContext('2d');
            const cw = currentPieceCanvas.width, ch = currentPieceCanvas.height;
            c.clearRect(0, 0, cw, ch);
            const R = 9, gap = 6;
            const totalW = MONOMERS * R * 2 + (MONOMERS - 1) * gap;
            const startX = (cw - totalW) / 2 + R;
            const cy = ch / 2;
            for (let i = 0; i < MONOMERS; i++) {
                c.beginPath();
                c.arc(startX + i * (R * 2 + gap), cy, R, 0, Math.PI * 2);
                if (i < chainCells.length) {
                    c.fillStyle = turn === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                    c.fill();
                }
                c.strokeStyle = turn === 1 ? currentTheme.p1Stroke : currentTheme.p2Stroke;
                c.lineWidth = 1.5;
                c.stroke();
            }
            paletteBox.classList.add('hidden');
            nextBox.classList.add('hidden');
            holdPieceCanvas.style.display = 'none';
            trayModeLabel.textContent = \`チェーン \${chainCells.length}/\${MONOMERS}\`;
            btnHold.disabled = !(chainCells.length === MONOMERS && !gameOver
                && gamePhase === 'playing' && isMyTurn()
                && isValidPlacement(chainCells, turn));
            btnRotate.disabled = chainCells.length === 0;
        }`],
    // ホールド/回転の流用: 確定と1マス戻し
    [ONE, HOLD_ROTATE_FNS,
`        // 「配置する」: 完成した鎖を確定して着手
        function holdPiece() {
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (chainCells.length !== MONOMERS || !isValidPlacement(chainCells, turn)) return;
            soundManager.playClick();
            fxText(chainCells[0].y * BOARD_SIZE + chainCells[0].x, '鎖完成!', '#22c55e', 900);
            executeMove({ cells: chainCells.map(p => ({ ...p })), type: 'POLY', rot: 0 }, turn);
            chainCells = [];
            previewPos = null;
            updatePieceTrayUI();
        }

        function drawNextPiece() { return null; }

        // 「1マス戻す」: 鎖の末尾のモノマーを取り除く (右クリック/Rキー)
        function rotatePiece() {
            if (chainCells.length === 0) return;
            chainCells.pop();
            soundManager.playClick();
            refreshChainPreview();
            updatePieceTrayUI();
            render();
        }`],
    // ホバープレビューは鎖構築では不要
    [ONE, MOUSE_MOVE,
`        function handleMouseMove(e) {
            // ポリマー鎖はクリックで構築するためホバープレビューなし
        }`],
    // クリック処理: 鎖の構築と確定
    [ONE, CLICK_BODY,
`            if (!isMyTurn()) return;

            // ポリマー鎖の構築: クリックでモノマー追加、完成した鎖上のクリックで確定
            const { padding, cellSize } = getBoardMetrics();
            const rect = canvas.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            if (clientX === undefined || clientY === undefined) return;
            const gx = Math.round((clientX - rect.left - padding) / cellSize);
            const gy = Math.round((clientY - rect.top - padding) / cellSize);
            if (gx < 0 || gx >= BOARD_SIZE || gy < 0 || gy >= BOARD_SIZE) return;

            const onChain = chainCells.findIndex(p => p.x === gx && p.y === gy);
            if (onChain >= 0) {
                if (chainCells.length === MONOMERS && isValidPlacement(chainCells, turn)) {
                    soundManager.playClick();
                    fxText(chainCells[0].y * BOARD_SIZE + chainCells[0].x, '鎖完成!', '#22c55e', 900);
                    executeMove({ cells: chainCells.map(p => ({ ...p })), type: 'POLY', rot: 0 }, turn);
                    chainCells = [];
                    previewPos = null;
                    updatePieceTrayUI();
                } else {
                    // そのモノマーまで切り戻して伸ばし直せる
                    chainCells = chainCells.slice(0, onChain + 1);
                    refreshChainPreview();
                    updatePieceTrayUI();
                    render();
                }
            } else if (board[gy * BOARD_SIZE + gx] === 0) {
                if (chainCells.length < MONOMERS) {
                    const last = chainCells[chainCells.length - 1];
                    if (chainCells.length === 0 || Math.abs(last.x - gx) + Math.abs(last.y - gy) === 1) {
                        chainCells.push({ x: gx, y: gy });
                        fxGlow(gy * BOARD_SIZE + gx, 'rgba(34,197,94,0.9)', 400);
                    } else {
                        chainCells = [{ x: gx, y: gy }]; // 非隣接なら新しい鎖を開始
                        fxBurst(gy * BOARD_SIZE + gx, 'rgba(148,163,184,0.9)', 5, 0.9);
                    }
                } else {
                    chainCells = [{ x: gx, y: gy }]; // 完成済みなら新しい鎖を開始
                    fxBurst(gy * BOARD_SIZE + gx, 'rgba(148,163,184,0.9)', 5, 0.9);
                }
                refreshChainPreview();
                updatePieceTrayUI();
                render();
            }
        }`],
    // AI: ランダムウォークで合法な4連鎖を生成
    [ONE, AI_EVAL,
`        function evaluateBestAiMove() {
            // ランダムウォークで4連鎖を生成し、合法かつ高評価の手を探す
            let best = null;
            for (let attempt = 0; attempt < 400; attempt++) {
                const sx = Math.floor(Math.random() * BOARD_SIZE);
                const sy = Math.floor(Math.random() * BOARD_SIZE);
                if (board[sy * BOARD_SIZE + sx] !== 0) continue;
                const cells = [{ x: sx, y: sy }];
                let ok = true;
                while (cells.length < MONOMERS) {
                    const last = cells[cells.length - 1];
                    const cands = [[1, 0], [-1, 0], [0, 1], [0, -1]]
                        .map(([dx, dy]) => ({ x: last.x + dx, y: last.y + dy }))
                        .filter(p => p.x >= 0 && p.x < BOARD_SIZE && p.y >= 0 && p.y < BOARD_SIZE
                            && board[p.y * BOARD_SIZE + p.x] === 0
                            && !cells.some(c => c.x === p.x && c.y === p.y));
                    if (cands.length === 0) { ok = false; break; }
                    cells.push(cands[Math.floor(Math.random() * cands.length)]);
                }
                if (!ok || !isValidPlacement(cells, turn)) continue;
                const score = rateMove(cells, turn);
                if (!best || score > best.score) best = { cells, type: 'POLY', rot: 0, score };
            }
            return best;
        }`],
    // ボタン表記
    [ONE, `⟳ 回転`, `↩ 1マス戻す`],
    [ONE, `                    ホールド
                </button>`, `                    配置する
                </button>`],
    [ONE, `<span class="text-[10px] font-bold tracking-widest opacity-60">HOLD</span>`,
          `<span class="text-[10px] font-bold tracking-widest opacity-60">確定</span>`],
    [ONE, `<span id="currentPieceLabel" class="text-[10px] font-bold tracking-widest opacity-60">碁カン</span>`,
          `<span id="currentPieceLabel" class="text-[10px] font-bold tracking-widest opacity-60">モノマー鎖</span>`],
    [ONE, `<span id="trayModeLabel" class="text-[10px] font-bold tracking-widest opacity-60">ピース選択</span>`,
          `<span id="trayModeLabel" class="text-[10px] font-bold tracking-widest opacity-60">チェーン構築</span>`],
    // リセット時に鎖をクリア
    [ONE, `            previewPos = null;
            lastMove = null;`,
`            previewPos = null;
            chainCells = [];
            lastMove = null;`],
    [ONE, `            history = [];
            currentRot = 0;`,
`            history = [];
            currentRot = 0;
            chainCells = [];`],
    // 残置コードの安全化
    [ONE, REFRESH_PREVIEW,
`        function refreshPreview() { refreshChainPreview(); }`],
    [ONE, `                pieceMode = e.target.dataset.pmode;`,
`                pieceMode = 'free'; // ポリマー鎖は自由描画固定`],
    [ONE, PLACE_AT,
`        function getPlacementAt(u, v) {
            return null; // ポリマー鎖はクリック構築のため未使用
            const list = ORIENTATIONS[currentPieceType];
            const shape = list[currentRot % list.length];`],
    [ALL, '碁カン', 'ポリマー'],
    // 構築中の鎖を駆け巡る重合パルス (fxAmbients 宣言後に登録)
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 構築中の鎖を駆け巡る重合パルス
        fxAmbient((ctx2, now, pad, cs) => {
            if (!chainCells.length) return;
            ctx2.save();
            const head = (now / 350) % (chainCells.length + 1);
            chainCells.forEach((p, i) => {
                const d = Math.abs(i - head);
                if (d > 1) return;
                ctx2.globalAlpha = Math.max(0, 0.55 - d * 0.45);
                ctx2.fillStyle = '#22c55e';
                ctx2.beginPath();
                ctx2.arc(pad + p.x * cs, pad + p.y * cs, cs * (0.30 - d * 0.08), 0, Math.PI * 2);
                ctx2.fill();
            });
            ctx2.restore();
        });`],
],
};
