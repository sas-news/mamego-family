// gen_kit.js — 変則碁ジェネレータ共通基盤
// gen_variants.js / gen_wave2.js から require して使う。
// 変則碁バリアント一括生成スクリプト
// algo.html (碁盤+通常碁石の見た目のエンジン) をテンプレートに、
// 各ゲーム = 「通常囲碁 + 特殊ルール」として文字列置換で差分を適用する。
// 使い方: node gen_variants.js   (失敗した置換はログに出る)
const fs = require('fs');
const path = require('path');
const ALGO = fs.readFileSync(path.join(__dirname, 'algo.html'), 'utf8').replace(/\r\n/g, '\n');

let failures = 0;
function apply(src, spec, name) {
    let s = src;
    spec.forEach(([mode, oldS0, newS0]) => {
        // このファイル自体がCRLFで保存されても壊れないよう、パターン側もLF正規化する
        const oldS = oldS0.replace(/\r\n/g, '\n');
        const newS = newS0.replace(/\r\n/g, '\n');
        if (!s.includes(oldS)) {
            console.log(`  [${name}] MISSING: ${JSON.stringify(oldS.slice(0, 90))}`);
            failures++;
            return;
        }
        s = mode === 'all' ? s.split(oldS).join(newS) : s.replace(oldS, newS);
    });
    return s;
}
const ONE = 'one', ALL = 'all';
function out(name, html) {
    fs.writeFileSync(path.join(__dirname, name), html);
    console.log(`wrote ${name} (${html.length} bytes)`);
}

// ============================================================
// アンカー文字列 (algo.html 内の正確なテキスト)
// ============================================================
const MOLECULES_ALGO = `        const MOLECULES = {
            BUTANE:         { name: 'ブタン',            iupac: 'n-ブタン',             formula: 'C₄H₁₀', atoms: [[0,0],[1,0],[1,1],[2,1]] },
            ISOBUTANE:      { name: 'イソブタン',         iupac: '2-メチルプロパン',     formula: 'C₄H₁₀', atoms: [[1,0],[0,1],[1,1],[2,1]] },
            PENTANE:        { name: 'ペンタン',           iupac: 'n-ペンタン',           formula: 'C₅H₁₂', atoms: [[0,0],[1,0],[2,0],[3,0],[4,0]] },
            ISOPENTANE:     { name: 'イソペンタン',       iupac: '2-メチルブタン',       formula: 'C₅H₁₂', atoms: [[0,0],[1,0],[2,0],[3,0],[1,1]] },
            NEOPENTANE:     { name: 'ネオペンタン',       iupac: '2,2-ジメチルプロパン', formula: 'C₅H₁₂', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2]] },
            HEXANE:         { name: 'ヘキサン',           iupac: 'n-ヘキサン',           formula: 'C₆H₁₄', atoms: [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]] },
            NEOHEXANE:      { name: 'ネオヘキサン',       iupac: '2,2-ジメチルブタン',   formula: 'C₆H₁₄', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]] }
        };`;
const OCNT_ALGO = '// ブタン:2 / イソブタン:4 / ペンタン:2 / イソペンタン:4 / ネオペンタン:1 / ヘキサン:2 / ネオヘキサン:4 = 計19パターン';
const NBRS_GRID = `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            return neighbors;
        }`;
const VALID_BOUNDS = `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }`;
const INFO_ALGO = `            アルカン分子「碁カン」を配置し合う変則囲碁<br>
            PC: クリックで配置 / 回転=Rキー・右クリック・ホイール / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定 (回転・ホールドはボタン)`;
const TRAY_DIV = `        <div id="pieceTray" class="w-full flex items-center gap-3 p-3 rounded-xl border transition-colors">`;
const SUPPLY_SEC = `            <!-- 3. ピース配給モード -->
            <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-neutral-500">碁カン供給</label>
                <div class="grid grid-cols-2 gap-2">
                    <button data-pmode="free" class="btn-pmode py-2 rounded-lg border border-neutral-300 font-bold text-xs sm:text-sm hover:bg-neutral-100 transition-all">自由選択</button>
                    <button data-pmode="next" class="btn-pmode py-2 rounded-lg border border-neutral-300 font-bold text-xs sm:text-sm hover:bg-neutral-100 transition-all">ネクスト (全7種1巡)</button>
                </div>
            </div>`;
const CATALOG_ROW = `            <!-- 6. 碁カン図鑑 -->
            <div class="flex items-center justify-between pt-1">
                <span class="text-sm font-bold text-neutral-700">登場アルカン</span>
                <button id="btnOpenCatalog" class="px-3 py-1.5 text-xs font-bold rounded-full border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 transition-all">
                    碁カン図鑑を開く
                </button>
            </div>`;
const SIZE_BTNS = `                    <button data-size="13" class="btn-size py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">13路盤</button>
                    <button data-size="19" class="btn-size py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">19路盤</button>
                    <button data-size="25" class="btn-size py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">25路盤</button>`;
const STARS_ALGO = `        function getStarPoints(size) {
            if (size === 13) {
                return [{x:3,y:3}, {x:9,y:3}, {x:6,y:6}, {x:3,y:9}, {x:9,y:9}];
            } else if (size === 19) {
                return [
                    {x:3,y:3}, {x:9,y:3}, {x:15,y:3},
                    {x:3,y:9}, {x:9,y:9}, {x:15,y:9},
                    {x:3,y:15}, {x:9,y:15}, {x:15,y:15}
                ];
            } else if (size === 25) {
                return [
                    {x:4,y:4}, {x:12,y:4}, {x:20,y:4},
                    {x:4,y:12}, {x:12,y:12}, {x:20,y:12},
                    {x:4,y:20}, {x:12,y:20}, {x:20,y:20}
                ];
            }
            return [];
        }`;
const RCM_ALGO = `        const RULES_COMMON = [
            '黒 (先手) と白が交互に着手。自分の手番では盤上に碁カンを1個配置するか、パスを選ぶ。',
            '碁カン内で隣接する原子同士は結合しており、つながった石は1つの「連」として呼吸を共有する。',
            '連に隣接する空点は「呼吸点」。呼吸点が0になった連は取られ、相手のアゲハマになる。',
            '自殺手禁止: 着手の結果、自分の連の呼吸点が0になる場所には置けない (相手の連を取れる場合を除く)。',
            'コウ禁止: 相手の直前の着手前と同一の盤面を再現する手は打てない。',
            \`窒息領域: \${PIECE_SIZE}マス未満の連結した空領域にはどの碁カンも入らないため、呼吸点にも地にもならない。\`,
            '双方が連続でパスすると終局。地の中の死に石を確認し、地の数 + アゲハマ数 (+白はコミ6.5目) で勝敗を決める。',
        ];`;
const RV_ALGO = `        const RULES_VARIANT = [
            'このゲームで使う碁カンはアルカン分子7種 (炭素数4〜6)。形・大きさが異なる。',
            '供給モード: 「自由選択」は毎手好きな碁カンを選べる。「ネクスト」は全種1巡のランダム供給。',
            'ホールド: ネクストモード時、現在の碁カンを1回だけ取っておける (各手番1回まで)。',
        ];`;
const RC_ALGO = `        const RULES_CONTROLS = [
            '配置: 盤上をクリック/タップ。回転 = Rキー・右クリック・ホイール・「回転」ボタン。',
            'ホールド = Hキーまたは「ホールド」ボタン (ネクストモードのみ)。',
            'スマホ: 1タップ目=プレビュー表示、2タップ目=確定。',
        ];`;
