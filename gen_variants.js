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
// 1. NORMGO (通常碁) — 標準的な囲碁そのもの (ベースライン)
// ============================================================
out('normgo.html', apply(ALGO, [
    ...rb('GO', '通常碁', 'normgo'),
    [ONE, RV_ALGO, rv([
        'このゲームは標準的な囲碁。1手1石、特殊ルールなし。',
        '盤サイズは9/13/19路から選択できる (コミ6.5目)。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 (拡張ルールなし)<br>
            PC: クリックで配置 / スマホ: 1タップ目プレビュー、2タップ目確定`],
    ...STONE_SPEC,
], 'normgo'));

// ============================================================
// 2. TORUSGO (トーラス碁) — 辺がループする碁盤
// ============================================================
out('torusgo.html', apply(ALGO, [
    ...rb('TORUSGO', 'トーラス碁', 'torusgo'),
    [ONE, RV_ALGO, rv([
        '盤面はトーラス: 上下・左右の端がつながっており、隅や辺が存在しない。',
        '端を越えても連・呼吸点・取り・地の判定はそのまま続く。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + トーラス盤<br>
            ※上下左右の端がつながっている (隅・辺なし)`],
    [ONE, NBRS_GRID,
`        // トーラス: 上下左右の端がループするので全点が等価 (隅・辺なし)
        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const xm = (x - 1 + BOARD_SIZE) % BOARD_SIZE;
            const xp = (x + 1) % BOARD_SIZE;
            const ym = (y - 1 + BOARD_SIZE) % BOARD_SIZE;
            const yp = (y + 1) % BOARD_SIZE;
            return [
                y * BOARD_SIZE + xm, y * BOARD_SIZE + xp,
                ym * BOARD_SIZE + x, yp * BOARD_SIZE + x
            ];
        }`],
    [ONE, `                const cells = shape.map(([dx, dy]) => ({ x: tx + dx, y: ty + dy }));`,
`                const cells = shape.map(([dx, dy]) => ({
                    x: ((tx + dx) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE,
                    y: ((ty + dy) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE
                }));`],
    [ONE, VALID_BOUNDS,
`            // トーラス盤: セル座標は正規化済み。端を回って同一点に重なる配置は不可。
            const seen = new Set();
            for (const p of cells) {
                const key = p.y * BOARD_SIZE + p.x;
                if (seen.has(key)) return false;
                seen.add(key);
                if (board[key] !== 0) return false;
            }`],
    ...STONE_SPEC,
], 'torusgo'));

// ============================================================
// 3. DIAGO (斜め碁) — 斜めも連・呼吸点になる8近傍盤
// ============================================================
out('diago.html', apply(ALGO, [
    ...rb('DIAGO', '斜め碁', 'diago'),
    [ONE, RV_ALGO, rv([
        '近傍は斜めを含む8方向: 斜めに隣接する石も連になり、呼吸点・取り・地の判定も8方向で行う。',
        '斜めの連だけでも連結扱いになるため、従来よりはるかに強く繋がる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 斜め連結<br>
            ※近傍は8方向: 斜めに隣接する石も連になる`],
    [ONE, NBRS_GRID,
`        // 斜め碁: 近傍は斜めを含む8方向 (連・呼吸点・取り・地すべて8方向)
        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) continue;
                    neighbors.push(ny * BOARD_SIZE + nx);
                }
            }
            return neighbors;
        }`],
    ...STONE_SPEC,
], 'diago'));

// ============================================================
// 4. WALLGO (迷路碁) — ランダムな壁マスがある碁盤
// ============================================================
out('wallgo.html', apply(ALGO, [
    ...rb('WALLGO', '迷路碁', 'wallgo'),
    [ONE, RV_ALGO, rv([
        '対局開始時に盤上へランダムで壁マス (約12%) が配置される。',
        '壁は石を置けず、呼吸点にも地にもならない中立のブロック。取ることもできない。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 迷路壁<br>
            ※ランダムな壁マスがあり、置けない・呼吸点にも地にもならない`],
    [ONE, BOARD_DECL,
`        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白, 3:壁
        const WALL_RATE = 0.12; // 壁マスの密度`],
    // 壁の生成 (リセット時にランダム配置)
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 迷路ルール: 壁マスをランダム配置
            for (let i = 0; i < board.length; i++) {
                if (Math.random() < WALL_RATE) board[i] = 3;
            }`],
    // 壁の描画 + フォールバックで壁を石として描かないよう除外
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 壁マスの描画 (中立ブロック)
            for (let wy = 0; wy < BOARD_SIZE; wy++) {
                for (let wx = 0; wx < BOARD_SIZE; wx++) {
                    if (board[wy * BOARD_SIZE + wx] !== 3) continue;
                    const bx = padding + wx * cellSize;
                    const by = padding + wy * cellSize;
                    const bs = cellSize * 0.52;
                    ctx.fillStyle = 'rgba(60, 42, 25, 0.85)';
                    ctx.fillRect(bx - bs / 2, by - bs / 2, bs, bs);
                    ctx.strokeStyle = 'rgba(30, 20, 10, 0.9)';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(bx - bs / 2, by - bs / 2, bs, bs);
                }
            }`],
    [ONE, FALLBACK_SKIP,
`                    if (val !== 1 && val !== 2) continue; // 空点・壁は石として描かない`],
    // 死に石選択で壁を選べないようにする
    [ONE, TOGGLE_GUARD,
`            const color = board[startIdx];
            if (color === 0 || color === 3) return;`],
    ...STONE_SPEC,
], 'wallgo'));

