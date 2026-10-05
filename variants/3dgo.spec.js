// 3DGO — 立体碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: '3dgo.html',
    en: '3DGO',
    jp: '立体碁',
    prefix: '3dgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('3DGO', '立体碁', '3dgo'),
    [ONE, RV_BASE, rv([
        '盤面は3層。同じ層の上下左右に加えて、真上・真下の層の点も近傍になる (最大6近傍)。',
        '層タブで置く層を選ぶ。他層の石は薄い◆で表示される。',
        '取り・呼吸点・地の判定は3層をまたいで行われる。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 3層盤面<br>
            ※盤面は3層: 上下の層も連・呼吸点になる。他層の石は薄い◆で表示`],
    [ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`,
`        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));
        const LAYERS = 3; // 立体盤の層数`],
    [ONE, BOARD_DECL,
`        let board = Array(BOARD_SIZE * BOARD_SIZE * LAYERS).fill(0); // 0:空, 1:黒, 2:白 (3層)
        let activeLayer = 0; // 表示・入力中の層
        let layerSwAt = 0;   // 層切替シーンの発火時刻`],
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

        let fxPrevMove = null;
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

        let fxPrevMove = null;
        function drawLastMove(padding, cellSize) {`],
    // AI の着手列挙は全層に拡張 (cells に z が無いと cellIndex が NaN になり合法手0で AI が動けない)
    [ONE, `                    for (let ty = 0; ty + h <= BOARD_SIZE; ty++) {
                        for (let tx = 0; tx + w <= BOARD_SIZE; tx++) {
                            const cells = shape.map(([dx, dy]) => ({ x: tx + dx, y: ty + dy }));
                            if (isValidPlacement(cells, turn)) {
                                const score = rateMove(cells, turn);
                                candidates.push({ cells, type, rot, score });
                            }
                        }
                    }`,
`                    for (let tz = 0; tz < LAYERS; tz++) {
                    for (let ty = 0; ty + h <= BOARD_SIZE; ty++) {
                        for (let tx = 0; tx + w <= BOARD_SIZE; tx++) {
                            const cells = shape.map(([dx, dy]) => ({ x: tx + dx, y: ty + dy, z: tz }));
                            if (isValidPlacement(cells, turn)) {
                                const score = rateMove(cells, turn);
                                candidates.push({ cells, type, rot, score });
                            }
                        }
                    }
                    }`],
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
                layerSwAt = fxNow(); // 層切替シーン発火時刻
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
    // 縦連結の可視化 + 層切替シーン — 「上下も近傍」が一目で分かる
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 立体碁: 上下層に同色石がある石に▲▼印、層切替時に光のシーンが走る
        fxAmbient((ctx2, now, pad, cs) => {
            const ls = layerCells();
            ctx2.save();
            // 縦連結マーカー: 真上(▲)/真下(▼)に同色の石がある交点の縁に小さな三角
            board.slice(activeLayer * ls, (activeLayer + 1) * ls).forEach((v, i) => {
                if (v !== 1 && v !== 2) return;
                const gi = activeLayer * ls + i;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                const cx = pad + x * cs, cy = pad + y * cs;
                const col = v === 1 ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)';
                const tri = (ux, uy, dx, dy) => {
                    ctx2.fillStyle = col;
                    ctx2.beginPath();
                    ctx2.moveTo(cx + ux * cs * 0.42, cy + uy * cs * 0.42);
                    ctx2.lineTo(cx + (ux - dy) * cs * 0.30, cy + (uy + dx) * cs * 0.30);
                    ctx2.lineTo(cx + (ux + dy) * cs * 0.30, cy + (uy - dx) * cs * 0.30);
                    ctx2.closePath();
                    ctx2.fill();
                };
                if (activeLayer < LAYERS - 1 && board[gi + ls] === v) tri(0, -1, 0, -1); // 上層に連続 ▲
                if (activeLayer > 0 && board[gi - ls] === v) tri(0, 1, 0, 1);          // 下層に連続 ▼
            });
            // 層切替シーン: 上から下へ光の帯が走る (0.6秒)
            const st2 = (now - layerSwAt) / 600;
            if (layerSwAt && st2 < 1) {
                const w = pad * 2 + (BOARD_SIZE - 1) * cs;
                const ly = st2 * w;
                const g = ctx2.createLinearGradient(0, ly - cs, 0, ly + cs * 0.3);
                g.addColorStop(0, 'rgba(125,211,252,0)');
                g.addColorStop(1, 'rgba(125,211,252,0.5)');
                ctx2.fillStyle = g;
                ctx2.fillRect(0, ly - cs, w, cs * 1.3);
            }
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
