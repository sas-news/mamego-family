// GRAPHGO — グラフ碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'graphgo.html',
    en: 'GRAPHGO',
    jp: 'グラフ碁',
    prefix: 'graphgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('GRAPHGO', 'グラフ碁', 'graphgo'),
    K.params([
        { key: 'edge_remove', label: '辺の除去率', min: 0.05, max: 0.6, def: 0.28, step: 0.01 },
    ]),
    [ONE, RV_BASE, rv([
        '盤面はランダムな分子グラフ: 全格子辺から約28%を連結を保ちながら除去して生成。',
        '連・呼吸点・取り・地の判定はすべてグラフの辺 (結合線) だけを辿る。辺のない隣接はつながらない。',
    ])],
    [ONE, INFO_BASE,
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
            const target = Math.floor(all.length * (P('edge_remove') || 0.28));
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
    // 切断された辺の痕跡 + 結合を走る電子火花 — 「辺の有無」が一目で分かる
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // グラフ碁: 除去された辺は断線痕、残った辺は石の近くで電子火花が走る
        fxAmbient((ctx2, now, pad, cs) => {
            const all = gridEdges();
            const rem = new Set(graphRemoved);
            ctx2.save();
            // 断線痕: 除去された辺の中点に薄い「×」 (辺が無いことを示す)
            ctx2.strokeStyle = 'rgba(120,113,108,0.45)';
            ctx2.lineWidth = Math.max(1, cs * 0.05);
            all.forEach(([a, b], i) => {
                if (!rem.has(i)) return;
                const ax = a % BOARD_SIZE, ay = Math.floor(a / BOARD_SIZE);
                const bx = b % BOARD_SIZE, by = Math.floor(b / BOARD_SIZE);
                const mx = pad + (ax + bx) / 2 * cs, my = pad + (ay + by) / 2 * cs;
                const dx = (bx - ax) * cs * 0.10, dy = (by - ay) * cs * 0.10;
                ctx2.beginPath();
                ctx2.moveTo(mx - dy, my - dx);
                ctx2.lineTo(mx + dy, my + dx);
                ctx2.moveTo(mx - dx * 0.4 - dy, my - dy * 0.4 - dx);
                ctx2.lineTo(mx - dx * 0.4 + dy, my - dy * 0.4 + dx);
                ctx2.moveTo(mx + dx * 0.4 - dy, my + dy * 0.4 - dx);
                ctx2.lineTo(mx + dx * 0.4 + dy, my + dy * 0.4 + dx);
                ctx2.stroke();
            });
            // 電子火花: 石がある頂点から出る辺を小さな光が巡回 (結合が生きている)
            ctx2.fillStyle = '#fbbf24';
            all.forEach(([a, b], i) => {
                if (rem.has(i)) return;
                if (board[a] === 0 && board[b] === 0) return;
                const ax = a % BOARD_SIZE, ay = Math.floor(a / BOARD_SIZE);
                const bx = b % BOARD_SIZE, by = Math.floor(b / BOARD_SIZE);
                const ph = (now / 1400 + i * 0.37) % 1;
                const t = board[a] !== 0 ? ph : 1 - ph;
                ctx2.globalAlpha = 0.28 + 0.2 * Math.sin(ph * Math.PI);
                ctx2.beginPath();
                ctx2.arc(pad + (ax + (bx - ax) * t) * cs, pad + (ay + (by - ay) * t) * cs, cs * 0.07, 0, Math.PI * 2);
                ctx2.fill();
            });
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