// ============================================================
// 5. GRAVGO (重力碁) — 石は最下段か石の直上にしか置けない
// ============================================================
out('gravgo.html', apply(ALGO, [
    ...rb('GRAVGO', '重力碁', 'gravgo'),
    [ONE, RV_ALGO, rv([
        '重力ルール: 石は盤の最下段か、真下に他の石がある交点にしか置けない。',
        '取りで支えを失った石は浮いたまま残る (落下はしない)。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 重力ルール<br>
            ※石は最下段または他の石の直上にしか置けない`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 重力ルール: 最下段か、真下の交点が既に占有されている場所のみ置ける
            if (!cells.every(p => p.y === BOARD_SIZE - 1 || board[(p.y + 1) * BOARD_SIZE + p.x] !== 0)) return false;`],
    ...STONE_SPEC,
], 'gravgo'));

// ============================================================
// 6. SPAWNGO (繁殖碁) — 自分の石に隣接する点にしか置けない
// ============================================================
out('spawngo.html', apply(ALGO, [
    ...rb('SPAWNGO', '繁殖碁', 'spawngo'),
    [ONE, RV_ALGO, rv([
        '繁殖ルール: 自分の石が盤にある間は、既存の自分の石に隣接する空点にしか置けない。',
        '全滅した場合のみ、盤上のどこにでも置ける。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 繁殖ルール<br>
            ※自分の石に隣接する空点にしか置けない (全滅時のみ自由)`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 繁殖ルール: 自分の石が盤にある間は既存の石に隣接する点のみ置ける
            if (board.includes(player) && !cells.some(p =>
                getNeighbors(p.y * BOARD_SIZE + p.x).some(n => board[n] === player))) return false;`],
    ...STONE_SPEC,
], 'spawngo'));

// ============================================================
// 7. MIRRGO (対称碁) — 着手が縦中央線で鏡映される
// ============================================================
out('mirrgo.html', apply(ALGO, [
    ...rb('MIRRGO', '対称碁', 'mirrgo'),
    [ONE, RV_ALGO, rv([
        '対称ルール: 着手すると盤の縦中央線に対して鏡映した位置にも同じ石が置かれる (最大で着手の2倍)。',
        '鏡映先が塞がっているセルは置かれない。鏡映側で自分の連が窒息する場合はその鏡映をスキップする。',
        '鏡映した石も通常の石として取り・呼吸点に関与する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 対称ルール<br>
            ※着手は縦中央線で鏡映され、空いていれば両側に置かれる`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 対称ルール: 縦中央線に対して鏡映した位置にも同じ形を置く
            const mirrored = move.cells
                .map(p => ({ x: BOARD_SIZE - 1 - p.x, y: p.y }))
                .filter(p => board[p.y * BOARD_SIZE + p.x] === 0);
            if (mirrored.length > 0) {
                // 鏡映による相手石の捕獲を先に解決してから、自連の窒息を判定
                const sim = [...board];
                mirrored.forEach(p => { sim[p.y * BOARD_SIZE + p.x] = player; });
                const opp2 = player === 1 ? 2 : 1;
                getCapturedStones(sim, opp2).forEach(i => { sim[i] = 0; });
                if (getCapturedStones(sim, player).length === 0) {
                    mirrored.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
                    pieces.push({ id: Date.now() + Math.random(), player, type: move.type, rot: move.rot, cells: mirrored });
                    lastMove.cells.push(...mirrored.map(p => ({ ...p })));
                }
            }`],
    ...STONE_SPEC,
], 'mirrgo'));

// ============================================================
// 8. TWICEGO (二手碁) — 各手番で2石ずつ置く
// ============================================================
out('twicego.html', apply(ALGO, [
    ...rb('TWICEGO', '二手碁', 'twicego'),
    [ONE, RV_ALGO, rv([
        '二手碁: 各手番で2石ずつ置く (同じ色が2連続で着手する)。',
        '途中でパスすれば残りの着手を放棄して手番が渡る。手番表示の「n手目/2」で残りを確認できる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 二手ルール<br>
            ※各手番で2石置く (途中パスで残りを放棄)`],
    [ONE, `        let consecutivePasses = 0;`,
`        let consecutivePasses = 0;
        let turnPlacements = 0; // この手番で置いた石数 (2で手番交代)`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turnPlacements++;
            if (turnPlacements >= 2) {
                turnPlacements = 0;
                turn = opponent; // 2石置き切りで手番交代
            }`],
    // パスは残り着手を放棄して手番を渡す
    [ONE, PASS_INC,
`            prevBoard = null; // パスでコウ制限は解除
            consecutivePasses++;
            turnPlacements = 0;`],
    // 手番表示に「n手目/2」を追加
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + \` · \${turnPlacements + 1}手目/2\`;`],
    // 状態保存・復元・同期に turnPlacements を追加
    [ONE, SAVE_TAIL,
`                    heldPieces,
                    holdUsed,
                    turnPlacements,
                    gameMode,`],
    [ONE, LOAD_HOLD,
`            holdUsed = !!s.holdUsed;
            turnPlacements = Number.isInteger(s.turnPlacements) ? s.turnPlacements : 0;`],
    [ONE, SNAP_PUSH,
`                heldPieces: { ...heldPieces },
                holdUsed,
                turnPlacements
            });`],
    [ONE, SNAP_POP,
`            holdUsed = !!snap.holdUsed;
            turnPlacements = snap.turnPlacements || 0;`],
    [ONE, ONLINE_SEND,
`                heldPieces,
                holdUsed,
                turnPlacements,
                deadStones: [...deadStones],`],
    [ONE, ONLINE_RECV,
`            holdUsed = !!data.holdUsed;
            turnPlacements = data.turnPlacements || 0;`],
    ...STONE_SPEC,
], 'twicego'));

// ============================================================
// 9. KINGGO (王碁) — 最初に置いた石が王。王を取られると即負け
// ============================================================
out('kinggo.html', apply(ALGO, [
    ...rb('KINGGO', '王碁', 'kinggo'),
    [ONE, RV_ALGO, rv([
        '各プレイヤーが最初に置いた石は「王」(♛マーク) になる。',
        '王を含む連が取られると即座に敗北。通常の地集計勝負 (パス2連続) も同時に有効。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 王石ルール<br>
            ※各プレイヤーの最初の石が王 (♛)。王を取られると即負け`],
    [ONE, `        let consecutivePasses = 0;`,
`        let consecutivePasses = 0;
        let kings = { 1: -1, 2: -1 }; // 各プレイヤーの王石 (盤面idx、-1=未配置)`],
    // 着手後: 初手は王として登録
    [ONE, PIECES_PUSH,
`            // 王碁: 各プレイヤーが最初に置いた石が「王」になる
            if (kings[player] === -1) kings[player] = move.cells[0].y * BOARD_SIZE + move.cells[0].x;

${PIECES_PUSH}`],
    // 捕獲時に相手の王を取っていたら即勝利
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                if (captured.includes(kings[opponent])) {
                    kings[opponent] = -1;
                    winByRule(player, '王取り', \`\${player === 1 ? '黒' : '白'}が相手の王を取りました\`);
                    return;
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    // 王石の冠マーカー描画
    [ONE, `        function drawLastMove(padding, cellSize) {`,
`        // 王石 (♛) の描画
        function drawKings(padding, cellSize) {
            [1, 2].forEach(pl => {
                const k = kings[pl];
                if (k < 0 || board[k] !== pl) return;
                const kx = k % BOARD_SIZE, ky = Math.floor(k / BOARD_SIZE);
                ctx.save();
                ctx.fillStyle = pl === 1 ? '#fbbf24' : '#b45309';
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 1;
                ctx.font = \`bold \${Math.round(cellSize * 0.5)}px sans-serif\`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const kcx = padding + kx * cellSize, kcy = padding + ky * cellSize;
                ctx.strokeText('♛', kcx, kcy + cellSize * 0.04);
                ctx.fillText('♛', kcx, kcy + cellSize * 0.04);
                ctx.restore();
            });
        }

        function drawLastMove(padding, cellSize) {`],
    [ONE, `            // 直前に配置したピースのハイライト(緑系)
            drawLastMove(padding, cellSize);`,
`            // 直前に配置したピースのハイライト(緑系)
            drawLastMove(padding, cellSize);

            // 王石の冠マーカー
            drawKings(padding, cellSize);`],
    // 状態保存・復元・同期に kings を追加
    [ONE, SAVE_TAIL,
`                    heldPieces,
                    holdUsed,
                    kings,
                    gameMode,`],
    [ONE, LOAD_HOLD,
`            holdUsed = !!s.holdUsed;
            kings = (s.kings && typeof s.kings === 'object')
                ? { 1: s.kings[1] || -1, 2: s.kings[2] || -1 } : { 1: -1, 2: -1 };`],
    [ONE, SNAP_PUSH,
`                heldPieces: { ...heldPieces },
                holdUsed,
                kings: { ...kings }
            });`],
    [ONE, SNAP_POP,
`            holdUsed = !!snap.holdUsed;
            kings = snap.kings ? { ...snap.kings } : { 1: -1, 2: -1 };`],
    [ONE, ONLINE_SEND,
`                heldPieces,
                holdUsed,
                kings,
                deadStones: [...deadStones],`],
    [ONE, ONLINE_RECV,
`            holdUsed = !!data.holdUsed;
            kings = data.kings ? { ...data.kings } : { 1: -1, 2: -1 };`],
    [ONE, RESET_HELD,
`            heldPieces = { 1: null, 2: null };
            kings = { 1: -1, 2: -1 };`],
    // 即勝利ヘルパー
    [ONE, `        function endGameByScore() {`, WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    ...STONE_SPEC,
], 'kinggo'));

// ============================================================
// 10. MAXGO (先取碁) — 10石先取で即勝利
// ============================================================
out('maxgo.html', apply(ALGO, [
    ...rb('MAXGO', '先取碁', 'maxgo'),
    [ONE, RV_ALGO, rv([
        '先取ルール: 先に10石取った側がその場で勝利する。',
        '通常の終局 (パス2連続→地集計+コミ) も同時に有効。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 先取ルール<br>
            ※先に10石取った側が即勝利 (地集計も有効)`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        const WIN_CAPTURES = 10; // 先取ルール: この数のアゲハマで即勝利`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                if (captures[player] >= WIN_CAPTURES) {
                    winByRule(player, '先取', \`\${player === 1 ? '黒' : '白'}が先に \${WIN_CAPTURES} 石を取りました\`);
                    return;
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, `        function endGameByScore() {`, WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    ...STONE_SPEC,
], 'maxgo'));

// ============================================================
// 11. SANDGO (ハサミ碁) — 上下/左右に挟まれた敵石を追加捕獲
// ============================================================
out('sandgo.html', apply(ALGO, [
    ...rb('SANDGO', 'ハサミ碁', 'sandgo'),
    [ONE, RV_ALGO, rv([
        'ハサミ取り: 着手後、自分の石で上下か左右に一直線に挟まれた敵石は呼吸点に関係なく取られる。',
        '挟まれた側は自分の番では取られないので、隙間に逃げ込む手は安全。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + ハサミ取り<br>
            ※敵石を上下/左右に一直線に挟むと呼吸点に関係なく取れる`],
    [ONE, `            // ネクストモードでは次のピースを供給`,
`            // ハサミ取り: 着手側の石で上下または左右に挟まれた敵石を追加捕獲
            {
                const squeezed = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== opponent) continue;
                    const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                    const l = sx > 0 ? board[i - 1] : -1;
                    const r = sx < BOARD_SIZE - 1 ? board[i + 1] : -1;
                    const u = sy > 0 ? board[i - BOARD_SIZE] : -1;
                    const d = sy < BOARD_SIZE - 1 ? board[i + BOARD_SIZE] : -1;
                    if ((l === player && r === player) || (u === player && d === player)) {
                        squeezed.push(i);
                    }
                }
                if (squeezed.length > 0) {
                    squeezed.forEach(i => { board[i] = 0; });
                    captures[player] += squeezed.length;
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            }

            // ネクストモードでは次のピースを供給`],
    ...STONE_SPEC,
], 'sandgo'));

// ============================================================
// 12. DECAYGO (崩壊碁) — 碁石が寿命で崩壊する
// ============================================================
out('decaygo.html', apply(ALGO, [
    ...rb('DECAYGO', '崩壊碁', 'decaygo'),
    [ONE, RV_ALGO, rv([
        '碁石に寿命がある: 配置から8手 (自分+相手の着手計) 経過した石は崩壊して消える。',
        '崩壊した石はアゲハマにならない。石は古くなるほど薄く表示される。',
    ])],
    [ONE, INFO_ALGO,
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
                    if (ages[i] > DECAY_LIMIT) { board[i] = 0; ages[i] = 0; decayed++; }
                }
            }
            if (decayed > 0) cleanUpPieces();

            // ネクストモードでは次のピースを供給`],
    // 古い石ほど薄く描画 (ピース単位)
    [ONE, `                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);`,
`                // 経過ターンごとに透明度を変えて描画 (古い石ほど薄くなる)
                const byAge = {};
                alive.forEach(p => {
                    const a = ages[p.y * BOARD_SIZE + p.x] || 0;
                    (byAge[a] = byAge[a] || []).push(p);
                });
                Object.keys(byAge).forEach(a => {
                    const alpha = isDead ? 0.35 : Math.max(0.25, 1 - a / (DECAY_LIMIT + 1));
                    drawPieceShape(byAge[a], padding, cellSize, fill, stroke, alpha);
                });`],
    [ONE, `                    drawPieceShape([{ x, y }], padding, cellSize, fill, stroke, isDead ? 0.35 : 1);`,
`                    const a = ages[idx] || 0;
                    const alpha = isDead ? 0.35 : Math.max(0.25, 1 - a / (DECAY_LIMIT + 1));
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
], 'decaygo'));

// ============================================================
// 13. LIFEGO (生命碁) — 着手ごとにライフゲーム1世代
// ============================================================
const LIFE_FN = `
        // 着手ごとに盤面全体を Conway のライフゲーム1世代進める。
        // 誕生色は3近傍の単色のみ (混色なら誕生しない)。
        // 世代交代の結果、呼吸点を失った連は両色とも取り除く。
        function applyLifeStep() {
            const counts = new Array(board.length).fill(0);
            const tint = new Array(board.length).fill(0); // 0:未接触 / 1,2:単色 / -1:混色
            for (let i = 0; i < board.length; i++) {
                if (board[i] === 0) continue;
                const c = board[i];
                getNeighbors(i).forEach(n => {
                    counts[n]++;
                    tint[n] = tint[n] === 0 ? c : (tint[n] === c ? c : -1);
                });
            }
            const next = [...board];
            let changed = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) {
                    if (counts[i] < 2 || counts[i] > 3) { next[i] = 0; changed++; }
                } else if (counts[i] === 3 && tint[i] !== -1) {
                    next[i] = tint[i]; changed++;
                }
            }
            board = next;
            if (changed > 0) cleanUpPieces();
            // 世代交代で呼吸点を失った連を両色とも除去 (安定するまで)
            for (let k = 0; k < 8; k++) {
                const dead = [...getCapturedStones(board, 1), ...getCapturedStones(board, 2)];
                if (dead.length === 0) break;
                dead.forEach(i => { board[i] = 0; });
                cleanUpPieces();
            }
        }
`;

out('lifego.html', apply(ALGO, [
    ...rb('LIFEGO', '生命碁', 'lifego'),
    [ONE, RV_ALGO, rv([
        '着手ごとに盤面全体がライフゲーム1世代進化する (近傍=上下左右の4方向)。',
        '石は2〜3個の生きた隣接石で生存、4近傍以上は過密死、0〜1は過疎死、空点はちょうど3近傍で誕生 (混色時は誕生しない)。',
        '世代交代で呼吸点を失った連は両色とも除去される。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + ライフゲーム<br>
            ※配置のたびに全碁石が1世代進化 (過疎・過密死・3近傍誕生)`],
    [ONE, `        function cleanUpPieces() {
            pieces = pieces.filter(pc =>
                pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] !== 0)
            );
        }`,
`        function cleanUpPieces() {
            pieces = pieces.filter(pc =>
                pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] !== 0)
            );
        }
${LIFE_FN}`],
    [ONE, `            // ネクストモードでは次のピースを供給`,
`            // ライフゲーム世代交代: 着手ごとに盤面全体を1世代進める
            applyLifeStep();

            // ネクストモードでは次のピースを供給`],
    ...STONE_SPEC,
], 'lifego'));

// ============================================================
// 14. RUSHGO (スピード碁) — 1手の制限時間 + 自動パス
// ============================================================
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
            if (timerFill) timerFill.style.width = (remain / (timeLimit * 1000) * 100) + '%';
            if (remain <= 0) {
                clearMoveTimer();
                if (!gameOver && gamePhase === 'playing' && isMyTurn()) handlePass();
            }
        }
        function clearMoveTimer() {
            if (moveTimerInterval) { clearInterval(moveTimerInterval); moveTimerInterval = null; }
        }
`;

out('rushgo.html', apply(ALGO, [
    ...rb('RUSHGO', 'スピード碁', 'rushgo'),
    [ONE, RV_ALGO, rv([
        '1手ごとの制限時間付き (設定でなし/5/10/30秒)。時間切れは自動パスになる。',
        'タイムバーはステータスカードの下に常時表示される。',
    ])],
    [ONE, INFO_ALGO,
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
], 'rushgo'));

// ============================================================
// 15. 3DGO (立体碁) — 3層盤面、上下も連・呼吸点になる
// ============================================================
let d3 = apply(ALGO, [
    ...rb('3DGO', '立体碁', '3dgo'),
    [ONE, RV_ALGO, rv([
        '盤面は3層。同じ層の上下左右に加えて、真上・真下の層の点も近傍になる (最大6近傍)。',
        '層タブで置く層を選ぶ。他層の石は薄い◆で表示される。',
        '取り・呼吸点・地の判定は3層をまたいで行われる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 3層盤面<br>
            ※盤面は3層: 上下の層も連・呼吸点になる。他層の石は薄い◆で表示`],
    [ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`,
`        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));
        const LAYERS = 3; // 立体盤の層数`],
    [ONE, BOARD_DECL,
`        let board = Array(BOARD_SIZE * BOARD_SIZE * LAYERS).fill(0); // 0:空, 1:黒, 2:白 (3層)
        let activeLayer = 0; // 表示・入力中の層`],
    // 全セル→idx変換を z 対応に (ピースセルは {x,y,z})
    // ※getNeighbors挿入より先に行うこと (cellIndex本体が置換対象文字列を含むため)
    [ALL, 'p.y * BOARD_SIZE + p.x', 'cellIndex(p)'],
    [ONE, 'cells[0].y * BOARD_SIZE + cells[0].x', 'cellIndex(cells[0])'],
    // ※drawPieceShapeの連結判定キーは2Dのままにする (描画対象は常に同一層)
    [ONE, `const set = new Set(cellsAbs.map(p => cellIndex(p)));`,
`const set = new Set(cellsAbs.map(p => p.y * BOARD_SIZE + p.x));`],
    [ONE, NBRS_GRID,
`        function layerCells() { return BOARD_SIZE * BOARD_SIZE; }
        function cellIndex(p) { return p.z * layerCells() + p.y * BOARD_SIZE + p.x; }

        // 3D盤: 同一層の4近傍 + 上下層の2近傍 (最大6近傍)
        function getNeighbors(idx) {
            const ls = layerCells();
            const z = Math.floor(idx / ls);
            const rem = idx % ls;
            const x = rem % BOARD_SIZE;
            const y = Math.floor(rem / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            if (z > 0) neighbors.push(idx - ls);
            if (z < LAYERS - 1) neighbors.push(idx + ls);

            return neighbors;
        }`],
    // 配置セルに activeLayer を付与
    [ONE, `            shape.forEach(([cx, cy]) => {
                const tx = Math.round(u) - cx;
                const ty = Math.round(v) - cy;
                const cells = shape.map(([dx, dy]) => ({ x: tx + dx, y: ty + dy }));`,
`            shape.forEach(([cx, cy]) => {
                const tx = Math.round(u) - cx;
                const ty = Math.round(v) - cy;
                const cells = shape.map(([dx, dy]) => ({ x: tx + dx, y: ty + dy, z: activeLayer }));`],
    // 表示はアクティブ層のセルのみ
    [ONE, `                const alive = pc.cells.filter(p => board[cellIndex(p)] === pc.player);`,
`                const alive = pc.cells.filter(p => board[cellIndex(p)] === pc.player && p.z === activeLayer);`],
    [ONE, `            const alive = lastMove.cells.filter(p => board[cellIndex(p)] === lastMove.player);`,
`            const alive = lastMove.cells.filter(p => board[cellIndex(p)] === lastMove.player && p.z === activeLayer);`],
    // 窒息領域表示はアクティブ層のみ
    [ONE, `            for (let i = 0; i < board.length; i++) {
                if (board[i] === 0 && deadMask[i]) {
                    const x = i % BOARD_SIZE;
                    const y = Math.floor(i / BOARD_SIZE);`,
`            const ls = layerCells();
            const z0 = activeLayer * ls;
            for (let i = z0; i < z0 + ls; i++) {
                if (board[i] === 0 && deadMask[i]) {
                    const x = (i - z0) % BOARD_SIZE;
                    const y = Math.floor((i - z0) / BOARD_SIZE);`],
    // 層内 idx (フォールバック描画 & 死に石タップ) を層オフセット付きに
    [ALL, `const idx = y * BOARD_SIZE + x;`, `const idx = activeLayer * layerCells() + y * BOARD_SIZE + x;`],
    // 他層の石の位置を薄い菱形で表示
    [ONE, `                    drawPieceShape([{ x, y }], padding, cellSize, fill, stroke, isDead ? 0.35 : 1);
                    if (isDead) drawDeadMarker(cx, cy, r);
                }
            }
        }

        function drawLastMove(padding, cellSize) {`,
`                    drawPieceShape([{ x, y }], padding, cellSize, fill, stroke, isDead ? 0.35 : 1);
                    if (isDead) drawDeadMarker(cx, cy, r);
                }
            }

            // 他層の石の位置を薄い菱形で表示 (上下の連・呼吸点が見えるように)
            for (let z = 0; z < LAYERS; z++) {
                if (z === activeLayer) continue;
                for (let y = 0; y < BOARD_SIZE; y++) {
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        const idx2 = z * layerCells() + y * BOARD_SIZE + x;
                        const val = board[idx2];
                        if (val === 0) continue;
                        const s2 = cellSize * 0.16;
                        ctx.save();
                        ctx.globalAlpha = 0.28;
                        ctx.fillStyle = val === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                        ctx.translate(padding + (x + 0.32) * cellSize, padding + (y - 0.32) * cellSize);
                        ctx.rotate(Math.PI / 4);
                        ctx.fillRect(-s2 / 2, -s2 / 2, s2, s2);
                        ctx.restore();
                    }
                }
            }
        }

        function drawLastMove(padding, cellSize) {`],
    // 層選択タブ
    [ONE, `        <!-- 碁カントレイ`,
`        <!-- 層選択タブ -->
        <div class="w-full flex justify-center gap-2">
            <button data-layer="0" class="btn-layer flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all hover:opacity-80">第1層</button>
            <button data-layer="1" class="btn-layer flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all hover:opacity-80">第2層</button>
            <button data-layer="2" class="btn-layer flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all hover:opacity-80">第3層</button>
        </div>

        <!-- 碁カントレイ`],
    [ONE, `        // 盤サイズ選択ボタン`,
`        // 層選択タブ
        document.querySelectorAll('.btn-layer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                soundManager.playClick();
                activeLayer = parseInt(e.target.dataset.layer);
                updateUI();
            });
        });

        function updateLayerTabs() {
            document.querySelectorAll('.btn-layer').forEach(b => {
                const active = parseInt(b.dataset.layer) === activeLayer;
                b.classList.toggle('bg-neutral-900', active);
                b.classList.toggle('text-white', active);
            });
        }

        // 盤サイズ選択ボタン`],
    [ONE, UI_TAIL,
`            btnUndo.disabled = !canUndo();
            updatePieceTrayUI();
            render();
            updateLayerTabs();
        }`],
    // 永続化: 盤面は3層分
    [ONE, `                || !Array.isArray(s.board) || s.board.length !== s.boardSize * s.boardSize) {`,
`                || !Array.isArray(s.board) || s.board.length !== s.boardSize * s.boardSize * LAYERS) {`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE * LAYERS).fill(0);
            activeLayer = 0;`],
    [ONE, `            if (data.boardSize && data.boardSize !== BOARD_SIZE) {
                BOARD_SIZE = data.boardSize;
                pendingBoardSize = BOARD_SIZE;
                resizeCanvas();
            }`,
`            if (data.boardSize && data.boardSize !== BOARD_SIZE) {
                BOARD_SIZE = data.boardSize;
                pendingBoardSize = BOARD_SIZE;
                activeLayer = 0;
                resizeCanvas();
            }`],
    ...STONE_SPEC,
], '3dgo');
out('3dgo.html', d3);

// ============================================================
// 16. GRAPHGO (グラフ碁) — 盤面が分子グラフ
//     呼吸点・連は盤の辺のみ。ピース内隣接には辺が必要
// ============================================================
let graph = apply(ALGO, [
    ...rb('GRAPHGO', 'グラフ碁', 'graphgo'),
    [ONE, RV_ALGO, rv([
        '盤面はランダムな分子グラフ: 全格子辺から約28%を連結を保ちながら除去して生成。',
        '連・呼吸点・取り・地の判定はすべてグラフの辺 (結合線) だけを辿る。辺のない隣接はつながらない。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 分子グラフ盤<br>
            ※呼吸点・連は結合(辺)のみ。格子の隣接でも辺がなければつながらない`],
    [ONE, BOARD_DECL,
`${BOARD_DECL}
        let ADJ = []; // グラフ隣接リスト (盤面=分子グラフ: 頂点=炭素, 辺=結合)
        let graphRemoved = []; // 除去された辺のインデックス (保存・同期用)`],
    [ONE, NBRS_GRID,
`        // グラフ盤: 近傍=辺で結ばれた頂点のみ
        function getNeighbors(idx) { return ADJ[idx] || []; }
        function hasEdge(a, b) { return ADJ[a] && ADJ[a].includes(b); }

        function gridEdges() {
            const all = [];
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const i = y * BOARD_SIZE + x;
                if (x < BOARD_SIZE - 1) all.push([i, i + 1]);
                if (y < BOARD_SIZE - 1) all.push([i, i + BOARD_SIZE]);
            }
            return all;
        }

        function rebuildADJ(removedSet) {
            const n = BOARD_SIZE * BOARD_SIZE;
            ADJ = Array.from({ length: n }, () => []);
            gridEdges().forEach(([a, b], i) => {
                if (removedSet.has(i)) return;
                ADJ[a].push(b); ADJ[b].push(a);
            });
        }

        // 全格子辺から約28%をランダム除去 (連結性は維持) → 分子骨格状の盤面
        function buildGraph() {
            const n = BOARD_SIZE * BOARD_SIZE;
            const all = gridEdges();
            const removed = new Set();
            const target = Math.floor(all.length * 0.28);
            const order = [...all.keys()];
            for (let i = order.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [order[i], order[j]] = [order[j], order[i]];
            }
            const connected = (rem) => {
                const adj = Array.from({ length: n }, () => []);
                all.forEach(([a, b], i) => { if (!rem.has(i)) { adj[a].push(b); adj[b].push(a); } });
                const seen = new Set([0]); const q = [0];
                while (q.length) { const c = q.pop(); for (const m of adj[c]) if (!seen.has(m)) { seen.add(m); q.push(m); } }
                return seen.size === n;
            };
            let count = 0;
            for (const i of order) {
                if (count >= target) break;
                removed.add(i);
                if (!connected(removed)) removed.delete(i); else count++;
            }
            graphRemoved = [...removed];
            rebuildADJ(removed);
        }`],
    // 盤面描画: 格子線→結合線+炭素ノード (星はなし)
    [ONE, GRID_RENDER,
`            // 分子グラフ盤: 辺=結合線、頂点=炭素球
            ctx.strokeStyle = currentTheme.lineColor;
            ctx.lineWidth = Math.max(1.5, cellSize * 0.055);
            for (let a = 0; a < ADJ.length; a++) {
                const ax = a % BOARD_SIZE, ay = Math.floor(a / BOARD_SIZE);
                for (const b of ADJ[a]) {
                    if (b < a) continue;
                    const bx = b % BOARD_SIZE, by = Math.floor(b / BOARD_SIZE);
                    ctx.beginPath();
                    ctx.moveTo(padding + ax * cellSize, padding + ay * cellSize);
                    ctx.lineTo(padding + bx * cellSize, padding + by * cellSize);
                    ctx.stroke();
                }
            }
            // 外枠強調
            ctx.strokeStyle = currentTheme.lineColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(padding, padding, width - padding * 2, width - padding * 2);

            // 炭素ノード (頂点)
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.09, 0, Math.PI * 2);
                    ctx.fillStyle = currentTheme.starColor;
                    ctx.fill();
                }
            }`],
    // 永続化・リセット・オンライン同期にグラフを含める
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            buildGraph();`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    graphRemoved,
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            graphRemoved = Array.isArray(s.graphRemoved) ? s.graphRemoved : [];
            rebuildADJ(new Set(graphRemoved));`],
    [ONE, `            if (data.boardSize && data.boardSize !== BOARD_SIZE) {
                BOARD_SIZE = data.boardSize;
                pendingBoardSize = BOARD_SIZE;
                resizeCanvas();
            }`,
`            if (data.boardSize && data.boardSize !== BOARD_SIZE) {
                BOARD_SIZE = data.boardSize;
                pendingBoardSize = BOARD_SIZE;
                resizeCanvas();
            }
            if (Array.isArray(data.graphRemoved)) {
                graphRemoved = data.graphRemoved;
                rebuildADJ(new Set(graphRemoved));
            }`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                graphRemoved,
                pieceMode,`],
    ...STONE_SPEC,
], 'graphgo');
out('graphgo.html', graph);

// ============================================================
// 17. PENGO (ペン碁) — ペントミノ12種の分子
// ============================================================
const PENTO_MOLS = `        // 12種のペントミノを分子として扱う (5連結マス)。窒息領域は5マス未満。
        const MOLECULES = {
            F: { name: 'Fペントミノ', iupac: 'F', formula: 'ペントミノ (5マス)', atoms: [[1,0],[2,0],[0,1],[1,1],[1,2]] },
            I: { name: 'Iペントミノ', iupac: 'I', formula: 'ペントミノ (5マス)', atoms: [[0,0],[1,0],[2,0],[3,0],[4,0]] },
            L: { name: 'Lペントミノ', iupac: 'L', formula: 'ペントミノ (5マス)', atoms: [[0,0],[0,1],[0,2],[0,3],[1,3]] },
            P: { name: 'Pペントミノ', iupac: 'P', formula: 'ペントミノ (5マス)', atoms: [[0,0],[1,0],[0,1],[1,1],[0,2]] },
            N: { name: 'Nペントミノ', iupac: 'N', formula: 'ペントミノ (5マス)', atoms: [[1,0],[1,1],[0,2],[1,2],[0,3]] },
            T: { name: 'Tペントミノ', iupac: 'T', formula: 'ペントミノ (5マス)', atoms: [[0,0],[1,0],[2,0],[1,1],[1,2]] },
            U: { name: 'Uペントミノ', iupac: 'U', formula: 'ペントミノ (5マス)', atoms: [[0,0],[2,0],[0,1],[1,1],[2,1]] },
            V: { name: 'Vペントミノ', iupac: 'V', formula: 'ペントミノ (5マス)', atoms: [[0,0],[0,1],[0,2],[1,2],[2,2]] },
            W: { name: 'Wペントミノ', iupac: 'W', formula: 'ペントミノ (5マス)', atoms: [[0,0],[0,1],[1,1],[1,2],[2,2]] },
            X: { name: 'Xペントミノ', iupac: 'X', formula: 'ペントミノ (5マス)', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2]] },
            Y: { name: 'Yペントミノ', iupac: 'Y', formula: 'ペントミノ (5マス)', atoms: [[1,0],[0,1],[1,1],[1,2],[1,3]] },
            Z: { name: 'Zペントミノ', iupac: 'Z', formula: 'ペントミノ (5マス)', atoms: [[0,0],[1,0],[1,1],[1,2],[2,2]] }
        };`;

out('pengo.html', apply(ALGO, [
    ...rb('PENGO', 'ペン碁', 'pengo'),
    [ONE, RV_ALGO, rv([
        'このゲームで使う碁ペンはペントミノ12種 (5マスの連結形)。',
        '窒息領域: 5マス未満の空領域は呼吸点にも地にもならない。',
        '回転のみ可能 (鏡像は別の向きとしては出ない)。',
        '供給モード: 「自由選択」は毎手好きな碁ペンを選べる。「ネクスト」は12種1巡のランダム供給 (ホールド可)。',
    ])],
    [ONE, INFO_ALGO,
`            ペントミノ「碁ペン」を配置し合う変則囲碁<br>
            ※窒息領域は5マス未満 (ペントミノが入らない空領域)`],
    [ONE, MOLECULES_ALGO, PENTO_MOLS],
    [ONE, OCNT_ALGO, '// 回転のみ (鏡像なし): F4/I2/L4/P4/N4/T4/U4/V4/W4/X1/Y4/Z4 = 計45パターン'],
    [ONE, `let currentPieceType = 'ISOBUTANE';`, `let currentPieceType = 'F';`],
    [ONE, `? s.currentPieceType : 'BUTANE'`, `? s.currentPieceType : 'F'`],
    [ONE, '登場アルカン', '登場ペントミノ'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`ペントミノは碁石5個が連結した形 (12種)。5マス未満の窒息領域にはどの碁ペンも入りません。`],
    [ONE, `// 3. アルカン分子 (ピース) 定義`, `// 3. ペントミノ分子 (ピース) 定義`],
    [ONE, `        // アルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // すべて4原子以上なので「4マス未満の窒息領域」ルールがそのまま機能する。`,
`        // ペントミノ (5連結マス) を分子として描画する。原子=碁石、結合=連結。
        // すべて5マスなので「5マス未満の窒息領域」ルールが機能する。`],
    [ALL, '碁カン', '碁ペン'],
    [ALL, '全7種1巡', '全12種1巡'],
    [ALL, '7種1巡', '12種1巡'],
], 'pengo'));

// ============================================================
// 18. CYCLOGO (シクロ碁) — シクロアルカン (環状分子)
// ============================================================
const CYCLO_MOLECULES = `        const MOLECULES = {
            CYCLOBUTANE:       { name: 'シクロブタン',       iupac: 'シクロブタン',        formula: 'C₄H₈',  atoms: [[0,0],[1,0],[0,1],[1,1]] },
            METHYLCYCLOBUTANE: { name: 'メチルシクロブタン', iupac: 'メチルシクロブタン',  formula: 'C₅H₁₀', atoms: [[0,0],[1,0],[0,1],[1,1],[2,1]] },
            CYCLOHEXANE:       { name: 'シクロヘキサン',     iupac: 'シクロヘキサン',      formula: 'C₆H₁₂', atoms: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]] },
            ETHYLCYCLOBUTANE:  { name: 'エチルシクロブタン', iupac: 'エチルシクロブタン',  formula: 'C₆H₁₂', atoms: [[0,0],[1,0],[0,1],[1,1],[2,1],[3,1]] },
            CYCLOOCTANE:       { name: 'シクロオクタン',     iupac: 'シクロオクタン',      formula: 'C₈H₁₆', atoms: [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]] },
            NAPHTHALENE:       { name: 'ナフタレン',         iupac: 'ナフタレン (縮合環)', formula: 'C₁₀H₈', atoms: [[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1]] },
            ADAMANTANE:        { name: 'アダマンタン',       iupac: 'アダマンタン',        formula: 'C₁₀H₁₆', atoms: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]] }
        };`;

out('cyclogo.html', apply(ALGO, [
    ...rb('CYCLOGO', 'シクロ碁', 'cyclogo'),
    [ONE, RV_ALGO, rv([
        'このゲームで使う碁クロはシクロアルカン7種 (環状分子)。',
        'リング状の碁クロは内側に空点を残すことがある。窒息領域は4マス未満。',
    ])],
    [ONE, MOLECULES_ALGO, CYCLO_MOLECULES],
    [ONE, OCNT_ALGO, '// シクロブタン:1 / メチルシクロブタン:4 / シクロヘキサン:2 / エチルシクロブタン:4 / シクロオクタン:1 / ナフタレン:2 / アダマンタン:1 = 計15パターン'],
    [ONE, `let currentPieceType = 'ISOBUTANE';`, `let currentPieceType = 'CYCLOBUTANE';`],
    [ONE, `? s.currentPieceType : 'BUTANE'`, `? s.currentPieceType : 'CYCLOBUTANE'`],
    [ONE, '登場アルカン', '登場シクロアルカン'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`シクロアルカンは炭素骨格が環を含む。リング状の碁クロは内側に穴を残すことがある。CYCLOGO では全7種が登場します。`],
    [ONE, `// 3. アルカン分子 (ピース) 定義`, `// 3. シクロアルカン分子 (ピース) 定義`],
    [ONE, `        // アルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // すべて4原子以上なので「4マス未満の窒息領域」ルールがそのまま機能する。`,
`        // シクロアルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // リング状分子は内側に空点を残すが、そこは窒息領域なら呼吸点にならない。`],
    [ONE, INFO_ALGO,
`            シクロアルカン「碁クロ」を配置し合う変則囲碁<br>
            PC: クリックで配置 / 回転=Rキー・右クリック・ホイール / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定 (回転・ホールドはボタン)`],
    [ALL, '碁カン', '碁クロ'],
], 'cyclogo'));

// ============================================================
// 19. ALKENEGO (アルケン碁) — 剛直な不飽和分子 (回転不可)
// ============================================================
const ALKENE_MOLECULES = `        const MOLECULES = {
            BUTENE:      { name: '1-ブテン',       iupac: 'ブト-1-エン',               formula: 'C₄H₈',  atoms: [[0,0],[1,0],[1,1],[2,1]], db: [[0,1]] },
            BUTADIENE:   { name: '1,3-ブタジエン', iupac: 'ブタ-1,3-ジエン',           formula: 'C₄H₆',  atoms: [[0,0],[0,1],[0,2],[1,2]], db: [[0,1],[2,3]] },
            ISOBUTENE:   { name: 'イソブテン',     iupac: '2-メチルプロペン',          formula: 'C₄H₈',  atoms: [[1,0],[0,1],[1,1],[2,1]], db: [[2,3]] },
            BUTYNE:      { name: '2-ブチン',       iupac: 'ブト-2-イン',               formula: 'C₄H₆',  atoms: [[0,0],[1,0],[2,0],[3,0]], db: [[1,2]] },
            PENTENE:     { name: '1-ペンテン',     iupac: 'ペント-1-エン',             formula: 'C₅H₁₀', atoms: [[0,0],[1,0],[1,1],[2,1],[2,2]], db: [[0,1]] },
            PENTYNE:     { name: '2-ペンチン',     iupac: 'ペント-2-イン',             formula: 'C₅H₈',  atoms: [[0,0],[1,0],[2,0],[3,0],[4,0]], db: [[1,2]] },
            ISOPRENE:    { name: 'イソプレン',     iupac: '2-メチル-1,3-ブタジエン',   formula: 'C₅H₈',  atoms: [[1,0],[0,1],[1,1],[2,1],[1,2]], db: [[0,2],[2,3]] }
        };`;

let alk = apply(ALGO, [
    ...rb('ALKENEGO', 'アルケン碁', 'alkenego'),
    [ONE, RV_ALGO, rv([
        'このゲームで使う碁ケンはアルケン・アルキン7種 (二重・三重結合を含む不飽和分子)。',
        '多重結合は剛直のため碁ケンは回転できない (全分子1向き固定)。二重線が多重結合。',
    ])],
    [ONE, '登場アルカン', '登場アルケン・アルキン'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`アルケン・アルキンは二重・三重結合を持つ不飽和炭化水素。結合が剛直なため盤上で回転できません。全7種が登場します。`],
    [ONE, `// 3. アルカン分子 (ピース) 定義`, `// 3. 不飽和炭化水素 (アルケン/アルキン) 定義`],
    [ONE, `        // アルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // すべて4原子以上なので「4マス未満の窒息領域」ルールがそのまま機能する。`,
`        // 不飽和炭化水素の骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // 二重/三重結合 (db) は剛直: 分子は回転できない。`],
    [ONE, MOLECULES_ALGO, ALKENE_MOLECULES],
    [ONE, `        // 各分子の回転バリエーションを事前生成 (重複排除)
        ${OCNT_ALGO}
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
`        // 二重・三重結合は剛直: 分子は回転できず基準形のみ (各1パターン)
        const ORIENTATIONS = {};
        PIECE_TYPES.forEach(type => {
            ORIENTATIONS[type] = [normalizeCells(PIECE_DEFS[type])];
        });

        // 各分子の二重/三重結合 (原子ペア、正規化座標系)
        const DBONDS = {};
        PIECE_TYPES.forEach(type => {
            const m = MOLECULES[type];
            const minX = Math.min(...m.atoms.map(c => c[0]));
            const minY = Math.min(...m.atoms.map(c => c[1]));
            DBONDS[type] = (m.db || []).map(([a, b]) =>
                [[m.atoms[a][0] - minX, m.atoms[a][1] - minY],
                 [m.atoms[b][0] - minX, m.atoms[b][1] - minY]]);
        });`],
    [ONE, `let currentPieceType = 'ISOBUTANE';`, `let currentPieceType = 'BUTENE';`],
    [ONE, `? s.currentPieceType : 'BUTANE'`, `? s.currentPieceType : 'BUTENE'`],
    [ONE, '⟳ 回転', '⟳ 回転不可'],
    [ONE, INFO_ALGO,
`            アルケン・アルキン「碁ケン」を配置し合う変則囲碁 (回転不可)<br>
            PC: クリックで配置 / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定<br>
            ※剛直な多重結合のため碁ケンは向きを変えられません`],
    [ALL, '碁カン', '碁ケン'],
    // 回転ボタン無効化 (起動時)
    [ONE, `        window.onload = () => {
            buildThemeList();`,
`        window.onload = () => {
            // 不飽和分子は回転不可
            btnRotate.disabled = true;
            btnRotate.classList.add('opacity-40', 'cursor-not-allowed');
            buildThemeList();`],
], 'alkenego');

// 二重結合描画: drawMiniPiece の結合ループを多重結合対応に差し替え
alk = apply(alk, [
    [ONE, `            // C-C 結合
            c.strokeStyle = shiftColor(fill, -0.15);
            c.lineWidth = s * 0.28;
            c.lineCap = 'round';
            c.beginPath();
            shape.forEach(([px, py]) => {
                [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                    if (set.has((px + dx) + ',' + (py + dy))) {
                        c.moveTo(ox + px * s, oy + py * s);
                        c.lineTo(ox + (px + dx) * s, oy + (py + dy) * s);
                    }
                });
            });
            c.stroke();`,
`            // 結合 (二重・三重結合は2本線で描画)
            const dbPairs = DBONDS[type] || [];
            const isDb = (x1, y1, x2, y2) => dbPairs.some(p =>
                (p[0][0] === x1 && p[0][1] === y1 && p[1][0] === x2 && p[1][1] === y2) ||
                (p[0][0] === x2 && p[0][1] === y2 && p[1][0] === x1 && p[1][1] === y1));
            c.strokeStyle = shiftColor(fill, -0.15);
            c.lineCap = 'round';
            // 単結合
            c.lineWidth = s * 0.28;
            c.beginPath();
            shape.forEach(([px, py]) => {
                [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                    if (set.has((px + dx) + ',' + (py + dy)) && !isDb(px, py, px + dx, py + dy)) {
                        c.moveTo(ox + px * s, oy + py * s);
                        c.lineTo(ox + (px + dx) * s, oy + (py + dy) * s);
                    }
                });
            });
            c.stroke();
            // 多重結合 (平行2本線)
            c.lineWidth = s * 0.12;
            c.beginPath();
            shape.forEach(([px, py]) => {
                [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                    if (set.has((px + dx) + ',' + (py + dy)) && isDb(px, py, px + dx, py + dy)) {
                        const off = s * 0.11;
                        const ox2 = dx === 0 ? off : 0, oy2 = dy === 0 ? off : 0;
                        c.moveTo(ox + px * s - ox2, oy + py * s - oy2);
                        c.lineTo(ox + (px + dx) * s - ox2, oy + (py + dy) * s - oy2);
                        c.moveTo(ox + px * s + ox2, oy + py * s + oy2);
                        c.lineTo(ox + (px + dx) * s + ox2, oy + (py + dy) * s + oy2);
                    }
                });
            });
            c.stroke();`],
], 'alkenego-render');
out('alkenego.html', alk);

// ============================================================
// 20. POLYGO (ポリ碁) — 自由に曲がるポリマー鎖を毎手描く
// ============================================================
let poly = apply(ALGO, [
    ...rb('POLYGO', 'ポリ碁', 'polygo'),
    [ONE, RV_ALGO, rv([
        '毎手、盤上に4連のポリマー鎖を自由に描いて置く (形は固定ではない)。',
        '鎖は隣接する空点にのみ伸ばせる。完成した鎖上をタップするか「配置する」で確定。',
        '窒息領域: 4マス未満の空領域は呼吸点にも地にもならない。',
    ])],
    [ONE, RC_ALGO, rc([
        '鎖の構築: タップ/クリックで隣接する空点にモノマーを追加 (4連で完成)。',
        '確定: 完成した鎖の上をタップ、または「配置する」ボタン。',
        '1マス戻す: 右クリック・Rキー・「↩ 1マス戻す」ボタン。鎖の途中をタップするとそこまで切り戻せる。',
    ])],
    [ONE, INFO_ALGO,
`            ポリマー鎖を自由に描く変則囲碁<br>
            タップ/クリックでモノマーを追加し、4連のポリマー鎖を構築 (隣接する空点にのみ伸ばせます)<br>
            完成した鎖の上をタップ or 「配置する」で確定。末尾を戻す=右クリック・Rキー・「↩ 1マス戻す」`],
    // ピース定義 → モノマー鎖
    [ONE, `        // アルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // すべて4原子以上なので「4マス未満の窒息領域」ルールがそのまま機能する。
        const MOLECULES = {
            BUTANE:         { name: 'ブタン',            iupac: 'n-ブタン',             formula: 'C₄H₁₀', atoms: [[0,0],[1,0],[1,1],[2,1]] },
            ISOBUTANE:      { name: 'イソブタン',         iupac: '2-メチルプロパン',     formula: 'C₄H₁₀', atoms: [[1,0],[0,1],[1,1],[2,1]] },
            PENTANE:        { name: 'ペンタン',           iupac: 'n-ペンタン',           formula: 'C₅H₁₂', atoms: [[0,0],[1,0],[2,0],[3,0],[4,0]] },
            ISOPENTANE:     { name: 'イソペンタン',       iupac: '2-メチルブタン',       formula: 'C₅H₁₂', atoms: [[0,0],[1,0],[2,0],[3,0],[1,1]] },
            NEOPENTANE:     { name: 'ネオペンタン',       iupac: '2,2-ジメチルプロパン', formula: 'C₅H₁₂', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2]] },
            HEXANE:         { name: 'ヘキサン',           iupac: 'n-ヘキサン',           formula: 'C₆H₁₄', atoms: [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]] },
            NEOHEXANE:      { name: 'ネオヘキサン',       iupac: '2,2-ジメチルブタン',   formula: 'C₆H₁₄', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]] }
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
        // 窒息領域のしきい値はモノマー数と同じ4
        const PIECE_SIZE = 4;
        const MONOMERS = 4;`],
    [ONE, `        // 各分子の回転バリエーションを事前生成 (重複排除)
        ${OCNT_ALGO}
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
    [ONE, `let currentPieceType = 'ISOBUTANE';`, `let currentPieceType = 'POLY';`],
    [ONE, `? s.currentPieceType : 'BUTANE'`, `? s.currentPieceType : 'POLY'`],
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
    [ONE, TRAY_UI_ALGO,
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
                    } else {
                        chainCells = [{ x: gx, y: gy }]; // 非隣接なら新しい鎖を開始
                    }
                } else {
                    chainCells = [{ x: gx, y: gy }]; // 完成済みなら新しい鎖を開始
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
], 'polygo');
out('polygo.html', poly);

// ============================================================
// 21. ASYMGO (非対称碁) — 黒=直鎖アルカン / 白=分枝アルカン
// ============================================================
let asym = apply(ALGO, [
    ...rb('ASYMGO', '非対称碁', 'asymgo'),
    [ONE, RV_ALGO, rv([
        '非対称ルール: 使える碁カンがプレイヤーで違う。',
        '黒=直鎖アルカン (ブタン・ペンタン・ヘキサン) / 白=分枝アルカン (イソブタン・イソペンタン・ネオペンタン・ネオヘキサン)。',
        '供給は各プレイヤー自分のセットから1巡バッグ。自由選択モードでも自軍の種類のみ選べる。',
    ])],
    [ONE, INFO_ALGO,
`            アルカン分子「碁カン」を配置し合う変則囲碁 (非対称)<br>
            PC: クリックで配置 / 回転=Rキー・右クリック・ホイール / ホールド=Hキー<br>
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
], 'asymgo');
out('asymgo.html', asym);

// ============================================================
// 22. DRAFTGO (ドラフト碁) — 対局前にピースを交互ドラフト
// ============================================================
let draft = apply(ALGO, [
    ...rb('DRAFTGO', 'ドラフト碁', 'draftgo'),
    [ONE, RV_ALGO, rv([
        '対局前にドラフト: 7種の碁カンから黒→白の順に交互に3種ずつピック。',
        '対局中は各プレイヤーが獲得した3種のみが供給される (自軍バッグ1巡)。',
    ])],
    [ONE, INFO_ALGO,
`            アルカン分子「碁カン」を配置し合う変則囲碁 (ドラフト制)<br>
            PC: クリックで配置 / 回転=Rキー・右クリック・ホイール / ホールド=Hキー<br>
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
            if (draftState.picks[1].length >= DRAFT_PICKS && draftState.picks[2].length >= DRAFT_PICKS) {
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
            draftLabel.textContent = \`ドラフト: \${p === 1 ? '黒' : '白'}の選択 (\${draftState.picks[p].length}/\${DRAFT_PICKS})\`;
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
], 'draftgo');
out('draftgo.html', draft);

// ============================================================
// ==== 第2バッチ: 追加10派生 (すべて通常碁石 + 特殊ルール) ====
// ============================================================

// 23. REVERSEGO (反転碁) — ハサミで敵石が自分の色に寝返る
out('reversego.html', apply(ALGO, [
    ...rb('REVERSEGO', '反転碁', 'reversego'),
    [ONE, RV_ALGO, rv([
        '反転ルール: 着手後、自分の石で上下か左右に一直線に挟まれた敵石は取られず、自分の色に寝返る。',
        '通常の取り (呼吸点0の連) も同時に有効。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 反転ルール<br>
            ※敵石を上下/左右に挟むと取らずに自分の色へ寝返る`],
    [ONE, `            // ネクストモードでは次のピースを供給`,
`            // 反転ルール: 上下または左右に挟まれた敵石は取らず自分の色に寝返る
            {
                const flipped = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== opponent) continue;
                    const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                    const l = sx > 0 ? board[i - 1] : -1;
                    const r = sx < BOARD_SIZE - 1 ? board[i + 1] : -1;
                    const u = sy > 0 ? board[i - BOARD_SIZE] : -1;
                    const d = sy < BOARD_SIZE - 1 ? board[i + BOARD_SIZE] : -1;
                    if ((l === player && r === player) || (u === player && d === player)) flipped.push(i);
                }
                if (flipped.length > 0) {
                    flipped.forEach(i => { board[i] = player; });
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            }

            // ネクストモードでは次のピースを供給`],
    ...STONE_SPEC,
], 'reversego'));

// 24. PUSHGO (押し碁) — 着手で隣接する敵石を1マス押す
out('pushgo.html', apply(ALGO, [
    ...rb('PUSHGO', '押し碁', 'pushgo'),
    [ONE, RV_ALGO, rv([
        '押しルール: 置いた石に隣接する敵石は、その方向へ1マス押される。',
        '押し先が盤外または占有されている場合は押せない。押された後の取り判定は通常通り行われる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 押しルール<br>
            ※置いた石に隣接する敵石は1マス押される (押し先が空の場合のみ)`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 押しルール: 置いた石に隣接する敵石を遠方へ1マス押す
            {
                const opp2 = player === 1 ? 2 : 1;
                move.cells.forEach(p => {
                    const pi = p.y * BOARD_SIZE + p.x;
                    getNeighbors(pi).forEach(ni => {
                        if (board[ni] !== opp2) return;
                        const nx = ni % BOARD_SIZE, ny = Math.floor(ni / BOARD_SIZE);
                        const tx = nx + (nx - p.x), ty = ny + (ny - p.y);
                        if (tx < 0 || tx >= BOARD_SIZE || ty < 0 || ty >= BOARD_SIZE) return;
                        const ti = ty * BOARD_SIZE + tx;
                        if (board[ti] !== 0) return;
                        board[ti] = opp2; board[ni] = 0;
                    });
                });
                cleanUpPieces();
            }`],
    ...STONE_SPEC,
], 'pushgo'));

// 25. ATTRACTGO (吸引碁) — 直線2マス先の敵石を引き寄せる
out('attractgo.html', apply(ALGO, [
    ...rb('ATTRACTGO', '吸引碁', 'attractgo'),
    [ONE, RV_ALGO, rv([
        '吸引ルール: 置いた石の直線2マス先にいる敵石は、間のマスが空いていれば1マス引き寄せられる。',
        '引き寄せられた後の取り判定は通常通り行われる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 吸引ルール<br>
            ※置いた石は直線2マス先の敵石を1マス引き寄せる`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 吸引ルール: 置いた石の直線2マス先にいる敵石を1マス引き寄せる
            {
                const opp2 = player === 1 ? 2 : 1;
                move.cells.forEach(p => {
                    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                        const ax = p.x + dx, ay = p.y + dy;
                        const bx = p.x + dx * 2, by = p.y + dy * 2;
                        if (bx < 0 || bx >= BOARD_SIZE || by < 0 || by >= BOARD_SIZE) return;
                        if (ax < 0 || ax >= BOARD_SIZE || ay < 0 || ay >= BOARD_SIZE) return;
                        const ai = ay * BOARD_SIZE + ax, bi = by * BOARD_SIZE + bx;
                        if (board[bi] === opp2 && board[ai] === 0) {
                            board[ai] = opp2; board[bi] = 0;
                        }
                    });
                });
                cleanUpPieces();
            }`],
    ...STONE_SPEC,
], 'attractgo'));

// 26. TURNGO (回転碁) — 着手ごとに盤面が90°回転
out('turngo.html', apply(ALGO, [
    ...rb('TURNGO', '回転碁', 'turngo'),
    [ONE, RV_ALGO, rv([
        '回転ルール: 着手のたびに盤面全体が90°時計回りに回転する (石もすべて回転)。',
        '取り・呼吸点は回転後の盤面で判定される。コウ判定の盤面も回転に追従する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 回転ルール<br>
            ※着手のたびに盤面全体が90°時計回りに回転する`],
    [ONE, `            // ネクストモードでは次のピースを供給`,
`            // 回転ルール: 着手ごとに盤面全体を90°時計回りに回転
            {
                const nb = new Array(board.length).fill(0);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++)
                    nb[x * BOARD_SIZE + (BOARD_SIZE - 1 - y)] = board[y * BOARD_SIZE + x];
                board = nb;
                const rotP = p => ({ x: BOARD_SIZE - 1 - p.y, y: p.x });
                pieces.forEach(pc => { pc.cells = pc.cells.map(rotP); });
                if (lastMove) lastMove.cells = lastMove.cells.map(rotP);
                if (prevBoard) {
                    const pb = new Array(prevBoard.length).fill(0);
                    for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++)
                        pb[x * BOARD_SIZE + (BOARD_SIZE - 1 - y)] = prevBoard[y * BOARD_SIZE + x];
                    prevBoard = pb;
                }
            }

            // ネクストモードでは次のピースを供給`],
    ...STONE_SPEC,
], 'turngo'));

// NOGO/LIMITGO 共通: 合法手スキャン + 手詰み即敗北
const ANY_VALID_FN = `
        // 合法手スキャン: 手番側に1つでも置ける点があれば true
        function anyValidMove(player) {
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                if (isValidPlacement([{ x, y }], player)) return true;
            }
            return false;
        }
`;
const STALEMATE_CHECK = `            // 詰み判定: 手番側に合法手がなければ敗北
            if (gamePhase === 'playing' && !gameOver && !anyValidMove(turn)) {
                winByRule(turn === 1 ? 2 : 1, '手詰み', '合法手がありません');
            }
`;

// 27. NOGO (禁取碁) — 取る手は禁止、詰んだら負け
out('nogo.html', apply(ALGO, [
    ...rb('NOGO', '禁取碁', 'nogo'),
    [ONE, RV_ALGO, rv([
        '禁取ルール: 相手の石を取る手 (着手の結果相手の連の呼吸点が0になる手) は置けない。',
        '自殺手も禁止。盤が埋まり合法手がなくなった側が敗北する (パス2連続の地集計も有効)。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 禁取ルール<br>
            ※相手石を取る手は置けない。合法手がなくなった側が負け`],
    // 禁取: 取れる手は禁止
    [ONE, `            const captured = getCapturedStones(tempBoard, opponent);`,
`            const captured = getCapturedStones(tempBoard, opponent);
            if (captured.length > 0) return false; // 禁取: 相手石を取る手は置けない`],
    [ONE, `        function isValidPlacement(cells, player) {`, ANY_VALID_FN + `
        function isValidPlacement(cells, player) {`],
    [ONE, `        function updateUI() {`, `        function updateUI() {
${STALEMATE_CHECK}`],
    [ONE, `        function endGameByScore() {`, WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    ...STONE_SPEC,
], 'nogo'));

// 28. LIMITGO (詰み碁) — 合法手がなくなった側が即負け
out('limitgo.html', apply(ALGO, [
    ...rb('LIMITGO', '詰み碁', 'limitgo'),
    [ONE, RV_ALGO, rv([
        '詰みルール: 合法手が1つもなくなった手番側はその場で敗北する。',
        '通常の取り・自殺禁止・地集計もすべて有効。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 詰みルール<br>
            ※置ける場所がなくなった側が即負け`],
    [ONE, `        function isValidPlacement(cells, player) {`, ANY_VALID_FN + `
        function isValidPlacement(cells, player) {`],
    [ONE, `        function updateUI() {`, `        function updateUI() {
${STALEMATE_CHECK}`],
    [ONE, `        function endGameByScore() {`, WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    ...STONE_SPEC,
], 'limitgo'));

// 29. GROWGO (増殖碁) — 着手ごとに石が空点へ増殖する
out('growgo.html', apply(ALGO, [
    ...rb('GROWGO', '増殖碁', 'growgo'),
    [ONE, RV_ALGO, rv([
        '増殖ルール: 着手ごとに、石に隣接する空点のうち約30%へ同じ色の石が増殖する。',
        '増殖で呼吸点を失った連は両色とも除去される。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 増殖ルール<br>
            ※着手ごとに石が隣の空点へランダムに増殖する`],
    [ONE, `        let history = []; // 1手戻る用: 各着手前のスナップショットのスタック`,
`        let history = []; // 1手戻る用: 各着手前のスナップショットのスタック
        const GROW_RATE = 0.30; // 増殖ルール: 空点ごとの増殖確率
        function applyGrowth() {
            const cand = [];
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) continue;
                const adj = getNeighbors(i).filter(n => board[n] !== 0);
                if (adj.length) cand.push([i, adj]);
            }
            for (let i = cand.length - 1; i > 0; i--) {
                const j = (Math.random() * (i + 1)) | 0;
                [cand[i], cand[j]] = [cand[j], cand[i]];
            }
            const used = new Set();
            cand.forEach(([i, adj]) => {
                if (used.has(i) || Math.random() > GROW_RATE) return;
                const s = adj[(Math.random() * adj.length) | 0];
                board[i] = board[s]; used.add(i);
            });
            // 増殖で呼吸点を失った連を除去
            [1, 2].forEach(pl => getCapturedStones(board, pl).forEach(i => { board[i] = 0; }));
            cleanUpPieces();
        }`],
    [ONE, `            // ネクストモードでは次のピースを供給`,
`            // 増殖処理
            applyGrowth();

            // ネクストモードでは次のピースを供給`],
    ...STONE_SPEC,
], 'growgo'));

// 30. MOLEGO (もぐら碁) — 石がランダムに隣へ移動する
out('molego.html', apply(ALGO, [
    ...rb('MOLEGO', 'もぐら碁', 'molego'),
    [ONE, RV_ALGO, rv([
        'もぐらルール: 着手ごとに盤上の各碁石が約18%の確率で隣の空点へ移動する。',
        '移動はランダム。移動で空いた点・新しい接続は通常ルールどおり機能する。',
    ])],
    [ONE, INFO_ALGO,
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
                if (board[i] === 0 || Math.random() > MOL_RATE) return;
                const empty = getNeighbors(i).filter(n => board[n] === 0);
                if (!empty.length) return;
                const dst = empty[(Math.random() * empty.length) | 0];
                board[dst] = board[i]; board[i] = 0;
            });
            cleanUpPieces();
        }`],
    [ONE, `            // ネクストモードでは次のピースを供給`,
`            // もぐら処理: 各碁石が確率で隣へ移動
            applyMole();

            // ネクストモードでは次のピースを供給`],
    ...STONE_SPEC,
], 'molego'));

// 31. BLASTGO (爆撃碁) — 隣接する敵石の連を無条件破壊
out('blastgo.html', apply(ALGO, [
    ...rb('BLASTGO', '爆撃碁', 'blastgo'),
    [ONE, RV_ALGO, rv([
        '爆撃ルール: 置いた石に隣接する敵石の「連」は呼吸点に関係なくすべて破壊・取られる。',
        '通常の取り判定も有効。爆撃で取った石もアゲハマに数えられる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 爆撃ルール<br>
            ※置いた石に隣接する敵石の連をすべて破壊する`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 爆撃ルール: 置いた石に隣接する敵の連を呼吸点に関係なく破壊
            {
                const opp2 = player === 1 ? 2 : 1;
                const blasted = new Set();
                move.cells.forEach(p => {
                    getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => {
                        if (board[n] === opp2) {
                            getConnectedGroup(n, opp2).forEach(i => blasted.add(i));
                        }
                    });
                });
                if (blasted.size > 0) {
                    blasted.forEach(i => { board[i] = 0; });
                    captures[player] += blasted.size;
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            }`],
    ...STONE_SPEC,
], 'blastgo'));

// 32. HANDIGO (置碁) — ハンデ置碁 (2〜9子の事前配置)
out('handigo.html', apply(ALGO, [
    ...rb('HANDIGO', '置碁', 'handigo'),
    [ONE, RV_ALGO, rv([
        '置碁: 対局開始時に黒石をハンデ数だけ事前配置する (設定で なし/2/4/6/9 子)。',
        '置碁ありの場合はコミは0.5目になる (実質ハンデなし互先=コミ6.5)。',
    ])],
    [ONE, INFO_ALGO,
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
], 'handigo'));

// ============================================================
// ==== 第3バッチ: 追加10派生 ====
// ============================================================

// 盤サイズを 9/13/19 路へ (STONE_SPEC抜きのピース系バリアント用)
const SIZE_91319 = [
    [ONE, SIZE_BTNS, SIZE_BTNS_91319],
    [ONE, `![13, 19, 25].includes(s.boardSize)`, `![9, 13, 19].includes(s.boardSize)`],
    [ONE, STARS_ALGO, STARS_GENERIC],
];

// 壁マス機構の共通3置換 (壁描画/フォールバック除外/死に石選択ガード)
const WALL_DRAW = `            const covered = new Set(); // ピース描画でカバー済みのマス

            // 壁マスの描画 (中立ブロック)
            for (let wy = 0; wy < BOARD_SIZE; wy++) {
                for (let wx = 0; wx < BOARD_SIZE; wx++) {
                    if (board[wy * BOARD_SIZE + wx] !== 3) continue;
                    const bx = padding + wx * cellSize;
                    const by = padding + wy * cellSize;
                    const bs = cellSize * 0.52;
                    ctx.fillStyle = 'rgba(60, 42, 25, 0.85)';
                    ctx.fillRect(bx - bs / 2, by - bs / 2, bs, bs);
                    ctx.strokeStyle = 'rgba(30, 20, 10, 0.9)';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(bx - bs / 2, by - bs / 2, bs, bs);
                }
            }`;
const WALL_SPEC = [
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`, WALL_DRAW],
    [ONE, FALLBACK_SKIP,
`                    if (val !== 1 && val !== 2) continue; // 空点・壁は石として描かない`],
    [ONE, TOGGLE_GUARD,
`            const color = board[startIdx];
            if (color === 0 || color === 3) return;`],
];

// 33. MAMEGO (豆碁) — 原作の碁豆 (ドミノ2連) を再実装
const DOMINO_MOLS = `        // 碁豆: 2連のドミノ碁石 (原作 MAMEGO のピース)
        const MOLECULES = {
            DOMINO: { name: '碁豆', iupac: 'ドミノ', formula: '2連結', atoms: [[0,0],[1,0]] }
        };`;
out('mamego.html', apply(ALGO, [
    ...rb('MAMEGO', '豆碁', 'mamego'),
    [ONE, RV_ALGO, rv([
        'このゲームで使う碁豆はドミノ (2連結) のみ。',
        '原作 MAMEGO (碁豆) の同系ルールを通常囲碁エンジン上に再実装したもの。',
    ])],
    [ONE, INFO_ALGO,
`            ドミノ「碁豆」を配置し合う変則囲碁 (原作リスペクト)<br>
            PC: クリックで配置 / 回転=Rキー・右クリック・ホイール / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
    [ONE, MOLECULES_ALGO, DOMINO_MOLS],
    [ONE, OCNT_ALGO, '// 碁豆: 縦/横 = 2パターン'],
    [ONE, `let currentPieceType = 'ISOBUTANE';`, `let currentPieceType = 'DOMINO';`],
    [ONE, `? s.currentPieceType : 'BUTANE'`, `? s.currentPieceType : 'DOMINO'`],
    [ONE, '登場アルカン', '登場碁豆'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`碁豆は2連のドミノ形のみ。孤立した1マスの空領域は窒息領域になります。`],
    ...SIZE_91319,
    [ALL, '碁カン', '碁豆'],
    [ALL, '全7種1巡', '補充なし'],
], 'mamego'));

// 34. TRIOGO (トリオ碁) — トリオミノ (3連結: I/L) のみ
const TRIO_MOLS = `        // トリオミノ: 3連結の形2種 (直鎖 / L字)
        const MOLECULES = {
            TRI_I: { name: 'Iトリオミノ', iupac: '直鎖3', formula: '3連結', atoms: [[0,0],[1,0],[2,0]] },
            TRI_L: { name: 'Lトリオミノ', iupac: 'L字3', formula: '3連結', atoms: [[0,0],[0,1],[1,1]] }
        };`;
out('triogo.html', apply(ALGO, [
    ...rb('TRIOGO', 'トリオ碁', 'triogo'),
    [ONE, RV_ALGO, rv([
        'このゲームで使う碁リオはトリオミノ2種 (直鎖I / 曲がりL、いずれも3連結)。',
    ])],
    [ONE, INFO_ALGO,
`            トリオミノ「碁リオ」を配置し合う変則囲碁<br>
            PC: クリックで配置 / 回転=Rキー・右クリック・ホイール / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
    [ONE, MOLECULES_ALGO, TRIO_MOLS],
    [ONE, OCNT_ALGO, '// I:2 / L:4 = 計6パターン'],
    [ONE, `let currentPieceType = 'ISOBUTANE';`, `let currentPieceType = 'TRI_I';`],
    [ONE, `? s.currentPieceType : 'BUTANE'`, `? s.currentPieceType : 'TRI_I'`],
    [ONE, '登場アルカン', '登場トリオミノ'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`トリオミノは碁石3個の連結形 (直鎖とL字の2種)。3マス未満の窒息領域には入りません。`],
    ...SIZE_91319,
    [ALL, '碁カン', '碁リオ'],
    [ALL, '全7種1巡', '全2種1巡'],
    [ALL, '7種1巡', '2種1巡'],
], 'triogo'));

// 35. KOGO (孤立碁) — 自分の石に隣接して置けない
out('kogo.html', apply(ALGO, [
    ...rb('KOGO', '孤立碁', 'kogo'),
    [ONE, RV_ALGO, rv([
        '孤立ルール: 自分の石に隣接する空点には置けない。自連は一切作れず、全石が単独のまま。',
        '取り・呼吸点・自殺禁止・コウは通常通り。単石は最大4呼吸点しか持てないため脆い。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 孤立ルール<br>
            ※自分の石に隣接する点には置けない (全石が孤立単石)`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 孤立ルール: 自分の石に隣接する点には置けない
            if (cells.some(p =>
                getNeighbors(p.y * BOARD_SIZE + p.x).some(n => board[n] === player))) return false;`],
    ...STONE_SPEC,
], 'kogo'));

// 36. RINGO (環状碁) — 中央3×3が壁のドーナツ盤
out('ringo.html', apply(ALGO, [
    ...rb('RINGO', '環状碁', 'ringo'),
    [ONE, RV_ALGO, rv([
        '盤の中央3×3が壁 (使用不能領域) のドーナツ状盤面。',
        '壁は石を置けず、呼吸点にも地にもならない。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 環状盤<br>
            ※中央3×3が壁。壁は置けず呼吸点にも地にもならない`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 環状盤: 中央3x3を壁にする
            const c0 = Math.floor(BOARD_SIZE / 2);
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
                board[(c0 + dy) * BOARD_SIZE + (c0 + dx)] = 3;`],
    ...WALL_SPEC,
    ...STONE_SPEC,
], 'ringo'));

// 37. CROSSGO (十字碁) — 四隅が壁の十字盤
out('crossgo.html', apply(ALGO, [
    ...rb('CROSSGO', '十字碁', 'crossgo'),
    [ONE, RV_ALGO, rv([
        '四隅が壁で削られた十字形の盤面 (隅は盤面の約1/3)。',
        '壁は石を置けず、呼吸点にも地にもならない。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 十字盤<br>
            ※四隅が壁の十字形盤面。壁は置けず呼吸点にも地にもならない`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 十字盤: 四隅を壁にする
            const cs = Math.max(2, Math.floor(BOARD_SIZE / 3));
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if ((x < cs || x >= BOARD_SIZE - cs) && (y < cs || y >= BOARD_SIZE - cs))
                    board[y * BOARD_SIZE + x] = 3;
            }`],
    ...WALL_SPEC,
    ...STONE_SPEC,
], 'crossgo'));

// 38. LIVEGO (活石碁) — 地ではなく盤上の石数で勝負
out('livego.html', apply(ALGO, [
    ...rb('LIVEGO', '活石碁', 'livego'),
    [ONE, RV_ALGO, rv([
        '得点は「地」ではなく盤上に残った自分の石の数。アゲハマも加算 (生き石+アゲハマ+コミ)。',
        '石を多く生き残らせることがそのまま得点になる。地の囲い込みは意味を持たない。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 活石得点<br>
            ※得点=盤上の自分の石数+アゲハマ (地は数えない)`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackStones = board.filter(v => v === 1).length;
            const whiteStones = board.filter(v => v === 2).length;
            const blackTotal = blackStones + captures[1];
            const whiteTotal = whiteStones + captures[2] + komi;`],
    [ONE, `<div class="flex justify-between"><span>黒の地:</span> <strong>\${territory.black}</strong></div>`,
          `<div class="flex justify-between"><span>黒の生き石:</span> <strong>\${blackStones}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白の地:</span> <strong>\${territory.white}</strong></div>`,
          `<div class="flex justify-between"><span>白の生き石:</span> <strong>\${whiteStones}</strong></div>`],
    ...STONE_SPEC,
], 'livego'));

// 39. FUSEGO (融合碁) — 隣接する敵石が中立ブロックに変化
out('fusego.html', apply(ALGO, [
    ...rb('FUSEGO', '融合碁', 'fusego'),
    [ONE, RV_ALGO, rv([
        '融合ルール: 置いた石に隣接する敵石は「中和」されて中立ブロック (壁) に変わる。',
        '中和された石はアゲハマにならず、そのマスは以後使えない。通常の取り判定も有効。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 融合ルール<br>
            ※置いた石に隣接する敵石は中立ブロックに変わる (アゲハマにならない)`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 融合ルール: 置いた石に隣接する敵石を中立ブロック(壁)に変える
            {
                const opp2 = player === 1 ? 2 : 1;
                const fused = [];
                move.cells.forEach(p => {
                    getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => {
                        if (board[n] === opp2) fused.push(n);
                    });
                });
                fused.forEach(i => { board[i] = 3; });
                if (fused.length) cleanUpPieces();
            }`],
    ...WALL_SPEC,
    ...STONE_SPEC,
], 'fusego'));

// 40. WORMGO (転送碁) — ワームホールペアが近傍をつなぐ
out('wormgo.html', apply(ALGO, [
    ...rb('WORMGO', '転送碁', 'wormgo'),
    [ONE, RV_ALGO, rv([
        '転送ルール: 盤上にランダムなワームホールペア (◎マーク) が2組ある。',
        'ワームホール端点同士は近傍としてつながる (連・呼吸点・取りが遠隔で成立)。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 転送ルール<br>
            ※盤上のワームホールペア (◎) 同士が近傍としてつながる`],
    [ONE, BOARD_DECL,
`${BOARD_DECL}
        let WORMHOLES = []; // [[idxA,idxB], ...] ワームホールペア (遠隔近傍)`],
    [ONE, NBRS_GRID,
`        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            // ワームホール: ペア端点同士が近傍
            WORMHOLES.forEach(([a, b]) => {
                if (a === idx) neighbors.push(b);
                else if (b === idx) neighbors.push(a);
            });

            return neighbors;
        }

        // ワームホールペアをランダム生成 (2組=4点)
        function buildWormholes() {
            const n = BOARD_SIZE * BOARD_SIZE;
            const cells = [...Array(n).keys()];
            const pick = () => cells.splice((Math.random() * cells.length) | 0, 1)[0];
            WORMHOLES = [[pick(), pick()], [pick(), pick()]];
        }`],
    // ワームホール端点の描画 (◎マーク)
    [ONE, `            // 星 (天元・星の点)
            const starPoints = getStarPoints(BOARD_SIZE);`,
`            // ワームホール端点の描画 (紫の◎ペア)
            ctx.strokeStyle = '#8b5cf6';
            WORMHOLES.forEach(([a, b]) => {
                [a, b].forEach(i => {
                    const wx = padding + (i % BOARD_SIZE) * cellSize;
                    const wy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(wx, wy, cellSize * 0.30, 0, Math.PI * 2); ctx.stroke();
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(wx, wy, cellSize * 0.10, 0, Math.PI * 2); ctx.stroke();
                });
            });

            // 星 (天元・星の点)
            const starPoints = getStarPoints(BOARD_SIZE);`],
    // 生成・永続化・同期
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            buildWormholes();`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    wormholes: WORMHOLES,
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            WORMHOLES = Array.isArray(s.wormholes) ? s.wormholes : [];
            if (!WORMHOLES.length) buildWormholes();`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                wormholes: WORMHOLES,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (Array.isArray(data.wormholes)) WORMHOLES = data.wormholes;`],
    ...STONE_SPEC,
], 'wormgo'));

// 41. GRAVEGO (墓標碁) — 取られたマスが壁になる
out('gravego.html', apply(ALGO, [
    ...rb('GRAVEGO', '墓標碁', 'gravego'),
    [ONE, RV_ALGO, rv([
        '墓標ルール: 取られた石のマスは空点に戻らず「墓標」(壁) になる。',
        '墓標は石を置けず、呼吸点にも地にもならない。盤面は徐々に狭くなる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 墓標ルール<br>
            ※取られたマスは空点に戻らず壁になる。盤面は次第に狭くなる`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 墓標ルール: 取られたマスは壁(墓標)になり、空点に戻らない
                captured.forEach(idx => board[idx] = 3);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    ...WALL_SPEC,
    ...STONE_SPEC,
], 'gravego'));

// 42. REAPGO (連取碁) — 取ったらもう1手打てる
out('reapgo.html', apply(ALGO, [
    ...rb('REAPGO', '連取碁', 'reapgo'),
    [ONE, RV_ALGO, rv([
        '連取ルール: 着手で敵石を1個以上取った場合、同じプレイヤーがもう1手打てる (連鎖可)。',
        '取らなかった場合のみ手番が交代する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 連取ルール<br>
            ※敵石を取るともう1手打てる (連鎖可)`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            // 連取ルール: 取った場合のみ手番継続
            if (captured.length === 0) turn = opponent;`],
    ...STONE_SPEC,
], 'reapgo'));

// ============================================================
// ==== 第4バッチ: 追加10派生 ====
// ============================================================

// 43. QUADGO (四方碁) — 碁カク=2×2ブロックのみ
const QUAD_MOLS = `        // 碁カク: 2x2ブロックの方形碁石
        const MOLECULES = {
            QUAD: { name: '碁カク', iupac: '正方形4', formula: '4連結', atoms: [[0,0],[1,0],[0,1],[1,1]] }
        };`;
out('quadgo.html', apply(ALGO, [
    ...rb('QUADGO', '四方碁', 'quadgo'),
    [ONE, RV_ALGO, rv([
        'このゲームで使う碁カクは2×2の正方形ブロックのみ。回転しても同じ形。',
        '大きな塊は呼吸点を多く持つが、置ける場所は限られる。',
    ])],
    [ONE, INFO_ALGO,
`            2×2ブロック「碁カク」を配置し合う変則囲碁<br>
            PC: クリックで配置 / スマホ: 1タップ目プレビュー、2タップ目確定`],
    [ONE, MOLECULES_ALGO, QUAD_MOLS],
    [ONE, OCNT_ALGO, '// 碁カク: 正方形は回転不変 = 1パターン'],
    [ONE, `let currentPieceType = 'ISOBUTANE';`, `let currentPieceType = 'QUAD';`],
    [ONE, `? s.currentPieceType : 'BUTANE'`, `? s.currentPieceType : 'QUAD'`],
    [ONE, '登場アルカン', '登場碁カク'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`碁カクは2×2の正方形のみ。回転しても形は変わりません。`],
    ...SIZE_91319,
    [ALL, '碁カン', '碁カク'],
    [ALL, '全7種1巡', '補充なし'],
], 'quadgo'));

// 44. CIRCLEGO (円盤碁) — 円形盤面
out('circlego.html', apply(ALGO, [
    ...rb('CIRCLEGO', '円盤碁', 'circlego'),
    [ONE, RV_ALGO, rv([
        '盤面は円形 — 中心から半径 (N-1)/2 より外のマスは壁 (使用不能)。',
        '「隅」が存在しない盤面で戦う囲碁。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 円形盤<br>
            ※円の外側は壁。壁は置けず呼吸点にも地にもならない`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 円形盤: 半径より外を壁にする
            const crad = (BOARD_SIZE - 1) / 2;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const ddx = x - crad, ddy = y - crad;
                if (ddx * ddx + ddy * ddy > crad * crad + 0.5) board[y * BOARD_SIZE + x] = 3;
            }`],
    ...WALL_SPEC,
    ...STONE_SPEC,
], 'circlego'));

// 45. LAVAGO (溶岩碁) — 8手ごとに外周の空点が溶岩に沈む
out('lavago.html', apply(ALGO, [
    ...rb('LAVAGO', '溶岩碁', 'lavago'),
    [ONE, RV_ALGO, rv([
        '溶岩ルール: 合計8手ごとに盤の最外周リングが溶岩に沈む (空マスが壁になる)。',
        '石は残るが呼吸点を失い、呼吸点0になった連は溶岩に飲まれて相手のアゲハマになる。',
        '盤面は内側へ徐々に狭くなる。全周が沈み切ったらその時点で地集計に入る。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 溶岩ルール<br>
            ※8手ごとに外周の空マスが溶岩 (壁) に沈む。盤面はどんどん狭くなる`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let lavaDepth = 0;      // 溶岩の浸食深度 (何リング目まで沈んだか)
        const LAVA_EVERY = 8;   // この手数ごとに外周リングが溶岩化`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            lavaDepth = 0;`],
    [ONE, `        function endGameByScore() {`,
`        // 溶岩: 外周リングの空マスを壁にし、呼吸点を失った連を溶かす
        function applyLava() {
            const n = BOARD_SIZE;
            if (lavaDepth >= Math.ceil(n / 2)) { endGameByScore(); return; }
            const d = lavaDepth++;
            let changed = false;
            for (let y = d; y < n - d; y++) for (let x = d; x < n - d; x++) {
                if (x !== d && x !== n - 1 - d && y !== d && y !== n - 1 - d) continue;
                const i = y * n + x;
                if (board[i] === 0) { board[i] = 3; changed = true; }
            }
            // 溶岩で呼吸点0になった連は消滅 (相手のアゲハマ)
            [1, 2].forEach(pl => {
                const dead = getCapturedStones(board, pl);
                dead.forEach(i => { board[i] = 0; });
                if (dead.length) captures[pl === 1 ? 2 : 1] += dead.length;
            });
            cleanUpPieces();
            if (lavaDepth >= Math.ceil(n / 2)) endGameByScore();
        }

        function endGameByScore() {`],
    // undo用: スナップショットにも溶岩深度を保存・復元
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                lavaDepth,
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            lavaDepth = snap.lavaDepth || 0;`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 溶岩: LAVA_EVERY手ごとに外周が沈む
            if (history.length % LAVA_EVERY === 0) applyLava();`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    lavaDepth,
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            lavaDepth = s.lavaDepth || 0;
            if (s.boardSize === BOARD_SIZE && board.every(v => v !== 3)) {
                // セーブからの復元時に溶岩壁を再構成 (壁は盤面に含まれるので素通し)
            }`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                lavaDepth,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            lavaDepth = data.lavaDepth || 0;`],
    ...WALL_SPEC,
    ...STONE_SPEC,
], 'lavago'));

// 46. HALFGO (陣地碁) — 黒は左半分、白は右半分のみ
out('halfgo.html', apply(ALGO, [
    ...rb('HALFGO', '陣地碁', 'halfgo'),
    [ONE, RV_ALGO, rv([
        '陣地ルール: 黒は盤の左半分、白は右半分にしか置けない。中央列は両者共通。',
        '敵の陣地には侵入できない — 境界線上の攻防と自陣の囲い合いが勝負。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 陣地ルール<br>
            ※黒は左半分、白は右半分のみ配置可 (中央列は共通)`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 陣地ルール: 黒は左半分、白は右半分のみ (中央列は共通)
            const hmid = Math.floor(BOARD_SIZE / 2);
            if (cells.some(p => player === 1 ? p.x > hmid : p.x < hmid)) return false;`],
    ...STONE_SPEC,
], 'halfgo'));

// 47. SPARSEGO (離散碁) — いかなる石の隣にも置けない
out('sparsego.html', apply(ALGO, [
    ...rb('SPARSEGO', '離散碁', 'sparsego'),
    [ONE, RV_ALGO, rv([
        '離散ルール: いかなる石 (敵味方問わず) に隣接する空点には置けない。',
        '全ての石は孤立し、取り合いは発生しない。地の囲い合いのみの静かな碁。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 離散ルール<br>
            ※どの石にも隣接する点には置けない (全石が孤立)`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 離散ルール: いかなる石の隣にも置けない
            if (cells.some(p =>
                getNeighbors(p.y * BOARD_SIZE + p.x).some(n => board[n] === 1 || board[n] === 2))) return false;`],
    ...STONE_SPEC,
], 'sparsego'));

// 48. FIRSTGO (一撃碁) — 最初の取りで即勝利
out('firstgo.html', apply(ALGO, [
    ...rb('FIRSTGO', '一撃碁', 'firstgo'),
    [ONE, RV_ALGO, rv([
        '一撃ルール: 最初に敵石を1個でも取った側がその場で勝利する。',
        '通常の終局 (パス2連続→地集計+コミ) も有効だが、実際は最初の取り合いで決まることが多い。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 一撃ルール<br>
            ※最初に敵石を取った側が即勝利`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        const WIN_CAPTURES = 1; // 一撃ルール: 最初の取りで即勝利`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                if (captures[player] >= WIN_CAPTURES) {
                    winByRule(player, '一撃', \`\${player === 1 ? '黒' : '白'}が最初の取りを決めました\`);
                    return;
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, `        function endGameByScore() {`, WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    ...STONE_SPEC,
], 'firstgo'));

// 49. TREASUREGO (宝碁) — 星のマスを囲むと+5点
out('treasurego.html', apply(ALGO, [
    ...rb('TREASUREGO', '宝碁', 'treasurego'),
    [ONE, RV_ALGO, rv([
        '宝ルール: 星のマス (◆印) は宝物。終局時、宝マスの全近傍が自分の石で囲まれていれば1箇所につき+5点。',
        '宝マスそのものは普通の空点として使える (置くとその宝は消える)。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 宝ルール<br>
            ※星マス (◆) を全方向囲むと終局時+5点/箇所`],
    // 宝マス描画 (星の直後)
    [ONE, `            // 星 (天元・星の点)
            const starPoints = getStarPoints(BOARD_SIZE);`,
`            // 星 (天元・星の点)
            const starPoints = getStarPoints(BOARD_SIZE);
            // 宝マス (◆) = 星の位置
            ctx.fillStyle = 'rgba(202, 138, 4, 0.95)';
            starPoints.forEach(tp => {
                const tx = tp.x, ty = tp.y;
                if (board[ty * BOARD_SIZE + tx] !== 0) return;
                const bx = padding + tx * cellSize;
                const by = padding + ty * cellSize;
                const ds = cellSize * 0.2;
                ctx.beginPath();
                ctx.moveTo(bx, by - ds); ctx.lineTo(bx + ds, by);
                ctx.lineTo(bx, by + ds); ctx.lineTo(bx - ds, by);
                ctx.closePath(); ctx.fill();
            });`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            // 宝ボーナス: 宝マスの全近傍を囲んだ側に1箇所5点
            const TREASURE_BONUS = 5;
            let blackTreasure = 0, whiteTreasure = 0;
            getStarPoints(BOARD_SIZE).forEach(tp => {
                const nb = getNeighbors(tp.y * BOARD_SIZE + tp.x).map(i => board[i]);
                if (nb.length > 0 && nb.every(v => v === 1)) blackTreasure++;
                if (nb.length > 0 && nb.every(v => v === 2)) whiteTreasure++;
            });
            const blackTotal = territory.black + captures[1] + blackTreasure * TREASURE_BONUS;
            const whiteTotal = territory.white + captures[2] + komi + whiteTreasure * TREASURE_BONUS;`],
    [ONE, `<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の宝:</span> <strong>+\${blackTreasure * TREASURE_BONUS}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の宝:</span> <strong>+\${whiteTreasure * TREASURE_BONUS}</strong></div>`],
    ...STONE_SPEC,
], 'treasurego'));

// 50. DARKGO (暗闇碁) — 自石の近く以外は敵石が見えない
out('darkgo.html', apply(ALGO, [
    ...rb('DARKGO', '暗闇碁', 'darkgo'),
    [ONE, RV_ALGO, rv([
        '暗闇ルール: 自分の石からマンハッタン距離3以内の範囲しか見えない。',
        '視野外の敵石は表示されない (配置判定や取り自体は通常通り働く)。',
        'ローカル対戦では手番側の視点、AI/オンラインでは自分の視点で描画。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 暗闇ルール<br>
            ※自分の石の近くしか見えない。敵石は霧の中`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        const FOG_RANGE = 3; // 暗闇ルール: 自石からの視界距離 (マンハッタン)`],
    [ONE, `        function drawBoardElements(padding, cellSize) {`,
`        // 暗闇: 視点となるプレイヤー色 (ローカル=手番側、AI/オンライン=自分)
        function fogViewer() {
            if (gameMode === 'online') return myOnlineRole || 1;
            if (gameMode === 'ai') return aiPlayer === 2 ? 1 : 2;
            return turn;
        }
        function isFogVisible(idx) {
            const v = fogViewer();
            const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== v) continue;
                if (Math.abs((i % BOARD_SIZE) - x) + Math.abs(((i / BOARD_SIZE) | 0) - y) <= FOG_RANGE) return true;
            }
            return false;
        }

        function drawBoardElements(padding, cellSize) {`],
    [ONE, `                const alive = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);`,
`                const alive = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player)
                    .filter(p => pc.player === fogViewer() || isFogVisible(p.y * BOARD_SIZE + p.x));`],
    [ONE, FALLBACK_SKIP,
`                    if (val === 0 || covered.has(idx)) continue;
                    if ((val === 1 || val === 2) && val !== fogViewer() && !isFogVisible(idx)) continue;`],
    [ONE, `            const alive = lastMove.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === lastMove.player);`,
`            const alive = lastMove.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === lastMove.player)
                .filter(p => lastMove.player === fogViewer() || isFogVisible(p.y * BOARD_SIZE + p.x));`],
    ...STONE_SPEC,
], 'darkgo'));

// 51. ORBITGO (周回碁) — 着手ごとに外周リングが1マス回転
out('orbitgo.html', apply(ALGO, [
    ...rb('ORBITGO', '周回碁', 'orbitgo'),
    [ONE, RV_ALGO, rv([
        '周回ルール: 着手ごとに盤の最外周リング上の石が1マスずつ時計回りに移動する。',
        '外周に置いた石はぐるぐる回り続ける。連が裂かれることもある。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 周回ルール<br>
            ※着手ごとに外周リング上の石が1マス時計回りに移動`],
    [ONE, `        function endGameByScore() {`,
`        // 周回: 外周リングの座標列 (時計回り順)
        function ringPositions() {
            const n = BOARD_SIZE;
            const pos = [];
            for (let x = 0; x < n; x++) pos.push([x, 0]);
            for (let y = 1; y < n; y++) pos.push([n - 1, y]);
            for (let x = n - 2; x >= 0; x--) pos.push([x, n - 1]);
            for (let y = n - 2; y >= 1; y--) pos.push([0, y]);
            return pos;
        }
        // 着手ごとに外周リングを1マス時計回りに移動
        function applyOrbit() {
            const idxs = ringPositions().map(([x, y]) => y * BOARD_SIZE + x);
            const vals = idxs.map(i => board[i]);
            vals.unshift(vals.pop());
            idxs.forEach((i, k) => { board[i] = vals[k]; });
            const mapIdx = {};
            idxs.forEach((i, k) => { mapIdx[i] = idxs[(k + 1) % idxs.length]; });
            const shift = p => {
                const i = p.y * BOARD_SIZE + p.x;
                if (!(i in mapIdx)) return p;
                const ni = mapIdx[i];
                return { x: ni % BOARD_SIZE, y: (ni / BOARD_SIZE) | 0 };
            };
            pieces.forEach(pc => { pc.cells = pc.cells.map(shift); });
            if (lastMove) lastMove = { player: lastMove.player, cells: lastMove.cells.map(shift) };
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 周回: 外周リングが1マス進む
            applyOrbit();`],
    ...STONE_SPEC,
], 'orbitgo'));

// 52. SELFGO (自爆碁) — 自殺手が合法 (自連が消えて相手のアゲハマ)
out('selfgo.html', apply(ALGO, [
    ...rb('SELFGO', '自爆碁', 'selfgo'),
    [ONE, RV_ALGO, rv([
        '自爆ルール: 自殺手が合法。着手の結果、呼吸点0になった自分の連は消滅し相手のアゲハマになる。',
        '敵の連を取る判定は通常通り先に行われる。捨て石の極致 — わざと自爆して局面を作り変えられる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 自爆ルール<br>
            ※自殺手が合法。呼吸点0の自連は消えて相手のアゲハマになる`],
    [ONE, `            // 自殺手チェック: この手で自分の石(連)が窒息するなら禁止
            if (getCapturedStones(after, player).length > 0) return false;`,
`            // 自爆ルール: 自殺手も合法 (自連は消滅して相手のアゲハマになる)`],
    [ONE, CAPTURE_BLOCK,
`${CAPTURE_BLOCK}

            // 自爆: 着手の結果、呼吸点0になった自連も消滅 (相手のアゲハマ)
            const selfDead = getCapturedStones(board, player);
            if (selfDead.length > 0) {
                selfDead.forEach(idx => board[idx] = 0);
                captures[opponent] += selfDead.length;
                soundManager.playCapture();
                cleanUpPieces();
            }`],
    ...STONE_SPEC,
], 'selfgo'));

console.log(failures === 0 ? 'ALL OK' : `${failures} replacements MISSING`);
process.exitCode = failures ? 1 : 0;