const PIECES_PUSH = `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });`;
const CAPTURE_BLOCK = `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`;
const TURN_FLIP = `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`;
const FALLBACK_SKIP = `                    if (val === 0 || covered.has(idx)) continue;`;
const TOGGLE_GUARD = `            const color = board[startIdx];
            if (color === 0) return;`;
const BOARD_DECL = `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白`;
const RESET_BOARD = `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);`;
const RESET_HELD = `            heldPieces = { 1: null, 2: null };`;
const PASS_INC = `            prevBoard = null; // パスでコウ制限は解除
            consecutivePasses++;`;
const SNAP_PUSH = `                heldPieces: { ...heldPieces },
                holdUsed
            });`;
const SNAP_POP = `            holdUsed = !!snap.holdUsed;`;
const LOAD_HOLD = `            holdUsed = !!s.holdUsed;`;
const SAVE_TAIL = `                    heldPieces,
                    holdUsed,
                    gameMode,`;
const ONLINE_SEND = `                heldPieces,
                holdUsed,
                deadStones: [...deadStones],`;
const ONLINE_RECV = `            holdUsed = !!data.holdUsed;`;
const TURN_LINE = `            turnIndicator.textContent = turn === 1 ? '黒 (1P)' : '白 (2P)';`;
const UI_TAIL = `            btnUndo.disabled = !canUndo();
            updatePieceTrayUI();
            render();
        }`;
const NEXTBOX_HTML = `                <div id="nextBox" class="hidden items-center gap-2.5">
                    <canvas id="nextPieceCanvas" width="46" height="46"></canvas>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold tracking-widest">NEXT</span>
                        <span class="text-[10px] opacity-60 leading-tight">全7種1巡<br>ランダム</span>
                    </div>
                </div>`;
const GRID_RENDER = `            // 格子線
            ctx.strokeStyle = currentTheme.lineColor;
            ctx.lineWidth = Math.max(1, cellSize * 0.028);
            for (let i = 0; i < BOARD_SIZE; i++) {
                const pos = padding + i * cellSize;
                ctx.beginPath();
                ctx.moveTo(pos, padding);
                ctx.lineTo(pos, width - padding);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(padding, pos);
                ctx.lineTo(width - padding, pos);
                ctx.stroke();
            }

            // 外枠強調 (二重線で碁盤らしく)
            ctx.strokeStyle = currentTheme.lineColor;
            ctx.lineWidth = Math.max(1.6, cellSize * 0.055);
            ctx.strokeRect(padding, padding, width - padding * 2, width - padding * 2);
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.35;
            ctx.strokeRect(padding + 3, padding + 3, width - padding * 2 - 6, width - padding * 2 - 6);
            ctx.globalAlpha = 1;

            // 星 (天元・星の点)
            const starPoints = getStarPoints(BOARD_SIZE);
            ctx.fillStyle = currentTheme.starColor;
            const starR = Math.max(2.5, cellSize * 0.10);
            starPoints.forEach(pt => {
                const cx = padding + pt.x * cellSize;
                const cy = padding + pt.y * cellSize;
                ctx.beginPath();
                ctx.arc(cx, cy, starR, 0, Math.PI * 2);
                ctx.fill();
            });`;
const AI_EVAL = `        function evaluateBestAiMove() {
            const candidates = [];
            // 自由モードは全ピース、ネクストモードは現在ピースのみ
            const types = pieceMode === 'next' ? [currentPieceType] : PIECE_TYPES;

            types.forEach(type => {
                ORIENTATIONS[type].forEach((shape, rot) => {
                    const w = Math.max(...shape.map(c => c[0])) + 1;
                    const h = Math.max(...shape.map(c => c[1])) + 1;
                    for (let ty = 0; ty + h <= BOARD_SIZE; ty++) {
                        for (let tx = 0; tx + w <= BOARD_SIZE; tx++) {
                            const cells = shape.map(([dx, dy]) => ({ x: tx + dx, y: ty + dy }));
                            if (isValidPlacement(cells, turn)) {
                                const score = rateMove(cells, turn);
                                candidates.push({ cells, type, rot, score });
                            }
                        }
                    }
                });
            });

            if (candidates.length === 0) return null;

            // スコア降順ソート
            candidates.sort((a, b) => b.score - a.score);
            return candidates[0];
        }`;
const TRAY_UI_ALGO = `        function updatePieceTrayUI() {
            const list = ORIENTATIONS[currentPieceType];
            if (!list) return;
            currentRot = currentRot % list.length;
            drawMiniPiece(currentPieceCanvas, currentPieceType, currentRot);
            currentPieceLabel.textContent = \`\${MOLECULES[currentPieceType].name} \${MOLECULES[currentPieceType].formula}\`;

            if (pieceMode === 'free') {
                paletteBox.classList.remove('hidden');
                nextBox.classList.add('hidden');
                nextBox.classList.remove('flex');
                trayModeLabel.textContent = '碁カン選択 (自由モード)';
                PIECE_TYPES.forEach(t => {
                    const c = paletteCanvases[t];
                    if (c) drawMiniPiece(c, t, 0, turn);
                    const btn = c && c.parentElement;
                    if (btn) btn.style.outline = (t === currentPieceType) ? '2px solid currentColor' : 'none';
                });
            } else {
                paletteBox.classList.add('hidden');
                nextBox.classList.remove('hidden');
                nextBox.classList.add('flex');
                trayModeLabel.textContent = \`NEXT (全\${PIECE_TYPES.length}種1巡モード)\`;
                // NEXTピースは次の手番(相手)の色で描く
                if (pieceQueue[0]) drawMiniPiece(nextPieceCanvas, pieceQueue[0], 0, turn === 1 ? 2 : 1);
            }

            // ホールド欄はネクストモードのみ (自由選択では不要)
            holdBox.classList.toggle('hidden', pieceMode !== 'next');
            if (pieceMode === 'next') {
                const hc = holdPieceCanvas.getContext('2d');
                hc.clearRect(0, 0, holdPieceCanvas.width, holdPieceCanvas.height);
                if (heldPieces[turn]) drawMiniPiece(holdPieceCanvas, heldPieces[turn], 0, turn);
                holdPieceCanvas.style.opacity = (holdUsed && heldPieces[turn]) ? 0.35 : 1;
                btnHold.disabled = holdUsed || gameOver || gamePhase !== 'playing' || !isMyTurn();
            }
        }`;
const HOLD_ROTATE_FNS = `        // ホールド: 現在ピースを自分のホールド枠に保存して次を供給 (初回)
        // か保持ピースと交換 (2回目以降)。1手につき1回まで (着手するまで再ホールド不可)。
        function holdPiece() {
            if (pieceMode !== 'next' || holdUsed || gameOver
                || gamePhase !== 'playing' || !isMyTurn()) return;
            soundManager.playClick();
            if (heldPieces[turn] === null) {
                heldPieces[turn] = currentPieceType;
                currentPieceType = drawNextPiece();
            } else {
                [heldPieces[turn], currentPieceType] = [currentPieceType, heldPieces[turn]];
            }
            currentRot = 0;
            holdUsed = true;
            updatePieceTrayUI();
            refreshPreview();
            render();
            saveState();
        }

        function drawNextPiece() {
            if (pieceQueue.length === 0) pieceQueue = shuffledBag();
            return pieceQueue.shift();
        }

        function rotatePiece() {
            const list = ORIENTATIONS[currentPieceType];
            if (!list) return;
            currentRot = (currentRot + 1) % list.length;
            soundManager.playClick();
            updatePieceTrayUI();
            refreshPreview();
            render();
        }`;
