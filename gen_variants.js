// 変則碁バリアント一括生成スクリプト
// tetogo.html / algo.html をテンプレートに、各ゲームの差分を文字列置換で適用する。
// 使い方: node gen_variants.js   (失敗した置換はログに出る)
const fs = require('fs');
const path = require('path');
const TETOGO = fs.readFileSync(path.join(__dirname, 'tetogo.html'), 'utf8').replace(/\r\n/g, '\n');
const ALGO = fs.readFileSync(path.join(__dirname, 'algo.html'), 'utf8').replace(/\r\n/g, '\n');

let failures = 0;
function apply(src, spec, name) {
    let s = src;
    spec.forEach(([mode, oldS, newS]) => {
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
// 1. PENGO (ペン碁) — ペントミノ12種、窒息領域<5
// ============================================================
const PENTO_DEFS = `        // 12種のペントミノ。碁石5つが連結した形で、碁盤の交点を占有する。
        const PIECE_SIZE = 5;
        const PIECE_DEFS = {
            F: [[1,0],[2,0],[0,1],[1,1],[1,2]],
            I: [[0,0],[1,0],[2,0],[3,0],[4,0]],
            L: [[0,0],[0,1],[0,2],[0,3],[1,3]],
            P: [[0,0],[1,0],[0,1],[1,1],[0,2]],
            N: [[1,0],[1,1],[0,2],[1,2],[0,3]],
            T: [[0,0],[1,0],[2,0],[1,1],[1,2]],
            U: [[0,0],[2,0],[0,1],[1,1],[2,1]],
            V: [[0,0],[0,1],[0,2],[1,2],[2,2]],
            W: [[0,0],[0,1],[1,1],[1,2],[2,2]],
            X: [[1,0],[0,1],[1,1],[2,1],[1,2]],
            Y: [[1,0],[0,1],[1,1],[1,2],[1,3]],
            Z: [[0,0],[1,0],[1,1],[1,2],[2,2]]
        };`;

out('pengo.html', apply(TETOGO, [
    [ONE, '<title>TETOGO - テトリス碁</title>', '<title>PENGO - ペン碁</title>'],
    [ONE, '>TETOGO <span class="text-sm font-bold opacity-60">テトリス碁</span>', '>PENGO <span class="text-sm font-bold opacity-60">ペン碁</span>'],
    [ONE, '// 3. テトロミノ (ピース) 定義', '// 3. ペントミノ (ピース) 定義'],
    [ONE, `        // 7種のテトロミノ。碁石4つが連結した形で、碁盤の交点を占有する。
        const PIECE_SIZE = 4;
        const PIECE_DEFS = {
            I: [[0,0],[1,0],[2,0],[3,0]],
            O: [[0,0],[1,0],[0,1],[1,1]],
            T: [[0,0],[1,0],[2,0],[1,1]],
            L: [[0,0],[1,0],[0,1],[0,2]],
            J: [[1,0],[1,1],[0,2],[1,2]],
            S: [[1,0],[2,0],[0,1],[1,1]],
            Z: [[0,0],[1,0],[1,1],[2,1]]
        };`, PENTO_DEFS],
    [ONE, '// I:2 / O:1 / T:4 / L:4 / J:4 / S:2 / Z:2 = 計19パターン', '// 回転のみ (鏡像なし): F4/I2/L4/P4/N4/T4/U4/V4/W4/X1/Y4/Z4 = 計45パターン'],
    [ONE, '// 7種1巡バッグ', '// 12種1巡バッグ'],
    [ONE, `'next' (7種1巡ランダム)`, `'next' (12種1巡ランダム)`],
    [ALL, '7種1巡', '12種1巡'],
    [ONE, `ROOM_ID_PREFIX = 'tetogo-'`, `ROOM_ID_PREFIX = 'pengo-'`],
    [ONE, `STORAGE_KEY = 'tetogo-save-v1'`, `STORAGE_KEY = 'pengo-save-v1'`],
    [ONE, '// 8. 囲碁 & TETOGO ルール判定アルゴリズム', '// 8. 囲碁 & PENGO ルール判定アルゴリズム'],
    [ONE, `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)`,
          `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)<br>
            ※ペントミノ12種 (5マス) を置く碁。窒息領域は5マス未満`],
], 'pengo'));

// ============================================================
// 2. TORUSGO (トーラス碁) — 辺がループする碁盤
// ============================================================
out('torusgo.html', apply(TETOGO, [
    [ONE, '<title>TETOGO - テトリス碁</title>', '<title>TORUSGO - トーラス碁</title>'],
    [ONE, '>TETOGO <span class="text-sm font-bold opacity-60">テトリス碁</span>', '>TORUSGO <span class="text-sm font-bold opacity-60">トーラス碁</span>'],
    [ONE, '// 8. 囲碁 & TETOGO ルール判定アルゴリズム', '// 8. 囲碁 & TORUSGO ルール判定アルゴリズム'],
    [ONE, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            return neighbors;
        }`,
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
    [ONE, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }`,
`            // トーラス盤: セル座標は正規化済み。端を回って同一点に重なる配置は不可。
            const seen = new Set();
            for (const p of cells) {
                const key = p.y * BOARD_SIZE + p.x;
                if (seen.has(key)) return false;
                seen.add(key);
                if (board[key] !== 0) return false;
            }`],
    [ONE, `ROOM_ID_PREFIX = 'tetogo-'`, `ROOM_ID_PREFIX = 'torusgo-'`],
    [ONE, `STORAGE_KEY = 'tetogo-save-v1'`, `STORAGE_KEY = 'torusgo-save-v1'`],
    [ONE, `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)`,
          `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)<br>
            ※トーラス盤: 上下左右の端がつながっている (隅・辺なし)`],
], 'torusgo'));

// ============================================================
// 3. DECAYGO (崩壊碁) — 碁石が寿命で崩壊する
// ============================================================
out('decaygo.html', apply(TETOGO, [
    [ONE, '<title>TETOGO - テトリス碁</title>', '<title>DECAYGO - 崩壊碁</title>'],
    [ONE, '>TETOGO <span class="text-sm font-bold opacity-60">テトリス碁</span>', '>DECAYGO <span class="text-sm font-bold opacity-60">崩壊碁</span>'],
    [ONE, '// 8. 囲碁 & TETOGO ルール判定アルゴリズム', '// 8. 囲碁 & DECAYGO ルール判定アルゴリズム'],
    [ONE, `        const PIECE_SIZE = 4;`,
          `        const PIECE_SIZE = 4;
        // 碁石の寿命: 配置から DECAY_LIMIT ターン経過すると崩壊して消える
        const DECAY_LIMIT = 8;`],
    [ONE, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白`,
          `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
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
    [ONE, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);`,
          `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            ages = Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
    [ONE, `ROOM_ID_PREFIX = 'tetogo-'`, `ROOM_ID_PREFIX = 'decaygo-'`],
    [ONE, `STORAGE_KEY = 'tetogo-save-v1'`, `STORAGE_KEY = 'decaygo-save-v1'`],
    [ONE, `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)`,
          `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)<br>
            ※碁石は配置から${8}ターンで崩壊・消滅します (薄くなるほど寿命が近い)`],
], 'decaygo'));

// ============================================================
// 4. LIFEGO (生命碁) — 着手ごとにライフゲーム1世代
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

out('lifego.html', apply(TETOGO, [
    [ONE, '<title>TETOGO - テトリス碁</title>', '<title>LIFEGO - 生命碁</title>'],
    [ONE, '>TETOGO <span class="text-sm font-bold opacity-60">テトリス碁</span>', '>LIFEGO <span class="text-sm font-bold opacity-60">生命碁</span>'],
    [ONE, '// 8. 囲碁 & TETOGO ルール判定アルゴリズム', '// 8. 囲碁 & LIFEGO ルール判定アルゴリズム'],
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
    [ONE, `ROOM_ID_PREFIX = 'tetogo-'`, `ROOM_ID_PREFIX = 'lifego-'`],
    [ONE, `STORAGE_KEY = 'tetogo-save-v1'`, `STORAGE_KEY = 'lifego-save-v1'`],
    [ONE, `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)`,
          `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)<br>
            ※配置のたびに全碁石がライフゲーム1世代進化 (過疎・過密死・3近傍誕生)`],
], 'lifego'));

// ============================================================
// 5. RUSHGO (スピード碁) — 1手の制限時間 + 自動パス
// ============================================================
const RUSH_TIMER_FN = `
        // ---- 制限時間タイマー ----
        function armMoveTimer() {
            clearMoveTimer();
            const active = timeLimit > 0 && !gameOver && gamePhase === 'playing';
            if (!active) { timerText.textContent = '-'; timerFill.style.width = '100%'; return; }
            moveDeadline = Date.now() + timeLimit * 1000;
            tickMoveTimer();
            moveTimerInterval = setInterval(tickMoveTimer, 100);
        }
        function tickMoveTimer() {
            const remain = Math.max(0, moveDeadline - Date.now());
            timerText.textContent = (remain / 1000).toFixed(1);
            timerFill.style.width = (remain / (timeLimit * 1000) * 100) + '%';
            if (remain <= 0) {
                clearMoveTimer();
                if (!gameOver && gamePhase === 'playing' && isMyTurn()) handlePass();
            }
        }
        function clearMoveTimer() {
            if (moveTimerInterval) { clearInterval(moveTimerInterval); moveTimerInterval = null; }
        }
`;

out('rushgo.html', apply(TETOGO, [
    [ONE, '<title>TETOGO - テトリス碁</title>', '<title>RUSHGO - スピード碁</title>'],
    [ONE, '>TETOGO <span class="text-sm font-bold opacity-60">テトリス碁</span>', '>RUSHGO <span class="text-sm font-bold opacity-60">スピード碁</span>'],
    [ONE, '// 8. 囲碁 & TETOGO ルール判定アルゴリズム', '// 8. 囲碁 & RUSHGO ルール判定アルゴリズム'],
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
    [ONE, `        const komiDisplay = document.getElementById('komiDisplay');`,
          `        const komiDisplay = document.getElementById('komiDisplay');
        const timerFill = document.getElementById('timerFill');
        const timerText = document.getElementById('timerText');`],
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
    [ONE, `            btnUndo.disabled = !canUndo();
            updatePieceTrayUI();
            render();
        }`,
`            btnUndo.disabled = !canUndo();
            updatePieceTrayUI();
            render();
            armMoveTimer();
        }`],
    [ONE, `ROOM_ID_PREFIX = 'tetogo-'`, `ROOM_ID_PREFIX = 'rushgo-'`],
    [ONE, `STORAGE_KEY = 'tetogo-save-v1'`, `STORAGE_KEY = 'rushgo-save-v1'`],
    [ONE, `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)`,
          `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)<br>
            ※1手の制限時間を超えると自動でパスされます`],
], 'rushgo'));

// ============================================================
// 6. CYCLOGO (シクロ碁) — シクロアルカン (環状分子) の碁
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

let cyc = apply(ALGO, [
    [ONE, '<title>ALGO - アルカン碁</title>', '<title>CYCLOGO - シクロ碁</title>'],
    [ONE, '>ALGO <span class="text-sm font-bold opacity-60">アルカン碁</span>', '>CYCLOGO <span class="text-sm font-bold opacity-60">シクロ碁</span>'],
    [ALL, '碁カン', '碁クロ'],
    [ONE, 'アルカン分子「碁クロ」を配置し合う変則囲碁', 'シクロアルカン「碁クロ」を配置し合う変則囲碁'],
    [ONE, '登場アルカン', '登場シクロアルカン'],
    [ONE, 'アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。',
          'シクロアルカンは炭素骨格が環を含む。リング状の碁クロは内側に穴を残すことがある。CYCLOGO では全7種が登場します。'],
    [ONE, '// 3. アルカン分子 (ピース) 定義', '// 3. シクロアルカン分子 (ピース) 定義'],
    [ONE, `        // アルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // すべて4原子以上なので「4マス未満の窒息領域」ルールがそのまま機能する。`,
          `        // シクロアルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // リング状分子は内側に空点を残すが、そこは窒息領域なら呼吸点にならない。`],
    [ONE, `        const MOLECULES = {
            BUTANE:         { name: 'ブタン',            iupac: 'n-ブタン',             formula: 'C₄H₁₀', atoms: [[0,0],[1,0],[1,1],[2,1]] },
            ISOBUTANE:      { name: 'イソブタン',         iupac: '2-メチルプロパン',     formula: 'C₄H₁₀', atoms: [[1,0],[0,1],[1,1],[2,1]] },
            PENTANE:        { name: 'ペンタン',           iupac: 'n-ペンタン',           formula: 'C₅H₁₂', atoms: [[0,0],[1,0],[2,0],[3,0],[4,0]] },
            ISOPENTANE:     { name: 'イソペンタン',       iupac: '2-メチルブタン',       formula: 'C₅H₁₂', atoms: [[0,0],[1,0],[2,0],[3,0],[1,1]] },
            NEOPENTANE:     { name: 'ネオペンタン',       iupac: '2,2-ジメチルプロパン', formula: 'C₅H₁₂', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2]] },
            HEXANE:         { name: 'ヘキサン',           iupac: 'n-ヘキサン',           formula: 'C₆H₁₄', atoms: [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]] },
            NEOHEXANE:      { name: 'ネオヘキサン',       iupac: '2,2-ジメチルブタン',   formula: 'C₆H₁₄', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]] }
        };`, CYCLO_MOLECULES],
    [ONE, '// ブタン:2 / イソブタン:4 / ペンタン:2 / イソペンタン:4 / ネオペンタン:1 / ヘキサン:2 / ネオヘキサン:4 = 計19パターン',
          '// シクロブタン:1 / メチルシクロブタン:4 / シクロヘキサン:2 / エチルシクロブタン:4 / シクロオクタン:1 / ナフタレン:2 / アダマンタン:1 = 計15パターン'],
    [ALL, `'ISOBUTANE'`, `'CYCLOBUTANE'`],
    [ONE, `ROOM_ID_PREFIX = 'algo-'`, `ROOM_ID_PREFIX = 'cyclogo-'`],
    [ONE, `STORAGE_KEY = 'algo-save-v1'`, `STORAGE_KEY = 'cyclogo-save-v1'`],
    [ONE, '// 8. 囲碁 & ALGO ルール判定アルゴリズム', '// 8. 囲碁 & CYCLOGO ルール判定アルゴリズム'],
], 'cyclogo');
out('cyclogo.html', cyc);

// ============================================================
// 7. ALKENEGO (アルケン碁) — 剛直な不飽和分子 (回転不可)
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
    [ONE, '<title>ALGO - アルカン碁</title>', '<title>ALKENEGO - アルケン碁</title>'],
    [ONE, '>ALGO <span class="text-sm font-bold opacity-60">アルカン碁</span>', '>ALKENEGO <span class="text-sm font-bold opacity-60">アルケン碁</span>'],
    [ALL, '碁カン', '碁ケン'],
    [ONE, 'アルカン分子「碁ケン」を配置し合う変則囲碁', 'アルケン・アルキン「碁ケン」を配置し合う変則囲碁 (二重結合は剛直・回転不可)'],
    [ONE, '登場アルカン', '登場アルケン・アルキン'],
    [ONE, 'アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。',
          'アルケン・アルキンは二重・三重結合を持つ不飽和炭化水素。結合が剛直なため盤上で回転できません。全7種が登場します。'],
    [ONE, '// 3. アルカン分子 (ピース) 定義', '// 3. 不飽和炭化水素 (アルケン/アルキン) 定義'],
    [ONE, `        // アルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // すべて4原子以上なので「4マス未満の窒息領域」ルールがそのまま機能する。`,
          `        // 不飽和炭化水素の骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // 二重/三重結合 (db) は剛直: 分子は回転できない。`],
    [ONE, `        const MOLECULES = {
            BUTANE:         { name: 'ブタン',            iupac: 'n-ブタン',             formula: 'C₄H₁₀', atoms: [[0,0],[1,0],[1,1],[2,1]] },
            ISOBUTANE:      { name: 'イソブタン',         iupac: '2-メチルプロパン',     formula: 'C₄H₁₀', atoms: [[1,0],[0,1],[1,1],[2,1]] },
            PENTANE:        { name: 'ペンタン',           iupac: 'n-ペンタン',           formula: 'C₅H₁₂', atoms: [[0,0],[1,0],[2,0],[3,0],[4,0]] },
            ISOPENTANE:     { name: 'イソペンタン',       iupac: '2-メチルブタン',       formula: 'C₅H₁₂', atoms: [[0,0],[1,0],[2,0],[3,0],[1,1]] },
            NEOPENTANE:     { name: 'ネオペンタン',       iupac: '2,2-ジメチルプロパン', formula: 'C₅H₁₂', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2]] },
            HEXANE:         { name: 'ヘキサン',           iupac: 'n-ヘキサン',           formula: 'C₆H₁₄', atoms: [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]] },
            NEOHEXANE:      { name: 'ネオヘキサン',       iupac: '2,2-ジメチルブタン',   formula: 'C₆H₁₄', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]] }
        };`, ALKENE_MOLECULES],
    [ONE, `        // 各分子の回転バリエーションを事前生成 (重複排除)
        // ブタン:2 / イソブタン:4 / ペンタン:2 / イソペンタン:4 / ネオペンタン:1 / ヘキサン:2 / ネオヘキサン:4 = 計19パターン
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
    [ALL, `'ISOBUTANE'`, `'BUTENE'`],
    [ONE, `ROOM_ID_PREFIX = 'algo-'`, `ROOM_ID_PREFIX = 'alkenego-'`],
    [ONE, `STORAGE_KEY = 'algo-save-v1'`, `STORAGE_KEY = 'alkenego-save-v1'`],
    [ONE, '// 8. 囲碁 & ALGO ルール判定アルゴリズム', '// 8. 囲碁 & ALKENEGO ルール判定アルゴリズム'],
    [ONE, '⟳ 回転', '⟳ 回転不可'],
    [ONE, `            PC: クリックで配置 / 回転=Rキー・右クリック・ホイール / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定 (回転・ホールドはボタン)`,
`            PC: クリックで配置 / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定 (ホールドはボタン)<br>
            ※回転不可: 剛直な不飽和結合のため碁ケンは向きを変えられません`],
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
    // 回転ボタン無効化 (起動時)
    [ONE, `        window.onload = () => {
            buildThemeList();`,
`        window.onload = () => {
            // 不飽和分子は回転不可
            btnRotate.disabled = true;
            btnRotate.classList.add('opacity-40', 'cursor-not-allowed');
            buildThemeList();`],
], 'alkenego-render');
out('alkenego.html', alk);

// ============================================================
// 8. POLYGO (ポリ碁) — 自由に曲がるポリマー鎖を毎手描く
// ============================================================
let poly = apply(TETOGO, [
    [ONE, '<title>TETOGO - テトリス碁</title>', '<title>POLYGO - ポリ碁</title>'],
    [ONE, '>TETOGO <span class="text-sm font-bold opacity-60">テトリス碁</span>', '>POLYGO <span class="text-sm font-bold opacity-60">ポリ碁</span>'],
    [ONE, '// 8. 囲碁 & TETOGO ルール判定アルゴリズム', '// 8. 囲碁 & POLYGO ルール判定アルゴリズム'],
    // ピース定義 → モノマー鎖
    [ONE, `        // 7種のテトロミノ。碁石4つが連結した形で、碁盤の交点を占有する。
        const PIECE_SIZE = 4;
        const PIECE_DEFS = {
            I: [[0,0],[1,0],[2,0],[3,0]],
            O: [[0,0],[1,0],[0,1],[1,1]],
            T: [[0,0],[1,0],[2,0],[1,1]],
            L: [[0,0],[1,0],[0,1],[0,2]],
            J: [[1,0],[1,1],[0,2],[1,2]],
            S: [[1,0],[2,0],[0,1],[1,1]],
            Z: [[0,0],[1,0],[1,1],[2,1]]
        };
        const PIECE_TYPES = Object.keys(PIECE_DEFS);`,
`        // ポリマー鎖: ピースは固定形を持たず、毎手 MONOMERS 連の自由な鎖を描く。
        // 窒息領域のしきい値はモノマー数と同じ4。
        const PIECE_SIZE = 4;
        const MONOMERS = 4;
        const PIECE_DEFS = {}; // 固定ピースなし
        const PIECE_TYPES = [];`],
    [ONE, `        // 各ピースの回転バリエーションを事前生成 (重複排除)
        // I:2 / O:1 / T:4 / L:4 / J:4 / S:2 / Z:2 = 計19パターン
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
        });

        // 7種1巡バッグ (テトリス方式) のシャッフル
        function shuffledBag() {
            const bag = [...PIECE_TYPES];
            for (let i = bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bag[i], bag[j]] = [bag[j], bag[i]];
            }
            return bag;
        }`,
`        const ORIENTATIONS = {}; // 固定形なし
        function shuffledBag() { return []; }

        // 構築中のポリマー鎖 (盤面座標の配列)
        let chainCells = [];

        function refreshChainPreview() {
            previewPos = chainCells.length
                ? { cells: chainCells, valid: chainCells.length === MONOMERS && isValidPlacement(chainCells, turn) }
                : null;
        }`],
    // 供給モード廃止: 常に自由描画
    [ONE, `        let pieceMode = 'next'; // 'free' (自由選択) | 'next' (7種1巡ランダム)`,
          `        let pieceMode = 'free'; // ポリマー鎖は自由描画のみ`],
    [ONE, `            pieceMode = ['free', 'next'].includes(s.pieceMode) ? s.pieceMode : 'next';`,
          `            pieceMode = 'free';`],
    // 設定モーダルの配給セクション → 説明文
    [ONE, `            <!-- 3. ピース配給モード -->
            <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-neutral-500">ピース配給</label>
                <div class="grid grid-cols-2 gap-2">
                    <button data-pmode="free" class="btn-pmode py-2 rounded-lg border border-neutral-300 font-bold text-xs sm:text-sm hover:bg-neutral-100 transition-all">自由選択</button>
                    <button data-pmode="next" class="btn-pmode py-2 rounded-lg border border-neutral-300 font-bold text-xs sm:text-sm hover:bg-neutral-100 transition-all">ネクスト (7種1巡)</button>
                </div>
            </div>`,
`            <!-- 3. ポリマー説明 -->
            <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-neutral-500">ピース</label>
                <p class="text-xs text-neutral-500">毎ターン、隣接する空点へ4連のポリマー鎖を自由に描いて配置します。形は毎手自分で決められます。</p>
            </div>`],
    // トレイUI: 鎖の構築状況表示 + ボタン流用
    [ONE, `        function updatePieceTrayUI() {
            const list = ORIENTATIONS[currentPieceType];
            if (!list) return;
            currentRot = currentRot % list.length;
            drawMiniPiece(currentPieceCanvas, currentPieceType, currentRot);
            currentPieceLabel.textContent = \`ピース: \${currentPieceType}\`;

            if (pieceMode === 'free') {
                paletteBox.classList.remove('hidden');
                nextBox.classList.add('hidden');
                nextBox.classList.remove('flex');
                trayModeLabel.textContent = 'ピース選択 (自由モード)';
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
                trayModeLabel.textContent = 'NEXT (7種1巡モード)';
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
        }`,
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
    [ONE, `        // ホールド: 現在ピースを自分のホールド枠に保存して次を供給 (初回)
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
        }`,
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
    [ONE, `        function handleMouseMove(e) {
            if (lastPointerType === 'touch') return; // タッチ操作ではホバープレビューを出さない
            if (gameOver || gamePhase === 'dead_stone_selection' || !isMyTurn()) return;
            const anchor = getAnchorFromEvent(e);
            if (anchor) {
                previewPos = computePreview(anchor.u, anchor.v);
                render();
            }
        }`,
`        function handleMouseMove(e) {
            // ポリマー鎖はクリックで構築するためホバープレビューなし
        }`],
    // クリック処理: 鎖の構築と確定
    [ONE, `            if (!isMyTurn()) return;

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
        }`,
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
    [ONE, `        function evaluateBestAiMove() {
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
        }`,
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
    [ONE, `<span id="currentPieceLabel" class="text-[10px] font-bold tracking-widest opacity-60">ピース</span>`,
          `<span id="currentPieceLabel" class="text-[10px] font-bold tracking-widest opacity-60">モノマー鎖</span>`],
    [ONE, `<span id="trayModeLabel" class="text-[10px] font-bold tracking-widest opacity-60">ピース選択</span>`,
          `<span id="trayModeLabel" class="text-[10px] font-bold tracking-widest opacity-60">チェーン構築</span>`],
    // リセット時に鎖をクリア
    [ONE, `            previewPos = null;
            lastMove = null;`,
          `            previewPos = null;
            chainCells = [];
            lastMove = null;`],
    [ONE, `ROOM_ID_PREFIX = 'tetogo-'`, `ROOM_ID_PREFIX = 'polygo-'`],
    [ONE, `STORAGE_KEY = 'tetogo-save-v1'`, `STORAGE_KEY = 'polygo-save-v1'`],
    [ONE, `            PC: クリックで配置 / 回転=右クリック・ホイール・Rキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)`,
`            タップ/クリックでモノマーを追加し、4連のポリマー鎖を構築 (隣接する空点にのみ伸ばせます)<br>
            完成した鎖の上をタップ or 「配置する」で確定。末尾を戻す=右クリック・Rキー・「↩ 1マス戻す」`],
    // 残置コードの安全化: refreshPreview→鎖プレビュー / 供給モードはfree固定
    [ONE, `        function refreshPreview() {
            if (!previewPos) return;
            previewPos = computePreview(previewPos.u, previewPos.v);
        }`,
`        function refreshPreview() { refreshChainPreview(); }`],
    [ONE, `                pieceMode = e.target.dataset.pmode;`,
          `                pieceMode = 'free'; // ポリマー鎖は自由描画固定`],
    [ONE, `        function getPlacementAt(u, v) {
            const list = ORIENTATIONS[currentPieceType];
            const shape = list[currentRot % list.length];`,
`        function getPlacementAt(u, v) {
            return null; // ポリマー鎖はクリック構築のため未使用
            const list = ORIENTATIONS[currentPieceType];
            const shape = list[currentRot % list.length];`],
    // 構築中の鎖はリセット/復元時にクリア
    [ONE, `            history = [];
            currentRot = 0;`,
`            history = [];
            currentRot = 0;
            chainCells = [];`],
], 'polygo');
out('polygo.html', poly);

// ============================================================
// 9. 3DGO (立体碁) — 3層盤面、上下も連・呼吸点になる
// ============================================================
let d3 = apply(TETOGO, [
    [ONE, '<title>TETOGO - テトリス碁</title>', '<title>3DGO - 立体碁</title>'],
    [ONE, '>TETOGO <span class="text-sm font-bold opacity-60">テトリス碁</span>', '>3DGO <span class="text-sm font-bold opacity-60">立体碁</span>'],
    [ONE, '// 8. 囲碁 & TETOGO ルール判定アルゴリズム', '// 8. 囲碁 & 3DGO ルール判定アルゴリズム'],
    [ONE, `        const PIECE_SIZE = 4;`,
          `        const PIECE_SIZE = 4;
        const LAYERS = 3; // 立体盤の層数`],
    [ONE, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白`,
          `        let board = Array(BOARD_SIZE * BOARD_SIZE * LAYERS).fill(0); // 0:空, 1:黒, 2:白 (3層)
        let activeLayer = 0; // 表示・入力中の層`],
    // 全セル→idx変換を z 対応に (ピースセルは {x,y,z})
    // ※getNeighbors挿入より先に行うこと (cellIndex本体が置換対象文字列を含むため)
    [ALL, 'p.y * BOARD_SIZE + p.x', 'cellIndex(p)'],
    [ONE, 'cells[0].y * BOARD_SIZE + cells[0].x', 'cellIndex(cells[0])'],
    // ※pieceUnionPathの連結判定キーは2Dのままにする (描画対象は常に同一層)
    [ONE, `const set = new Set(cellsAbs.map(p => cellIndex(p)));`,
          `const set = new Set(cellsAbs.map(p => p.y * BOARD_SIZE + p.x));`],
    // getNeighbors → 6近傍 + 座標→idxヘルパー
    [ONE, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            return neighbors;
        }`,
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
                        const idx = z * layerCells() + y * BOARD_SIZE + x;
                        const val = board[idx];
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
    [ONE, `        <!-- ピーストレイ`,
`        <!-- 層選択タブ -->
        <div class="w-full flex justify-center gap-2">
            <button data-layer="0" class="btn-layer flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all hover:opacity-80">第1層</button>
            <button data-layer="1" class="btn-layer flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all hover:opacity-80">第2層</button>
            <button data-layer="2" class="btn-layer flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all hover:opacity-80">第3層</button>
        </div>

        <!-- ピーストレイ`],
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
    [ONE, `            btnUndo.disabled = !canUndo();
            updatePieceTrayUI();
            render();
        }`,
`            btnUndo.disabled = !canUndo();
            updatePieceTrayUI();
            render();
            updateLayerTabs();
        }`],
    // AI: 全層を探索
    [ONE, `                    for (let ty = 0; ty + h <= BOARD_SIZE; ty++) {
                        for (let tx = 0; tx + w <= BOARD_SIZE; tx++) {
                            const cells = shape.map(([dx, dy]) => ({ x: tx + dx, y: ty + dy }));
                            if (isValidPlacement(cells, turn)) {
                                const score = rateMove(cells, turn);
                                candidates.push({ cells, type, rot, score });
                            }
                        }
                    }`,
`                    for (let z = 0; z < LAYERS; z++) {
                        for (let ty = 0; ty + h <= BOARD_SIZE; ty++) {
                            for (let tx = 0; tx + w <= BOARD_SIZE; tx++) {
                                const cells = shape.map(([dx, dy]) => ({ x: tx + dx, y: ty + dy, z }));
                                if (isValidPlacement(cells, turn)) {
                                    const score = rateMove(cells, turn);
                                    candidates.push({ cells, type, rot, score });
                                }
                            }
                        }
                    }`],
    // 永続化: 盤面は3層分
    [ONE, `                || !Array.isArray(s.board) || s.board.length !== s.boardSize * s.boardSize) {`,
          `                || !Array.isArray(s.board) || s.board.length !== s.boardSize * s.boardSize * LAYERS) {`],
    [ONE, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);`,
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
    [ONE, `ROOM_ID_PREFIX = 'tetogo-'`, `ROOM_ID_PREFIX = '3dgo-'`],
    [ONE, `STORAGE_KEY = 'tetogo-save-v1'`, `STORAGE_KEY = '3dgo-save-v1'`],
    [ONE, `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)`,
          `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)<br>
            ※盤面は3層: 上下の層も連・呼吸点になります。他層の石は薄い◆で表示`],
], '3dgo');
out('3dgo.html', d3);

// ============================================================
// 10. ASYMGO (非対称碁) — 黒と白で使える碁テトが違う
//     黒: I・O・T (対称の安定形) / 白: L・J・S・Z (変形)
// ============================================================
// プレイヤー別ピースセット機構 (ASYMGO/DRAFTGO共通)
const PER_PLAYER_SPEC = [
    [ONE, `        const PIECE_TYPES = Object.keys(PIECE_DEFS);`,
`        const PIECE_TYPES = Object.keys(PIECE_DEFS);
        // プレイヤー別の使用可能ピース (非対称ルール)
        let PLAYER_PIECES = { 1: ['I', 'O', 'T'], 2: ['L', 'J', 'S', 'Z'] };`],
    [ONE, `        // 7種1巡バッグ (テトリス方式) のシャッフル
        function shuffledBag() {
            const bag = [...PIECE_TYPES];
            for (let i = bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bag[i], bag[j]] = [bag[j], bag[i]];
            }
            return bag;
        }`,
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
    [ONE, `        let pieceQueue = [];        // 'next'モード用の今後の供給列`,
          `        let pieceQueues = { 1: [], 2: [] }; // プレイヤー別の供給列`],
    // saveState (20スペースインデント)
    [ONE, `                    pieceQueue,
                    heldPieces,`,
`                    pieceQueues,
                    heldPieces,`],
    // loadState
    [ONE, `            pieceQueue = Array.isArray(s.pieceQueue)
                ? s.pieceQueue.filter(t => PIECE_TYPES.includes(t)) : [];
            if (pieceMode === 'next' && pieceQueue.length === 0) pieceQueue = shuffledBag();`,
`            pieceQueues = (s.pieceQueues && typeof s.pieceQueues === 'object')
                ? { 1: validTypes(s.pieceQueues[1]), 2: validTypes(s.pieceQueues[2]) }
                : { 1: [], 2: [] };
            if (pieceMode === 'next' && pieceQueues[turn].length === 0) pieceQueues[turn] = shuffledBag(turn);`],
    // トレイ: 自由選択は自軍セットのみ表示 / NEXTは相手キュー先頭
    [ONE, `                PIECE_TYPES.forEach(t => {
                    const c = paletteCanvases[t];
                    if (c) drawMiniPiece(c, t, 0, turn);
                    const btn = c && c.parentElement;
                    if (btn) btn.style.outline = (t === currentPieceType) ? '2px solid currentColor' : 'none';
                });`,
`                PIECE_TYPES.forEach(t => {
                    const c = paletteCanvases[t];
                    const btn = c && c.parentElement;
                    if (btn) btn.style.display = PLAYER_PIECES[turn].includes(t) ? '' : 'none';
                    if (c) drawMiniPiece(c, t, 0, turn);
                    if (btn) btn.style.outline = (t === currentPieceType) ? '2px solid currentColor' : 'none';
                });`],
    [ONE, `                    currentPieceType = t;
                    currentRot = 0;`,
`                    if (!PLAYER_PIECES[turn].includes(t)) return;
                    currentPieceType = t;
                    currentRot = 0;`],
    [ONE, `                trayModeLabel.textContent = 'NEXT (7種1巡モード)';
                // NEXTピースは次の手番(相手)の色で描く
                if (pieceQueue[0]) drawMiniPiece(nextPieceCanvas, pieceQueue[0], 0, turn === 1 ? 2 : 1);`,
`                trayModeLabel.textContent = 'NEXT (自軍バッグから供給)';
                // NEXTピースは次の手番(相手)のバッグ先頭を相手色で描く
                const nq = pieceQueues[turn === 1 ? 2 : 1];
                if (nq && nq[0]) drawMiniPiece(nextPieceCanvas, nq[0], 0, turn === 1 ? 2 : 1);`],
    // ドローは「今の手番」のバッグから (executeMoveでは手番交代後に呼ぶ)
    [ONE, `        function drawNextPiece() {
            if (pieceQueue.length === 0) pieceQueue = shuffledBag();
            return pieceQueue.shift();
        }`,
`        function drawNextPiece() {
            if (pieceQueues[turn].length === 0) pieceQueues[turn] = shuffledBag(turn);
            return pieceQueues[turn].shift();
        }`],
    // 着手後: 手番を交代してから次プレイヤーのバッグから供給
    [ONE, `            // ネクストモードでは次のピースを供給
            if (pieceMode === 'next') {
                currentPieceType = drawNextPiece();
            }

            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;

            // ネクストモード: 次の手番プレイヤーのバッグから供給
            if (pieceMode === 'next') {
                currentPieceType = drawNextPiece();
            }`],
    // history/undo/online
    [ONE, `                currentPieceType,
                pieceQueue: [...pieceQueue],`,
`                currentPieceType,
                pieceQueues: { 1: [...pieceQueues[1]], 2: [...pieceQueues[2]] },`],
    [ONE, `            if (snap.pieceQueue) pieceQueue = snap.pieceQueue;`,
`            if (snap.pieceQueues) pieceQueues = { 1: [...snap.pieceQueues[1]], 2: [...snap.pieceQueues[2]] };`],
    [ONE, `            if (data.pieceQueue) pieceQueue = data.pieceQueue;`,
`            if (data.pieceQueues) pieceQueues = data.pieceQueues;`],
    [ONE, `                pieceQueue,
                heldPieces,`,
`                pieceQueues,
                heldPieces,`],
    // AI: 自由モード時も自軍セットのみ
    [ONE, `            const types = pieceMode === 'next' ? [currentPieceType] : PIECE_TYPES;`,
`            const types = pieceMode === 'next' ? [currentPieceType] : PLAYER_PIECES[turn];`],
    // resetGame
    [ONE, `            if (pieceMode === 'next') {
                pieceQueue = shuffledBag();
                currentPieceType = pieceQueue.shift();
            }`,
`            if (pieceMode === 'next') {
                pieceQueues = { 1: shuffledBag(1), 2: shuffledBag(2) };
                currentPieceType = drawNextPiece();
            }`],
];

let asym = apply(TETOGO, [
    [ONE, '<title>TETOGO - テトリス碁</title>', '<title>ASYMGO - 非対称碁</title>'],
    [ONE, '>TETOGO <span class="text-sm font-bold opacity-60">テトリス碁</span>', '>ASYMGO <span class="text-sm font-bold opacity-60">非対称碁</span>'],
    [ONE, '// 8. 囲碁 & TETOGO ルール判定アルゴリズム', '// 8. 囲碁 & ASYMGO ルール判定アルゴリズム'],
    // 使用セットの凡例
    [ONE, `                <div id="nextBox" class="hidden items-center gap-2.5">
                    <canvas id="nextPieceCanvas" width="46" height="46"></canvas>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold tracking-widest">NEXT</span>
                        <span class="text-[10px] opacity-60 leading-tight">7種1巡<br>ランダム</span>
                    </div>
                </div>`,
`                <div id="nextBox" class="hidden items-center gap-2.5">
                    <canvas id="nextPieceCanvas" width="46" height="46"></canvas>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold tracking-widest">NEXT</span>
                        <span class="text-[10px] opacity-60 leading-tight">自軍バッグ<br>から供給</span>
                    </div>
                </div>
                <span class="text-[10px] opacity-60">使用ピース — 黒: I・O・T / 白: L・J・S・Z</span>`],
    ...PER_PLAYER_SPEC,
    [ONE, `ROOM_ID_PREFIX = 'tetogo-'`, `ROOM_ID_PREFIX = 'asymgo-'`],
    [ONE, `STORAGE_KEY = 'tetogo-save-v1'`, `STORAGE_KEY = 'asymgo-save-v1'`],
    [ONE, `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)`,
          `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)<br>
            ※非対称ルール: 黒は安定形 (I・O・T)、白は変形 (L・J・S・Z) のみ使用可能`],
], 'asymgo');
out('asymgo.html', asym);

// ============================================================
// 11. DRAFTGO (ドラフト碁) — 対局前にピースを交互ドラフト
//     各3種を取り合い、以後は自軍の獲得ピースのみ出る
// ============================================================
let draft = apply(TETOGO, [
    [ONE, '<title>TETOGO - テトリス碁</title>', '<title>DRAFTGO - ドラフト碁</title>'],
    [ONE, '>TETOGO <span class="text-sm font-bold opacity-60">テトリス碁</span>', '>DRAFTGO <span class="text-sm font-bold opacity-60">ドラフト碁</span>'],
    [ONE, '// 8. 囲碁 & TETOGO ルール判定アルゴリズム', '// 8. 囲碁 & DRAFTGO ルール判定アルゴリズム'],
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
    [ONE, `                <div id="nextBox" class="hidden items-center gap-2.5">
                    <canvas id="nextPieceCanvas" width="46" height="46"></canvas>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold tracking-widest">NEXT</span>
                        <span class="text-[10px] opacity-60 leading-tight">7種1巡<br>ランダム</span>
                    </div>
                </div>`,
`                <div id="nextBox" class="hidden items-center gap-2.5">
                    <canvas id="nextPieceCanvas" width="46" height="46"></canvas>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold tracking-widest">NEXT</span>
                        <span class="text-[10px] opacity-60 leading-tight">ドラフト獲得<br>ピースのみ</span>
                    </div>
                </div>`],
    // 状態変数
    [ONE, `        const PIECE_TYPES = Object.keys(PIECE_DEFS);`,
`        const PIECE_TYPES = Object.keys(PIECE_DEFS);
        const DRAFT_PICKS = 3; // 各プレイヤーの獲得ピース種数`],
    [ONE, `        let pieceQueue = [];        // 'next'モード用の今後の供給列`,
`        let pieceQueues = { 1: [], 2: [] }; // プレイヤー別の供給列
        let PLAYER_PIECES = { 1: [...PIECE_TYPES], 2: [...PIECE_TYPES] }; // ドラフトで確定
        let draftState = null; // { pool:[types], picks:{1:[],2:[]}, turn } ドラフト中のみ非null
        let aiDraftTimer = null;`],
    ...PER_PLAYER_SPEC.filter(([_, o]) =>
        !o.includes('PLAYER_PIECES = { 1:') && !o.includes('pieceQueue = []') && !o.includes('PIECE_TYPES = Object.keys')),
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
    [ONE, `            btnUndo.disabled = !canUndo();
            updatePieceTrayUI();
            render();
        }`,
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
    [ONE, `ROOM_ID_PREFIX = 'tetogo-'`, `ROOM_ID_PREFIX = 'draftgo-'`],
    [ONE, `STORAGE_KEY = 'tetogo-save-v1'`, `STORAGE_KEY = 'draftgo-save-v1'`],
    [ONE, `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)`,
          `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)<br>
            ※対局開始前にドラフト: 黒→白→黒…と交互に3種ずつピースを獲得。以後は獲得ピースのみ出現`],
], 'draftgo');
out('draftgo.html', draft);

// ============================================================
// 12. GRAPHGO (グラフ碁) — 盤面が分子グラフ (炭素=頂点, 結合=辺)
//     呼吸点・連は盤の辺のみ。ピース内隣接には辺が必要
// ============================================================
let graph = apply(TETOGO, [
    [ONE, '<title>TETOGO - テトリス碁</title>', '<title>GRAPHGO - グラフ碁</title>'],
    [ONE, '>TETOGO <span class="text-sm font-bold opacity-60">テトリス碁</span>', '>GRAPHGO <span class="text-sm font-bold opacity-60">グラフ碁</span>'],
    [ONE, '// 8. 囲碁 & TETOGO ルール判定アルゴリズム', '// 8. 囲碁 & GRAPHGO ルール判定アルゴリズム'],
    // グラフ状態 + getNeighbors を辺ベースに
    [ONE, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白`,
`        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
        let ADJ = []; // グラフ隣接リスト (盤面=分子グラフ: 頂点=炭素, 辺=結合)
        let graphRemoved = []; // 除去された辺のインデックス (保存・同期用)`],
    [ONE, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            return neighbors;
        }`,
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
    // 配置: ピース内の格子隣接セルには盤の辺が必要 (分子として繋がること)
    [ONE, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }`,
`            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // グラフ盤: ピース内の隣接セル同士は盤の結合(辺)が必要
            for (const a of cells) {
                for (const b of cells) {
                    if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1) {
                        if (!hasEdge(a.y * BOARD_SIZE + a.x, b.y * BOARD_SIZE + b.x)) return false;
                    }
                }
            }`],
    // 盤面描画: 格子線→結合線+炭素ノード (星はなし)
    [ONE, `            // 格子線
            ctx.strokeStyle = currentTheme.lineColor;
            ctx.lineWidth = 1;
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

            // 外枠強調
            ctx.strokeStyle = currentTheme.lineColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(padding, padding, width - padding * 2, width - padding * 2);

            // 星 (天元・星の点)
            const starPoints = getStarPoints(BOARD_SIZE);
            ctx.fillStyle = currentTheme.starColor;
            starPoints.forEach(pt => {
                const cx = padding + pt.x * cellSize;
                const cy = padding + pt.y * cellSize;
                ctx.beginPath();
                ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
                ctx.fill();
            });`,
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
    [ONE, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);`,
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
    [ONE, `ROOM_ID_PREFIX = 'tetogo-'`, `ROOM_ID_PREFIX = 'graphgo-'`],
    [ONE, `STORAGE_KEY = 'tetogo-save-v1'`, `STORAGE_KEY = 'graphgo-save-v1'`],
    [ONE, `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)`,
          `            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)<br>
            ※盤面は分子グラフ: 呼吸点・連は結合(辺)のみ。ピースを置くには全ての隣接箇所に結合が必要`],
], 'graphgo');
out('graphgo.html', graph);

console.log(failures === 0 ? 'ALL OK' : `${failures} replacements MISSING`);
process.exitCode = failures ? 1 : 0;