const CLICK_BODY = `            if (!isMyTurn()) return;

            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            const isTouch = lastPointerType === 'touch';

            if (!isTouch) {
                // マウス: クリックで即配置
                const pl = getPlacementAt(anchor.u, anchor.v);
                if (isValidPlacement(pl.cells, turn)) {
                    executeMove({ cells: pl.cells, type: currentPieceType, rot: currentRot }, turn);
                    previewPos = null;
                }
                return;
            }

            // タッチ: 1回目のタップ=プレビュー、プレビュー上の2回目のタップ=確定
            if (previewPos && isTapOnPreview(e, previewPos)) {
                if (previewPos.valid) {
                    executeMove({ cells: previewPos.cells, type: previewPos.type, rot: previewPos.rot }, turn);
                    previewPos = null;
                    render();
                }
                // 置けない場所(赤)の場合はプレビューのまま維持
            } else {
                previewPos = computePreview(anchor.u, anchor.v);
                render();
            }
        }`;
const MOUSE_MOVE = `        function handleMouseMove(e) {
            if (lastPointerType === 'touch') return; // タッチ操作ではホバープレビューを出さない
            if (gameOver || gamePhase === 'dead_stone_selection' || !isMyTurn()) return;
            const anchor = getAnchorFromEvent(e);
            if (anchor) {
                previewPos = computePreview(anchor.u, anchor.v);
                render();
            }
        }`;
const PLACE_AT = `        function getPlacementAt(u, v) {
            const list = ORIENTATIONS[currentPieceType];
            const shape = list[currentRot % list.length];`;
const REFRESH_PREVIEW = `        function refreshPreview() {
            if (!previewPos) return;
            previewPos = computePreview(previewPos.u, previewPos.v);
        }`;
const RESET_SUPPLY = `            if (pieceMode === 'next') {
                pieceQueue = shuffledBag();
                currentPieceType = pieceQueue.shift();
            }`;
const LOAD_QUEUE = `            pieceQueue = Array.isArray(s.pieceQueue)
                ? s.pieceQueue.filter(t => PIECE_TYPES.includes(t)) : [];
            if (pieceMode === 'next' && pieceQueue.length === 0) pieceQueue = shuffledBag();`;
const SAVE_QUEUE = `                    pieceQueue,
                    heldPieces,`;
const SNAP_QUEUE = `                pieceQueue: [...pieceQueue],`;
const UNDO_QUEUE = `            if (snap.pieceQueue) pieceQueue = snap.pieceQueue;`;
const ONLINE_QUEUE_RECV = `            if (data.pieceQueue) pieceQueue = data.pieceQueue;`;
const ONLINE_QUEUE_SEND = `                pieceQueue,
                heldPieces,`;
const PALETTE_FOR = `                PIECE_TYPES.forEach(t => {
                    const c = paletteCanvases[t];
                    if (c) drawMiniPiece(c, t, 0, turn);
                    const btn = c && c.parentElement;
                    if (btn) btn.style.outline = (t === currentPieceType) ? '2px solid currentColor' : 'none';
                });`;
const PALETTE_CLICK = `                    if (pieceMode !== 'free') return;
                    currentPieceType = t;
                    currentRot = 0;`;
const SHUFFLE_FN = `        // 全7種1巡バッグ (テトリス方式) のシャッフル
        function shuffledBag() {
            const bag = [...PIECE_TYPES];
            for (let i = bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bag[i], bag[j]] = [bag[j], bag[i]];
            }
            return bag;
        }`;
const QUEUE_DECL = `        let pieceQueue = [];        // 'next'モード用の今後の供給列`;
const PMODE_DECL = `        let pieceMode = 'next'; // 'free' (自由選択) | 'next' (7種1巡ランダム)`;
const AI_TYPES = `            const types = pieceMode === 'next' ? [currentPieceType] : PIECE_TYPES;`;
const SUPPLY_BLOCK = `            // ネクストモードでは次のピースを供給
            if (pieceMode === 'next') {
                currentPieceType = drawNextPiece();
            }

            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`;

// ============================================================
// ルールブロック生成ヘルパー
// ============================================================
const rv = (lines) => '        const RULES_VARIANT = [\n'
    + lines.map(l => `            '${l}',`).join('\n') + '\n        ];';
const rc = (lines) => '        const RULES_CONTROLS = [\n'
    + lines.map(l => `            '${l}',`).join('\n') + '\n        ];';
const RULES_STONE_COMMON = `        const RULES_COMMON = [
            '黒 (先手) と白が交互に着手。自分の手番では空いている交点に碁石を1個置くか、パスを選ぶ。',
            '同じ色で隣接した石は「連」としてつながり、呼吸を共有する。',
            '連に隣接する空点は「呼吸点」。呼吸点が0になった連は取られ、相手のアゲハマになる。',
            '自殺手禁止: 着手の結果、自分の連の呼吸点が0になる場所には置けない (相手の連を取れる場合を除く)。',
            'コウ禁止: 相手の直前の着手前と同一の盤面を再現する手は打てない。',
            '双方が連続でパスすると終局。地の中の死に石を確認し、地の数 + アゲハマ数 (+白はコミ6.5目) で勝敗を決める。',
        ];`;
const RULES_STONE_CONTROLS = rc([
    '配置: 盤上をクリック/タップ。',
    'スマホ: 1タップ目=プレビュー表示、2タップ目=確定。',
]);
const STARS_GENERIC = `        function getStarPoints(size) {
            if (size === 9) {
                return [{x:2,y:2}, {x:6,y:2}, {x:4,y:4}, {x:2,y:6}, {x:6,y:6}];
            } else if (size === 13) {
                return [{x:3,y:3}, {x:9,y:3}, {x:6,y:6}, {x:3,y:9}, {x:9,y:9}];
            } else if (size === 19) {
                return [
                    {x:3,y:3}, {x:9,y:3}, {x:15,y:3},
                    {x:3,y:9}, {x:9,y:9}, {x:15,y:9},
                    {x:3,y:15}, {x:9,y:15}, {x:15,y:15}
                ];
            } else if (size === 25) {
                return [
                    {x:4,y:4}, {x:12,y:4}, {x:20,y:4},
                    {x:4,y:12}, {x:12,y:12}, {x:20,y:12},
                    {x:4,y:20}, {x:12,y:20}, {x:20,y:20}
                ];
            }
            return [];
        }`;
const SIZE_BTNS_91319 = `                    <button data-size="9" class="btn-size py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">9路盤</button>
                    <button data-size="13" class="btn-size py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">13路盤</button>
                    <button data-size="19" class="btn-size py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">19路盤</button>`;

// ============================================================
// 共通リブランド仕様: rb(en名, jp名, ルームprefix)
//   タイトル/H1/ルームID/保存キー/セクションコメント を一括差替
// ============================================================
const rb = (en, jp, prefix) => [
    [ONE, '<title>ALGO - アルカン碁</title>', `<title>${en} - ${jp}</title>`],
    [ONE, '>ALGO <span class="text-sm font-bold opacity-60">アルカン碁</span>',
          `>${en} <span class="text-sm font-bold opacity-60">${jp}</span>`],
    [ONE, `ROOM_ID_PREFIX = 'algo-'`, `ROOM_ID_PREFIX = '${prefix}-'`],
    [ONE, `STORAGE_KEY = 'algo-save-v1'`, `STORAGE_KEY = '${prefix}-save-v1'`],
    [ONE, '// 8. 囲碁 & ALGO ルール判定アルゴリズム', `// 8. 囲碁 & ${en} ルール判定アルゴリズム`],
];

// ============================================================
// STONE_SPEC: 「通常囲碁化」共通仕様
//   碁カン(分子) → 碁石(1マス)。窒息領域は自然に消滅 (PIECE_SIZE=1)。
//   トレイ・供給設定・図鑑は不要なので隠す。盤は 9/13/19 路。
//   ※ 各バリアントのルール/機構仕様の「後」に適用すること。
// ============================================================
const STONE_DEFS = `        // 通常の碁石: 1手につき空いている交点へ1石を置く標準的な囲碁。
        const MOLECULES = {
            STONE: { name: '碁石', iupac: '', formula: '', atoms: [[0,0]] }
        };`;
const STONE_SPEC = [
    [ONE, MOLECULES_ALGO, STONE_DEFS],
    [ONE, OCNT_ALGO, '// 碁石は1マス: 回転の区別なし (1パターン)'],
    [ONE, `let currentPieceType = 'ISOBUTANE';`, `let currentPieceType = 'STONE';`],
    [ONE, `? s.currentPieceType : 'BUTANE'`, `? s.currentPieceType : 'STONE'`],
    // 盤サイズ 13/19/25 → 9/13/19 (標準的な囲碁サイズ)
    [ONE, SIZE_BTNS, SIZE_BTNS_91319],
    [ONE, `![13, 19, 25].includes(s.boardSize)`, `![9, 13, 19].includes(s.boardSize)`],
    [ONE, STARS_ALGO, STARS_GENERIC],
    // トレイ非表示 (石は1種のみ)
    [ONE, TRAY_DIV, `        <div id="pieceTray" class="hidden w-full items-center gap-3 p-3 rounded-xl border transition-colors">`],
    // 供給モード設定を除去 (自由/ネクストの区別が無意味)
    [ONE, SUPPLY_SEC, ''],
    // 碁カン図鑑の行を除去 + リスナーをガード (要素なしでも起動できるように)
    [ONE, CATALOG_ROW, ''],
    [ONE, `        btnOpenCatalog.addEventListener('click', () => {`,
          `        if (btnOpenCatalog) btnOpenCatalog.addEventListener('click', () => {`],
    [ONE, `        btnCloseCatalog.addEventListener('click', () => {`,
          `        if (btnCloseCatalog) btnCloseCatalog.addEventListener('click', () => {`],
    // ルール文 → 通常碁版
    [ONE, RCM_ALGO, RULES_STONE_COMMON],
    [ONE, RC_ALGO, RULES_STONE_CONTROLS],
    // 残った「碁カン」表記を全て碁石へ
    [ALL, '碁カン', '碁石'],
];

// ============================================================
// PER_PLAYER_SPEC: プレイヤー別ピースセット機構 (ASYMGO/DRAFTGO共通)
// ============================================================
const PER_PLAYER_SPEC = [
    [ONE, SHUFFLE_FN,
`        // ピース列シャッフル & プレイヤー別バッグ
        function shuffleTypes(types) {
            const bag = [...types];
            for (let i = bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bag[i], bag[j]] = [bag[j], bag[i]];
            }
            return bag;
        }
        function shuffledBag(player) { return shuffleTypes(PLAYER_PIECES[player]); }
        function validTypes(arr) { return Array.isArray(arr) ? arr.filter(t => PIECE_TYPES.includes(t)) : []; }`],
    [ONE, QUEUE_DECL,
`        let pieceQueues = { 1: [], 2: [] }; // プレイヤー別の供給列
        let PLAYER_PIECES = { 1: [...PIECE_TYPES], 2: [...PIECE_TYPES] }; // プレイヤー別使用ピース`],
    [ONE, SAVE_QUEUE,
`                    pieceQueues,
                    heldPieces,`],
    [ONE, LOAD_QUEUE,
`            pieceQueues = (s.pieceQueues && typeof s.pieceQueues === 'object')
                ? { 1: validTypes(s.pieceQueues[1]), 2: validTypes(s.pieceQueues[2]) }
                : { 1: [], 2: [] };
            if (pieceMode === 'next' && pieceQueues[turn].length === 0) pieceQueues[turn] = shuffledBag(turn);`],
    [ONE, PALETTE_FOR,
`                PIECE_TYPES.forEach(t => {
                    const c = paletteCanvases[t];
                    const btn = c && c.parentElement;
                    if (btn) btn.style.display = PLAYER_PIECES[turn].includes(t) ? '' : 'none';
                    if (c) drawMiniPiece(c, t, 0, turn);
                    if (btn) btn.style.outline = (t === currentPieceType) ? '2px solid currentColor' : 'none';
                });`],
    [ONE, PALETTE_CLICK,
`                    if (pieceMode !== 'free') return;
                    if (!PLAYER_PIECES[turn].includes(t)) return;
                    currentPieceType = t;
                    currentRot = 0;`],
    [ONE, `                trayModeLabel.textContent = \`NEXT (全\${PIECE_TYPES.length}種1巡モード)\`;
                // NEXTピースは次の手番(相手)の色で描く
                if (pieceQueue[0]) drawMiniPiece(nextPieceCanvas, pieceQueue[0], 0, turn === 1 ? 2 : 1);`,
`                trayModeLabel.textContent = 'NEXT (自軍バッグから供給)';
                // NEXTピースは次の手番(相手)のバッグ先頭を相手色で描く
                const nq = pieceQueues[turn === 1 ? 2 : 1];
                if (nq && nq[0]) drawMiniPiece(nextPieceCanvas, nq[0], 0, turn === 1 ? 2 : 1);`],
    [ONE, `        function drawNextPiece() {
            if (pieceQueue.length === 0) pieceQueue = shuffledBag();
            return pieceQueue.shift();
        }`,
`        function drawNextPiece() {
            if (pieceQueues[turn].length === 0) pieceQueues[turn] = shuffledBag(turn);
            return pieceQueues[turn].shift();
        }`],
    // 手番交代してから次プレイヤーのバッグから供給
    [ONE, SUPPLY_BLOCK,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;

            // ネクストモード: 次の手番プレイヤーのバッグから供給
            if (pieceMode === 'next') {
                currentPieceType = drawNextPiece();
            }`],
    [ONE, `                currentPieceType,
                pieceQueue: [...pieceQueue],`,
`                currentPieceType,
                pieceQueues: { 1: [...pieceQueues[1]], 2: [...pieceQueues[2]] },`],
    [ONE, UNDO_QUEUE,
`            if (snap.pieceQueues) pieceQueues = { 1: [...snap.pieceQueues[1]], 2: [...snap.pieceQueues[2]] };`],
    [ONE, ONLINE_QUEUE_RECV,
`            if (data.pieceQueues) pieceQueues = data.pieceQueues;`],
    [ONE, ONLINE_QUEUE_SEND,
`                pieceQueues,
                heldPieces,`],
    [ONE, AI_TYPES,
`            const types = pieceMode === 'next' ? [currentPieceType] : PLAYER_PIECES[turn];`],
    [ONE, RESET_SUPPLY,
`            if (pieceMode === 'next') {
                pieceQueues = { 1: shuffledBag(1), 2: shuffledBag(2) };
                currentPieceType = drawNextPiece();
            }`],
];

// 即勝利ヘルパー (KINGGO/MAXGO用): ルール勝ちで即終局
const WIN_BY_RULE_FN = `
        // ルール勝ち: 地集計を待たず即終局
        function winByRule(player, reason, details) {
            gameOver = true;
            const name = player === 1 ? '黒' : '白';
            gameResultData = { title: \`\${name}の\${reason}\`, details };
            updateUI();
            soundManager.playWin();
            showResultModal();
            if (gameMode === 'online' && onlineRoomId) syncOnlineState();
            saveState();
        }
`;

// ============================================================
// 盤面装飾の共通パーツ
// ============================================================

// 壁セル (board===3) の「彫り込み」描画。
// 格子ごと暗い面で覆い、有効領域との境界に盤の縁線を引くことで、
// 「ブロックを置いた」ではなく「盤が削れている/くり抜かれている」見た目にする。
// fillExpr で質感を差し替えられる (既定=盤色を暗くした彫り込み木目)。
const voidDraw = (fillExpr) => `            const covered = new Set(); // ピース描画でカバー済みのマス

            // 壁セル: 格子ごと暗い面で覆い、境界は盤の縁線で締める
            {
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                ctx.save();
                ctx.fillStyle = ${fillExpr};
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                }
                ctx.strokeStyle = currentTheme.lineColor;
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    if (x > 0 && isV(x - 1, y)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx - hh, cy + hh); }
                    if (x < BOARD_SIZE - 1 && isV(x + 1, y)) { ctx.moveTo(cx + hh, cy - hh); ctx.lineTo(cx + hh, cy + hh); }
                    if (y > 0 && isV(x, y - 1)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx + hh, cy - hh); }
                    if (y < BOARD_SIZE - 1 && isV(x, y + 1)) { ctx.moveTo(cx - hh, cy + hh); ctx.lineTo(cx + hh, cy + hh); }
                }
                ctx.stroke();
                ctx.restore();
            }`;

// 壁マス機構の共通置換 (フォールバック除外/死に石選択ガード。描画は別途)
const WALL_GUARD_SPEC = [
    [ONE, FALLBACK_SKIP,
`                    if (val !== 1 && val !== 2) continue; // 空点・壁は石として描かない`],
    [ONE, TOGGLE_GUARD,
`            const color = board[startIdx];
            if (color === 0 || color === 3) return;`],
];
const WALL_DRAW = voidDraw(`shiftColor(currentTheme.boardBg, -0.48)`);
const WALL_SPEC = [
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`, WALL_DRAW],
    ...WALL_GUARD_SPEC,
];

// 円盤碁用: 正方形の外枠を消し、円外を暗く覆って滑らかな円縁を引く
const CIRCLE_FRAME_NONE = '            // 円盤: 外枠は正方形ではなく円縁で描く';
const CIRCLE_DRAW = `            const covered = new Set(); // ピース描画でカバー済みのマス

            // 円形盤: 円の外側を暗い面で覆い (格子線・枠の残骸ごと消す)、滑らかな円縁を引く
            {
                const cr = (BOARD_SIZE - 1) / 2;
                const bcx = padding + cr * cellSize, bcy = padding + cr * cellSize;
                const rr = (cr + 0.55) * cellSize;
                const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                ctx.save();
                ctx.beginPath();
                ctx.rect(-cellSize, -cellSize, w + cellSize * 2, w + cellSize * 2);
                ctx.arc(bcx, bcy, rr, 0, Math.PI * 2, true);
                ctx.fillStyle = shiftColor(currentTheme.boardBg, -0.48);
                ctx.fill();
                // 円縁 (外枠と同じ二重線の質感)
                ctx.beginPath();
                ctx.arc(bcx, bcy, rr, 0, Math.PI * 2);
                ctx.strokeStyle = currentTheme.lineColor;
                ctx.lineWidth = Math.max(1.6, cellSize * 0.055);
                ctx.stroke();
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.35;
                ctx.beginPath();
                ctx.arc(bcx, bcy, rr - 3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`;

// 着手可能点を薄いドットで示す (render() 内、ラスト着手ハイライトの直前に挿入)
const LEGAL_DOTS = `            // 着手可能な点を薄いドットで表示
            if (!gameOver && gamePhase === 'playing' && isMyTurn()) {
                const legalKey = history.length + ':' + turn;
                if (render.__legalKey !== legalKey) {
                    render.__legalKey = legalKey;
                    render.__legalDots = [];
                    for (let dy = 0; dy < BOARD_SIZE; dy++) for (let dx = 0; dx < BOARD_SIZE; dx++) {
                        if (board[dy * BOARD_SIZE + dx] !== 0) continue;
                        if (isValidPlacement([{ x: dx, y: dy }], turn)) render.__legalDots.push([dx, dy]);
                    }
                }
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.40);
                const dr = Math.max(2, cellSize * 0.09);
                for (const [dx, dy] of render.__legalDots) {
                    ctx.beginPath();
                    ctx.arc(padding + dx * cellSize, padding + dy * cellSize, dr, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            // 直前に配置したピースのハイライト(緑系)`;
const LEGAL_DOTS_SPEC = [
    [ONE, `            // 直前に配置したピースのハイライト(緑系)`, LEGAL_DOTS],
];

// ============================================================
// MOVE_CAP_SPEC: 打ち切り手数による自動終局 (viability 安全装置)
//   変則ルールで石が動き続け盤面が埋まらず、連続パスに至らない
//   対局でも、交点数の1.4倍の手数を超えた時点で死に石選択へ移行し
//   必ず終局できるようにする。
//   spec配列の任意位置に ...K.MOVE_CAP_SPEC を挿入して使う。
//   ※ executeMove 自体を置換するバリアントは同じチェックを自前で
//     組み込むこと (このアンカーは既に消費されているため)。
// ============================================================
const MOVE_CAP_SPEC = [
    [ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 新規対局 (履歴空) で打ち切りを再武装
            if (moveCapFired && history.length === 0) moveCapFired = false;
            // 打ち切り手数: 交点数の1.4倍を超える長期戦は死に石選択へ移行して自動終局
            // (1局につき1回のみ発火。死に石選択を取り消して続行する場合は再発火しない)
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4)) {
                moveCapFired = true;
                startDeadStoneSelectionPhase();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }`],
];

// 周期イベントまでの残り手数をステータスカードのチップに表示する
// chipExpr: updateUI 内で評価される文字列式 (gameOver 時は空)
const EVENT_CHIP_SPEC = (chipExpr) => [
    [ONE, `                    <span id="turnIndicator" class="font-bold underline decoration-2 underline-offset-4">黒 (1P)</span>`,
`                    <span id="turnIndicator" class="font-bold underline decoration-2 underline-offset-4">黒 (1P)</span>
                    <span id="eventChip" class="text-[11px] px-2 py-0.5 rounded-full border border-current/25 opacity-80"></span>`],
    [ONE, `        const gameModeBadge = document.getElementById('gameModeBadge');`,
`        const gameModeBadge = document.getElementById('gameModeBadge');
        const eventChip = document.getElementById('eventChip');`],
    [ONE, `            btnUndo.disabled = !canUndo();`,
`            if (eventChip) {
                const et = gameOver ? '' : (${chipExpr});
                eventChip.textContent = et;
                eventChip.style.display = et ? '' : 'none';
            }
            btnUndo.disabled = !canUndo();`],
];

// 盤の端同士が繋がっていることを示す枠外シェブロンマーカー。
// calls: 'chev(中心x, 中心y, 外側dx, 外側dy)' を呼ぶ式 (x,y は padding/cellSize/width で計算)
const wrapMarks = (calls) => `            // 端が対側に繋がる印: 枠外へ向く二重シェブロン
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.6);
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                const chev = (cx, cy, dx, dy) => {
                    for (let k = 0; k < 2; k++) {
                        const T = cellSize * (0.30 - 0.10 * k), B = cellSize * 0.11, W = cellSize * 0.10;
                        ctx.beginPath();
                        ctx.moveTo(cx + dx * (T - B) - dy * W, cy + dy * (T - B) + dx * W);
                        ctx.lineTo(cx + dx * T, cy + dy * T);
                        ctx.lineTo(cx + dx * (T - B) + dy * W, cy + dy * (T - B) - dx * W);
                        ctx.stroke();
                    }
                };
                const midC = padding + (BOARD_SIZE - 1) / 2 * cellSize;
                ${calls}
                ctx.restore();
            }

            // 星 (天元・星の点)`;
const WRAP_MARKS_SPEC = (calls) => [
    [ONE, `            // 星 (天元・星の点)`, wrapMarks(calls)],
];

// 石の上に特殊マークを重ね描きする (drawBoardElements 末尾に drawStoneMarks を追加)
// body: drawStoneMarks(padding, cellSize) の本体。board/history 等の盤面状態を参照可
const STONE_MARKS_SPEC = (body) => [
    [ONE, `                    if (isDead) drawDeadMarker(cx, cy, r);
                }
            }
        }

        let fxPrevMove = null;
        function drawLastMove(padding, cellSize) {`,
`                    if (isDead) drawDeadMarker(cx, cy, r);
                }
            }

            // 特殊ルールの石マーク
            drawStoneMarks(padding, cellSize);
        }

        function drawStoneMarks(padding, cellSize) {
${body}
        }

        let fxPrevMove = null;
        function drawLastMove(padding, cellSize) {`],
];

// render() 内に装飾コードを挿入する小ヘルパ
// CUE_STARS: 星描画の直前 (格子・外枠の上に乗る)。CUE_GRID: 格子線の直前 (地色・帯の表現)
const CUE_STARS = (code) => [ONE, `            // 星 (天元・星の点)`, `${code}\n\n            // 星 (天元・星の点)`];
const CUE_GRID = (code) => [ONE, `            // 格子線`, `${code}\n\n            // 格子線`];


// ============================================================
// FXテクスチャ/常時演出ヘルパー
// ============================================================
// texDraw(paintBody): 壁セル(3) を「そのルール専用の質感」で塗る描画ブロックを生成。
//   置換対象は drawBoardElements 冒頭の covered アンカー行。
//   paintBody 内で使える変数: i, x, y, cx, cy (セル中心), cellSize, hh (=cellSize/2),
//   now (fxNow), ctx, board, BOARD_SIZE, padding, currentTheme。
//   仕上げに有効領域との境界を盤の縁線で締める (voidDraw と同じ)。
const COVERED_ANCHOR = `            const covered = new Set(); // ピース描画でカバー済みのマス`;
const OBSTACLE_ANCHOR = `        // 障害物 (3:壁 4:幽霊など) のデフォルト描画 — obstaclePainter があればそちら優先`;
const FX_BOOT = `        let obstaclePainter = null;`;

const texDraw = (paintBody) => `${COVERED_ANCHOR}

            // 専用テクスチャ: 壁セルをルールに合った質感で塗る
            {
                const now = fxNow();
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = y * BOARD_SIZE + x;
                    if (!isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
${paintBody}
                }
                // 有効領域との境界を盤の縁線で締める
                ctx.strokeStyle = currentTheme.lineColor;
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    if (x > 0 && isV(x - 1, y)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx - hh, cy + hh); }
                    if (x < BOARD_SIZE - 1 && isV(x + 1, y)) { ctx.moveTo(cx + hh, cy - hh); ctx.lineTo(cx + hh, cy + hh); }
                    if (y > 0 && isV(x, y - 1)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx + hh, cy - hh); }
                    if (y < BOARD_SIZE - 1 && isV(x, y + 1)) { ctx.moveTo(cx - hh, cy + hh); ctx.lineTo(cx + hh, cy + hh); }
                }
                ctx.stroke();
                ctx.restore();
            }`;

// 水 (堀・池・海・潮汐): 深い青のグラデ + 位相のずれた波紋弧 (fxAmbient で揺らぐ)
const PAINT_WATER = (c0, c1) => `                    // 水面
                    const g = ctx.createRadialGradient(cx, cy, cellSize * 0.1, cx, cy, cellSize * 0.8);
                    g.addColorStop(0, '${c0}'); g.addColorStop(1, '${c1}');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const ph = Math.sin(now / 560 + x * 0.9 - y * 0.7);
                    ctx.strokeStyle = 'rgba(150,215,255,' + (0.20 + ph * 0.14) + ')';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx + Math.sin(now / 900 + i) * cellSize * 0.05, cy + Math.cos(now / 900 + i * 1.7) * cellSize * 0.05,
                        cellSize * (0.22 + ph * 0.05), Math.PI * 0.1, Math.PI * 0.9);
                    ctx.stroke();`;

// 岩/瓦礫: 斜めグラデの石面 + 決定的な破片ハイライト + 目地
const PAINT_ROCK = (c0, c1) => `                    // 岩面
                    const g = ctx.createLinearGradient(cx - hh, cy - hh, cx + hh, cy + hh);
                    g.addColorStop(0, '${c0}'); g.addColorStop(1, '${c1}');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const hs1 = Math.sin(i * 12.9898) * 43758.5453; const h1 = hs1 - Math.floor(hs1);
                    const hs2 = Math.sin(i * 78.233) * 12578.1459; const h2 = hs2 - Math.floor(hs2);
                    ctx.fillStyle = 'rgba(255,255,255,0.10)';
                    ctx.fillRect(cx - hh + h1 * cellSize * 0.55, cy - hh + h2 * cellSize * 0.55, cellSize * 0.28, cellSize * 0.16);
                    ctx.fillStyle = 'rgba(0,0,0,0.28)';
                    ctx.fillRect(cx - hh + h2 * cellSize * 0.55, cy - hh + h1 * cellSize * 0.55, cellSize * 0.20, cellSize * 0.12);
                    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(cx - hh, cy - hh, cellSize, cellSize);`;

// 城壁レンガ: ずらし組の目地 + 天面の光
const PAINT_BRICK = (c0, c1) => `                    // 煉瓦
                    const g = ctx.createLinearGradient(cx, cy - hh, cx, cy + hh);
                    g.addColorStop(0, '${c0}'); g.addColorStop(1, '${c1}');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(20,10,8,0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx - hh, cy); ctx.lineTo(cx + hh, cy);
                    const off = (y % 2 === 0) ? 0 : cellSize * 0.25;
                    ctx.moveTo(cx - cellSize * 0.25 + off, cy - hh); ctx.lineTo(cx - cellSize * 0.25 + off, cy);
                    ctx.moveTo(cx + cellSize * 0.25 + off, cy); ctx.lineTo(cx + cellSize * 0.25 + off, cy + hh);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(255,235,200,0.08)';
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize * 0.2);`;

// 深淵/裂け目: ほぼ黒 + 内側の薄い縁光
const PAINT_RIFT = (glow) => `                    // 深淵
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.72);
                    g.addColorStop(0, '#05060a'); g.addColorStop(1, '#141a26');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    ctx.strokeStyle = '${glow}';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(cx - hh + cellSize * 0.08, cy - hh + cellSize * 0.08, cellSize * 0.84, cellSize * 0.84);`;

// 額縁: 木枠 + 有効領域に接する辺だけ金の内フチ
const PAINT_FRAME = `                    // 額縁の木枠
                    const g = ctx.createLinearGradient(cx - hh, cy - hh, cx + hh, cy + hh);
                    g.addColorStop(0, '#5a3d1e'); g.addColorStop(1, '#33200f');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(28,16,6,0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.03);
                    ctx.beginPath();
                    ctx.moveTo(cx - hh, cy - cellSize * 0.22); ctx.lineTo(cx + hh, cy - cellSize * 0.22 + Math.sin(i * 1.7) * cellSize * 0.06);
                    ctx.moveTo(cx - hh, cy + cellSize * 0.24); ctx.lineTo(cx + hh, cy + cellSize * 0.24 + Math.cos(i * 2.3) * cellSize * 0.06);
                    ctx.stroke();
                    {
                        const adj = (dx, dy) => {
                            const nx = x + dx, ny = y + dy;
                            return nx >= 0 && ny >= 0 && nx < BOARD_SIZE && ny < BOARD_SIZE && board[ny * BOARD_SIZE + nx] !== 3;
                        };
                        ctx.strokeStyle = 'rgba(214,178,70,0.9)';
                        ctx.lineWidth = Math.max(1.4, cellSize * 0.07);
                        ctx.beginPath();
                        if (adj(-1, 0)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx - hh, cy + hh); }
                        if (adj(1, 0)) { ctx.moveTo(cx + hh, cy - hh); ctx.lineTo(cx + hh, cy + hh); }
                        if (adj(0, -1)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx + hh, cy - hh); }
                        if (adj(0, 1)) { ctx.moveTo(cx - hh, cy + hh); ctx.lineTo(cx + hh, cy + hh); }
                        ctx.stroke();
                    }`;

// 墓標: 墓地の地面 + 丸みのある碑 + 刻字
const PAINT_TOMB = `                    // 墓地の地面
                    ctx.fillStyle = 'rgba(62,64,70,0.5)';
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const tg = ctx.createLinearGradient(cx, cy - hh, cx, cy + hh);
                    tg.addColorStop(0, '#b9bdc5'); tg.addColorStop(1, '#82878f');
                    ctx.fillStyle = tg;
                    const tw = cellSize * 0.62, tt = cy - cellSize * 0.30, tb = cy + cellSize * 0.34;
                    ctx.beginPath();
                    ctx.moveTo(cx - tw / 2, tb);
                    ctx.lineTo(cx - tw / 2, tt + tw * 0.28);
                    ctx.quadraticCurveTo(cx - tw / 2, tt - cellSize * 0.10, cx, tt - cellSize * 0.10);
                    ctx.quadraticCurveTo(cx + tw / 2, tt - cellSize * 0.10, cx + tw / 2, tt + tw * 0.28);
                    ctx.lineTo(cx + tw / 2, tb);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(35,38,44,0.65)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(cx - tw * 0.2, cy + cellSize * 0.02); ctx.lineTo(cx + tw * 0.2, cy + cellSize * 0.02);
                    ctx.moveTo(cx - tw * 0.14, cy + cellSize * 0.13); ctx.lineTo(cx + tw * 0.14, cy + cellSize * 0.13);
                    ctx.stroke();`;

// 鋼板 (融合ブロック): 金属面 + 四隅の鋲
const PAINT_STEEL = `                    // 鋼板
                    const g = ctx.createLinearGradient(cx - hh, cy - hh, cx + hh, cy + hh);
                    g.addColorStop(0, '#808894'); g.addColorStop(1, '#484e58');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(28,30,36,0.8)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(cx - hh + cellSize * 0.04, cy - hh + cellSize * 0.04, cellSize * 0.92, cellSize * 0.92);
                    ctx.fillStyle = '#33383f';
                    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
                        ctx.beginPath();
                        ctx.arc(cx + sx * cellSize * 0.3, cy + sy * cellSize * 0.3, cellSize * 0.06, 0, Math.PI * 2);
                        ctx.fill();
                    });`;

// ゾンビ (徘徊する壁): 腐ったオリーブ肌 + 瞬きする赤い目 + 腐食斑
const PAINT_ZOMBIE = `                    // 腐乱したゾンビ体
                    const g = ctx.createRadialGradient(cx, cy, cellSize * 0.1, cx, cy, cellSize * 0.75);
                    g.addColorStop(0, '#5e6e44'); g.addColorStop(1, '#39441f');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const hzs = Math.sin(i * 12.9898) * 43758.5453; const hz = hzs - Math.floor(hzs);
                    ctx.fillStyle = 'rgba(22,28,12,0.5)';
                    ctx.beginPath();
                    ctx.arc(cx - hh + hz * cellSize, cy + cellSize * 0.24, cellSize * 0.09, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = Math.sin(now / 900 + i * 1.7) > -0.82 ? 'rgba(215,70,55,0.85)' : 'rgba(60,28,24,0.8)';
                    ctx.beginPath();
                    ctx.arc(cx - cellSize * 0.14, cy - cellSize * 0.06, cellSize * 0.055, 0, Math.PI * 2);
                    ctx.arc(cx + cellSize * 0.14, cy - cellSize * 0.06, cellSize * 0.055, 0, Math.PI * 2);
                    ctx.fill();`;

// 洞窟岩: 暗い岩肌 + 結晶の瞬き
const PAINT_CAVE = `                    // 洞窟の岩肌
                    const g = ctx.createLinearGradient(cx - hh, cy - hh, cx + hh, cy + hh);
                    g.addColorStop(0, '#4a4238'); g.addColorStop(1, '#241f18');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(cx - hh, cy - hh, cellSize, cellSize);
                    const twk = Math.sin(now / 520 + i * 2.6);
                    if (twk > 0.55) {
                        const hcs = Math.sin(i * 12.9898) * 43758.5453; const hc1 = hcs - Math.floor(hcs);
                        const hcs2 = Math.sin(i * 78.233) * 12578.1459; const hc2 = hcs2 - Math.floor(hcs2);
                        ctx.fillStyle = 'rgba(140,220,255,' + ((twk - 0.55) * 1.3) + ')';
                        ctx.beginPath();
                        ctx.arc(cx - hh + hc1 * cellSize, cy - hh + hc2 * cellSize, cellSize * 0.06, 0, Math.PI * 2);
                        ctx.fill();
                    }`;

// 苔むした迷路壁: 緑がかった石 + 苔の斑点
const PAINT_MOSS = `                    // 苔むした石壁
                    const g = ctx.createLinearGradient(cx - hh, cy - hh, cx + hh, cy + hh);
                    g.addColorStop(0, '#414d36'); g.addColorStop(1, '#232b1d');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const hms = Math.sin(i * 12.9898) * 43758.5453; const hm1 = hms - Math.floor(hms);
                    const hms2 = Math.sin(i * 78.233) * 12578.1459; const hm2 = hms2 - Math.floor(hms2);
                    ctx.fillStyle = 'rgba(122,166,88,0.28)';
                    ctx.beginPath();
                    ctx.arc(cx - hh + hm1 * cellSize, cy - hh + hm2 * cellSize, cellSize * 0.10, 0, Math.PI * 2);
                    ctx.arc(cx - hh + hm2 * cellSize, cy - hh + hm1 * cellSize, cellSize * 0.06, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(8,12,6,0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(cx - hh, cy - hh, cellSize, cellSize);`;

// 隕石 (石雨): 玄武岩 + クレーター縁
const PAINT_METEOR = `                    // 落下してきた玄武岩
                    const g = ctx.createRadialGradient(cx - cellSize * 0.12, cy - cellSize * 0.12, cellSize * 0.05, cx, cy, cellSize * 0.72);
                    g.addColorStop(0, '#4d453f'); g.addColorStop(1, '#1b1614');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.strokeStyle = 'rgba(255,200,120,0.28)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.30, Math.PI * 1.1, Math.PI * 1.6);
                    ctx.stroke();`;

// 底なしの穴 (穴あき碁): 円い穴とリム (枡一杯には塗らない)
const PAINT_PIT = `                    // 丸い落とし穴
                    const g = ctx.createRadialGradient(cx, cy, cellSize * 0.05, cx, cy, cellSize * 0.42);
                    g.addColorStop(0, '#04050a'); g.addColorStop(0.72, '#131822'); g.addColorStop(1, 'rgba(19,24,34,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(130,95,55,0.75)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.stroke();`;

// 削り取られた崖面 (盤外の切り欠き)
const PAINT_CLIFF = `                    // 削り取られた盤外
                    const g = ctx.createLinearGradient(cx, cy - hh, cx, cy + hh);
                    g.addColorStop(0, '#4b5058'); g.addColorStop(1, '#24272d');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const hcl = Math.sin(i * 12.9898) * 43758.5453; const hc = hcl - Math.floor(hcl);
                    ctx.strokeStyle = 'rgba(12,13,17,0.5)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.moveTo(cx - hh, cy - hh + hc * cellSize);
                    ctx.lineTo(cx + hh, cy - hh + ((hc + 0.3) % 1) * cellSize);
                    ctx.stroke();`;

// ============================================================
// fxAmbient 常時オーバーレイ snippets
//   spec で [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_*] と書く。
//   fxAmbient は render ループを起動し続けるのでアニメ壁とも相性が良い。
// ============================================================

// 水面の揺らぎハイライト (壁=水 の盤)
const AMBIENT_WATER = `
        // 水面の揺らぎ: 壁セル上を波のきらめきが流れる
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 3) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const ph = Math.sin(now / 700 + x * 1.3 + y * 0.9);
                if (ph > 0.78) {
                    ctx2.globalAlpha = (ph - 0.78) * 1.5;
                    ctx2.strokeStyle = '#bfe8ff';
                    ctx2.lineWidth = Math.max(1, cs * 0.05);
                    ctx2.beginPath();
                    ctx2.arc(pad + x * cs, pad + y * cs, cs * 0.20, 0, Math.PI * 2);
                    ctx2.stroke();
                }
            }
            ctx2.restore();
        });`;

// 漂う靄 (幽霊・ゾンビなど不気味系): 半透明の帯がゆっくり盤面を横切る
const AMBIENT_MIST = (tint) => `
        // 漂う靄: 大きな半透明の帯がゆっくり盤面を横切る
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let k = 0; k < 3; k++) {
                const t = (now / 11000 + k / 3) % 1;
                const mx = pad + (t * (BOARD_SIZE + 5) - 2.5) * cs;
                const my = pad + (BOARD_SIZE - 1) * cs * (0.2 + 0.3 * k) + Math.sin(now / 2600 + k * 2) * cs * 0.5;
                const g = ctx2.createRadialGradient(mx, my, 0, mx, my, cs * 2.8);
                g.addColorStop(0, 'rgba(${tint},0.10)');
                g.addColorStop(1, 'rgba(${tint},0)');
                ctx2.fillStyle = g;
                ctx2.beginPath();
                ctx2.arc(mx, my, cs * 2.8, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`;

// ============================================================
// exports
// ============================================================
module.exports = {
    ALGO,
    apply,
    ONE,
    out,
    MOLECULES_ALGO,
    OCNT_ALGO,
    NBRS_GRID,
    VALID_BOUNDS,
    INFO_ALGO,
    TRAY_DIV,
    SUPPLY_SEC,
    CATALOG_ROW,
    SIZE_BTNS,
    STARS_ALGO,
    RCM_ALGO,
    RV_ALGO,
    RC_ALGO,
    PIECES_PUSH,
    CAPTURE_BLOCK,
    TURN_FLIP,
    FALLBACK_SKIP,
    TOGGLE_GUARD,
    BOARD_DECL,
    RESET_BOARD,
    RESET_HELD,
    PASS_INC,
    SNAP_PUSH,
    SNAP_POP,
    LOAD_HOLD,
    SAVE_TAIL,
    ONLINE_SEND,
    ONLINE_RECV,
    TURN_LINE,
    UI_TAIL,
    NEXTBOX_HTML,
    GRID_RENDER,
    AI_EVAL,
    TRAY_UI_ALGO,
    HOLD_ROTATE_FNS,
    CLICK_BODY,
    MOUSE_MOVE,
    PLACE_AT,
    REFRESH_PREVIEW,
    RESET_SUPPLY,
    LOAD_QUEUE,
    SAVE_QUEUE,
    SNAP_QUEUE,
    UNDO_QUEUE,
    ONLINE_QUEUE_RECV,
    ONLINE_QUEUE_SEND,
    PALETTE_FOR,
    PALETTE_CLICK,
    SHUFFLE_FN,
    QUEUE_DECL,
    PMODE_DECL,
    AI_TYPES,
    SUPPLY_BLOCK,
    rv,
    rc,
    RULES_STONE_COMMON,
    RULES_STONE_CONTROLS,
    STARS_GENERIC,
    SIZE_BTNS_91319,
    rb,
    STONE_DEFS,
    STONE_SPEC,
    PER_PLAYER_SPEC,
    WIN_BY_RULE_FN,
    voidDraw,
    WALL_GUARD_SPEC,
    WALL_DRAW,
    WALL_SPEC,
    CIRCLE_FRAME_NONE,
    CIRCLE_DRAW,
    LEGAL_DOTS,
    LEGAL_DOTS_SPEC,
    MOVE_CAP_SPEC,
    EVENT_CHIP_SPEC,
    wrapMarks,
    WRAP_MARKS_SPEC,
    STONE_MARKS_SPEC,
    CUE_STARS,
    CUE_GRID,
    COVERED_ANCHOR,
    OBSTACLE_ANCHOR,
    FX_BOOT,
    texDraw,
    PAINT_WATER,
    PAINT_ROCK,
    PAINT_BRICK,
    PAINT_RIFT,
    PAINT_FRAME,
    PAINT_TOMB,
    PAINT_STEEL,
    PAINT_ZOMBIE,
    PAINT_CAVE,
    PAINT_MOSS,
    PAINT_METEOR,
    PAINT_PIT,
    PAINT_CLIFF,
    AMBIENT_WATER,
    AMBIENT_MIST,
    ALL,
    get failures() { return failures; },
};
