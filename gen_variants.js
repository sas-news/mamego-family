// 変則碁バリアント一括生成スクリプト (wave1)
// algo.html をテンプレートに文字列置換で差分適用。共通基盤は gen_kit.js。
// 使い方: node gen_variants.js   (失敗した置換はログに出る)
const K = require('./gen_kit.js');
const { ALGO, apply, ONE, out, MOLECULES_ALGO, OCNT_ALGO, NBRS_GRID, VALID_BOUNDS, INFO_ALGO, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_ALGO, RCM_ALGO, RV_ALGO, RC_ALGO, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_ALGO, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

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
    ...WRAP_MARKS_SPEC(`chev(midC, padding * 0.55, 0, -1); chev(midC, width - padding * 0.55, 0, 1); chev(padding * 0.55, midC, -1, 0); chev(width - padding * 0.55, midC, 1, 0);`),
    // トーラス: 端の石は対側の端にも半透明で映る (ループの可視化)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // トーラス: 端の石は対側の端にも半透明で映る
            {
                ctx.save();
                ctx.globalAlpha = 0.30;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const v = board[y * BOARD_SIZE + x];
                    if (v !== 1 && v !== 2) continue;
                    ctx.fillStyle = v === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                    const ghost = (gx, gy) => {
                        ctx.beginPath();
                        ctx.arc(padding + gx * cellSize, padding + gy * cellSize, cellSize * 0.26, 0, Math.PI * 2);
                        ctx.fill();
                    };
                    if (x === 0) ghost(BOARD_SIZE - 1, y);
                    if (x === BOARD_SIZE - 1) ghost(0, y);
                    if (y === 0) ghost(x, BOARD_SIZE - 1);
                    if (y === BOARD_SIZE - 1) ghost(x, 0);
                }
                ctx.restore();
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
    // 8方向連: 斜めに隣接する同色石を細線で結ぶ (石の下に敷く)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 斜め連結の補助線
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.3);
                ctx.lineWidth = Math.max(1, cellSize * 0.06);
                ctx.beginPath();
                for (let dy = 0; dy < BOARD_SIZE - 1; dy++) for (let dx = 0; dx < BOARD_SIZE - 1; dx++) {
                    const v = board[dy * BOARD_SIZE + dx];
                    if (v !== 1 && v !== 2) continue;
                    if (board[(dy + 1) * BOARD_SIZE + (dx + 1)] === v) { ctx.moveTo(padding + dx * cellSize, padding + dy * cellSize); ctx.lineTo(padding + (dx + 1) * cellSize, padding + (dy + 1) * cellSize); }
                }
                for (let dy = 0; dy < BOARD_SIZE - 1; dy++) for (let dx = 1; dx < BOARD_SIZE; dx++) {
                    const v = board[dy * BOARD_SIZE + dx];
                    if (v !== 1 && v !== 2) continue;
                    if (board[(dy + 1) * BOARD_SIZE + (dx - 1)] === v) { ctx.moveTo(padding + dx * cellSize, padding + dy * cellSize); ctx.lineTo(padding + (dx - 1) * cellSize, padding + (dy + 1) * cellSize); }
                }
                ctx.stroke();
                ctx.restore();
            }`],
    // 斜め盤の質感: 全交点に薄い斜め筋を散りばめる (斜め連結の盤)
    [ONE, `            // 格子線`, `            // 斜め筋の地紋
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.12);
                ctx.lineWidth = Math.max(1, cellSize * 0.03);
                const t = cellSize * 0.11;
                ctx.beginPath();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.moveTo(cx - t, cy - t); ctx.lineTo(cx + t, cy + t);
                    ctx.moveTo(cx - t, cy + t); ctx.lineTo(cx + t, cy - t);
                }
                ctx.stroke();
                ctx.restore();
            }

            // 格子線`],
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
    // 壁の描画: 瓦礫の岩ブロック + フォールバックで壁を石として描かないよう除外
    [ONE, COVERED_ANCHOR, texDraw(PAINT_ROCK('#6b6560', '#3f3a35'))],
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
    // 重力方向の印: 下端余白の小さな三角
    CUE_STARS(`            // 重力方向の印: 下端中央の下向き三角
            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.6);
                const gx = padding + (BOARD_SIZE - 1) / 2 * cellSize, gy = width - padding * 0.42;
                const gs = cellSize * 0.11;
                ctx.beginPath();
                ctx.moveTo(gx - gs, gy - gs * 0.6);
                ctx.lineTo(gx + gs, gy - gs * 0.6);
                ctx.lineTo(gx, gy + gs * 0.8);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }`),
    ...LEGAL_DOTS_SPEC,
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
    ...LEGAL_DOTS_SPEC,
    // 繁殖の雰囲気: 自石の周りを漂う胞子
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 繁殖: 石の周りに漂う胞子
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = pad + x * cs, cy = pad + y * cs;
                for (let k = 0; k < 2; k++) {
                    const ph = now / 1400 + i * 0.37 + k * 1.9;
                    const r = cs * (0.55 + 0.25 * Math.sin(ph * 0.7));
                    const a = ph + k * Math.PI;
                    ctx2.globalAlpha = 0.20 + 0.18 * Math.sin(ph * 1.3);
                    ctx2.fillStyle = v === 1 ? 'rgba(60,60,60,0.85)' : 'rgba(255,255,255,0.95)';
                    ctx2.beginPath();
                    ctx2.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, Math.max(1, cs * 0.05), 0, Math.PI * 2);
                    ctx2.fill();
                }
            }
            ctx2.restore();
        });`],
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
                    mirrored.forEach(p => {
                        board[p.y * BOARD_SIZE + p.x] = player;
                        // 鏡映転移: 本体から対称軸を跨いで石が飛ぶ
                        fxSlide(p.y * BOARD_SIZE + (BOARD_SIZE - 1 - p.x), p.y * BOARD_SIZE + p.x, 420);
                    });
                    pieces.push({ id: Date.now() + Math.random(), player, type: move.type, rot: move.rot, cells: mirrored });
                    lastMove.cells.push(...mirrored.map(p => ({ ...p })));
                }
            }`],
    // 縦中央線 (対称軸) の破線
    CUE_STARS(`            // 対称軸: 縦中央線に薄い破線
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.45);
                ctx.lineWidth = Math.max(1, cellSize * 0.03);
                ctx.setLineDash([cellSize * 0.14, cellSize * 0.10]);
                const mx = padding + (BOARD_SIZE - 1) / 2 * cellSize;
                ctx.beginPath();
                ctx.moveTo(mx, padding);
                ctx.lineTo(mx, width - padding);
                ctx.stroke();
                ctx.restore();
            }`),
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
        let turnPlacements = 0; // この手番で置いた石数 (2で手番交代)
        let turnPlaced = []; // この手番で置いた石の idx (順序印用)`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turnPlaced.push(move.cells[0].y * BOARD_SIZE + move.cells[0].x);
            turnPlacements++;
            if (turnPlacements >= 2) {
                turnPlacements = 0;
                turnPlaced = [];
                turn = opponent; // 2石置き切りで手番交代
            }`],
    // パスは残り着手を放棄して手番を渡す
    [ONE, PASS_INC,
`            prevBoard = null; // パスでコウ制限は解除
            consecutivePasses++;
            turnPlacements = 0;
            turnPlaced = [];`],
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
    // この手番で置いた石に①②の順序印
    ...STONE_MARKS_SPEC(`            // 二手: この手番で置いた石に順序印
            {
                const nums = ['①', '②'];
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.max(9, cellSize * 0.42) + 'px sans-serif';
                turnPlaced.forEach((i, k) => {
                    if (board[i] !== turn) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = turn === 1 ? '#fde68a' : '#92400e';
                    ctx.fillText(nums[k] || '•', cx, cy);
                });
                ctx.restore();
            }`),
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
    // 王の威光: 黄金の光輪 + 連の呼吸点が1以下で赤い警告点滅
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 王の威光と窮地の警告
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            [1, 2].forEach(pl => {
                const k = kings[pl];
                if (k < 0 || board[k] !== pl) return;
                const cx = pad + (k % BOARD_SIZE) * cs, cy = pad + ((k / BOARD_SIZE) | 0) * cs;
                const libs = getLiberties(board, k);
                const danger = libs <= 1;
                const pulse = 0.5 + 0.5 * Math.sin(now / (danger ? 170 : 800));
                ctx2.globalAlpha = danger ? 0.50 + 0.38 * pulse : 0.20 + 0.12 * pulse;
                ctx2.strokeStyle = danger ? '#ef4444' : '#fbbf24';
                ctx2.lineWidth = Math.max(1.5, cs * 0.07);
                ctx2.beginPath();
                ctx2.arc(cx, cy, cs * (0.62 + 0.07 * pulse), 0, Math.PI * 2);
                ctx2.stroke();
            });
            ctx2.restore();
        });`],
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
                fxText(captured[0], '先取 ' + Math.min(captures[player], WIN_CAPTURES) + '/' + WIN_CAPTURES, '#f59e0b', 900);
                if (captures[player] >= WIN_CAPTURES) {
                    fxShake(6, 350);
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
    // 先取カウント: 手番側のアゲハマ進捗を常時表示
    ...EVENT_CHIP_SPEC(`'先取 ' + Math.min(captures[turn], WIN_CAPTURES) + '/' + WIN_CAPTURES`),
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
                    squeezed.forEach(i => { board[i] = 0; fxBurst(i, '#f59e0b', 7, 1.3); });
                    fxText(squeezed[0], 'ハサミ!', '#d97706', 900);
                    fxShake(3, 220);
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
        '崩壊で盤面が埋まり切らないため、盤面マス数と同じ手数で自動終了して地集計に入る。',
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
    // 手数制限: 崩壊で盤面が飽和しないため盤面マス数の手数で自動終了
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            if (history.length >= BOARD_SIZE * BOARD_SIZE) endGameByScore();`],
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
        // 着手ごとに盤面全体を Conway のライフゲーム1世代進める (B3/S23・斜め含む8近傍)。
        // 誕生色は3近傍の単色のみ (混色なら誕生しない)。死滅は自然消滅 (アゲハマにならない)。
        // 世代交代の結果、呼吸点を失った連は両色とも取り除く。
        function applyLifeStep(immune) {
            const n = BOARD_SIZE;
            immune = immune || new Set(); // 置いたばかりの石はこの世代は死なない (新生児保護)
            const counts = new Array(board.length).fill(0);
            const tint = new Array(board.length).fill(0); // 0:未接触 / 1,2:単色 / -1:混色
            for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
                const i = y * n + x;
                const c = board[i];
                if (c !== 1 && c !== 2) continue;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    if (!dx && !dy) continue;
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
                    const j = ny * n + nx;
                    counts[j]++;
                    tint[j] = tint[j] === 0 ? c : (tint[j] === c ? c : -1);
                }
            }
            const next = [...board];
            const born = [], died = [];
            for (let i = 0; i < board.length; i++) {
                if (board[i] === 1 || board[i] === 2) {
                    // S23: 隣接同色・異色問わず2-3個で生存、それ以外は死滅 (新生児は免除)
                    if (!immune.has(i) && (counts[i] < 2 || counts[i] > 3)) { next[i] = 0; died.push(i); }
                } else if (board[i] === 0 && counts[i] === 3 && tint[i] !== -1) {
                    // B3: 空点はちょうど3近傍・単色で誕生
                    next[i] = tint[i]; born.push(i);
                }
            }
            board = next;
            // 誕生を緑に光らせ、死滅は小さく弾ける (数が多い場合は間引き)
            born.slice(0, 24).forEach(i => fxGlow(i, 'rgba(74,222,128,0.9)', 520));
            died.slice(0, 24).forEach(i => fxBurst(i, 'rgba(160,160,170,0.8)', 3, 0.6));
            if (born.length + died.length > 0) cleanUpPieces();
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
        '着手ごとに盤面全体が Conway のライフゲームを1世代進む (B3/S23・斜め含む8近傍)。',
        '石は孤独(近傍<2)でも過密(>3)でも死滅する (置いたばかりの石はその世代は死なない)。空点はちょうど3個の同色近傍で誕生。',
        'ライフ死滅はアゲハマにならない。世代交代で呼吸点を失った連は通常通り取られる。',
        '累計200手で打ち切り終局して地計算 (無限対局を防ぐ安全装置)。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + ライフゲーム<br>
            ※配置のたびに盤面が1世代進化 (誕生B3・生存S23・8近傍)`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 打ち切り終局: 累計200手で強制終局 (ライフの循環で無限対局になり得るため)
            if (history.length >= 200) endGameByScore();`],
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
`            // ライフゲーム世代交代: 着手ごとに盤面全体を1世代進める (置いた石はこの世代は死なない)
            applyLifeStep(new Set(move.cells.map(p => p.y * BOARD_SIZE + p.x)));

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
    // 碁ペンの顔: 原子球を角丸正方形ブロックに差し替え
    [ONE, `                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.fill();`,
`                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(cx - R, cy - R, R * 2, R * 2, R * 0.22); else ctx.rect(cx - R, cy - R, R * 2, R * 2);
                ctx.fill();`],
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
    // 碁クロ: 盤の四隅に環状分子 (ベンゼン環) の薄いモチーフを常時表示
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            const pts = [[pad * 0.5, pad * 0.5], [w - pad * 0.5, pad * 0.5],
                [pad * 0.5, w - pad * 0.5], [w - pad * 0.5, w - pad * 0.5]];
            const pulse = 0.28 + Math.sin(now / 1400) * 0.10;
            ctx2.save();
            ctx2.strokeStyle = alphaColor(currentTheme.lineColor, pulse);
            ctx2.lineWidth = Math.max(0.8, cs * 0.035);
            const r = cs * 0.2;
            for (const [hx, hy] of pts) {
                ctx2.beginPath();
                for (let k = 0; k < 6; k++) {
                    const a = Math.PI / 6 + k * Math.PI / 3;
                    const px = hx + Math.cos(a) * r, py = hy + Math.sin(a) * r;
                    if (k === 0) ctx2.moveTo(px, py); else ctx2.lineTo(px, py);
                }
                ctx2.closePath();
                ctx2.stroke();
                ctx2.beginPath();
                ctx2.arc(hx, hy, r * 0.52, 0, Math.PI * 2);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
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
    // 盤上でも多重結合を平行2本線で描く (ミニピース描画と同じ見た目)
    ...STONE_MARKS_SPEC(`            {
                ctx.save();
                pieces.forEach(pc => {
                    const pairs = DBONDS[pc.type];
                    if (!pairs || !pairs.length) return;
                    const minX = Math.min(...pc.cells.map(p => p.x));
                    const minY = Math.min(...pc.cells.map(p => p.y));
                    const at = (nx, ny) => pc.cells.find(p => p.x - minX === nx && p.y - minY === ny);
                    const fill = pc.player === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                    ctx.strokeStyle = shiftColor(fill, -0.15);
                    ctx.lineCap = 'round';
                    ctx.lineWidth = cellSize * 0.10;
                    pairs.forEach(([pa, pb]) => {
                        const a = at(pa[0], pa[1]), b = at(pb[0], pb[1]);
                        if (!a || !b) return;
                        if (board[a.y * BOARD_SIZE + a.x] !== pc.player || board[b.y * BOARD_SIZE + b.x] !== pc.player) return;
                        const ax = padding + a.x * cellSize, ay = padding + a.y * cellSize;
                        const bx = padding + b.x * cellSize, by = padding + b.y * cellSize;
                        const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
                        const ux = dx / L, uy = dy / L;
                        const ox = -uy * cellSize * 0.12, oy = ux * cellSize * 0.12;
                        const r0 = cellSize * 0.30;
                        ctx.beginPath();
                        ctx.moveTo(ax + ux * r0 + ox, ay + uy * r0 + oy);
                        ctx.lineTo(bx - ux * r0 + ox, by - uy * r0 + oy);
                        ctx.moveTo(ax + ux * r0 - ox, ay + uy * r0 - oy);
                        ctx.lineTo(bx - ux * r0 - ox, by - uy * r0 - oy);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
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
    // 配置時に系統色のリング (黒=直鎖は琥珀 / 白=分枝は水色)
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}
            move.cells.forEach(p => fxGlow(p.y * BOARD_SIZE + p.x, player === 1 ? '#f59e0b' : '#38bdf8', 520));`],
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
            // ピック演出: 選ばれたボタンを金色に瞬かせる
            {
                const btn = draftPool && draftPool.querySelector('button[data-type="' + type + '"]');
                if (btn) {
                    btn.style.outline = '3px solid #f59e0b';
                    btn.style.outlineOffset = '2px';
                    setTimeout(() => { btn.style.outline = 'none'; btn.style.outlineOffset = '0'; }, 450);
                }
            }
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
                    flipped.forEach(i => {
                        board[i] = player;
                        // 寝返りの瞬間を青白い火花で
                        fxGlow(i, 'rgba(147,197,253,0.9)', 540);
                        fxBurst(i, '#93c5fd', 4, 0.9);
                    });
                    fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '反転×' + flipped.length, '#60a5fa', 1000);
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
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    nb[x * BOARD_SIZE + (BOARD_SIZE - 1 - y)] = board[y * BOARD_SIZE + x];
                    if (board[y * BOARD_SIZE + x] !== 0) fxSlide(y * BOARD_SIZE + x, x * BOARD_SIZE + (BOARD_SIZE - 1 - y), 400);
                }
                board = nb;
                fxShake(2, 160);
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
    // 着手ごとに盤が時計回りに回る印: 右上余白の回転矢印
    CUE_STARS(`            // 回転の印: 右上余白に時計回りの弧矢印
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.65);
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                const ax = width - padding * 0.52, ay = padding * 0.55;
                const ar = cellSize * 0.17, a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
                ctx.beginPath();
                ctx.arc(ax, ay, ar, a0, a1);
                ctx.stroke();
                const ex = ax + ar * Math.cos(a1), ey = ay + ar * Math.sin(a1);
                const tx = -Math.sin(a1), ty = Math.cos(a1);
                const nx = -ty, ny = tx, hl = cellSize * 0.10;
                ctx.beginPath();
                ctx.moveTo(ex - tx * hl + nx * hl * 0.6, ey - ty * hl + ny * hl * 0.6);
                ctx.lineTo(ex, ey);
                ctx.lineTo(ex - tx * hl - nx * hl * 0.6, ey - ty * hl - ny * hl * 0.6);
                ctx.stroke();
                ctx.restore();
            }`),
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
        // 合法手の数を数える (詰み警告・情報表示用)
        function countLegalMoves(player) {
            let n = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                if (isValidPlacement([{ x, y }], player)) n++;
            }
            return n;
        }
`;
const STALEMATE_CHECK = `            // 詰み判定: 手番側に合法手がなければ敗北
            if (gamePhase === 'playing' && !gameOver && !anyValidMove(turn)) {
                winByRule(turn === 1 ? 2 : 1, '手詰み', '合法手がありません');
            }
`;

// ポリオミノ質感: 隙間のない融合タイル描画 (drawPieceShape 差し替え。triogo/quadgo 等)
const TILE_DRAW_SPEC = [ONE, `        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;`,
`        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;
            if (cellsAbs.length > 1) {
                const tileSet = new Set(cellsAbs.map(p => p.y * BOARD_SIZE + p.x));
                const ins = cellSize * 0.47;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = fill;
                cellsAbs.forEach(p => {
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    ctx.fillRect(cx - ins, cy - ins, ins * 2, ins * 2);
                });
                ctx.strokeStyle = shiftColor(fill, -0.3);
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.lineJoin = 'round';
                ctx.beginPath();
                cellsAbs.forEach(p => {
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    if (!tileSet.has(p.y * BOARD_SIZE + p.x - 1)) { ctx.moveTo(cx - ins, cy - ins); ctx.lineTo(cx + ins, cy - ins); }
                    if (!tileSet.has(p.y * BOARD_SIZE + p.x + 1)) { ctx.moveTo(cx + ins, cy - ins); ctx.lineTo(cx + ins, cy + ins); }
                    if (!tileSet.has((p.y + 1) * BOARD_SIZE + p.x)) { ctx.moveTo(cx + ins, cy + ins); ctx.lineTo(cx - ins, cy + ins); }
                    if (!tileSet.has((p.y - 1) * BOARD_SIZE + p.x)) { ctx.moveTo(cx - ins, cy + ins); ctx.lineTo(cx - ins, cy - ins); }
                });
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.22)';
                cellsAbs.forEach(p => {
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    if (!tileSet.has((p.y - 1) * BOARD_SIZE + p.x)) ctx.fillRect(cx - ins, cy - ins, ins * 2, cellSize * 0.10);
                });
                ctx.restore();
                return;
            }`];

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
    // 禁取の可視化: 相手連の最後の呼吸点 (取れば禁手の点) に赤い禁止マーク
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 禁取: 相手連の最後の呼吸点に取禁止マーク
            {
                const seen = new Set();
                const noCap = [];
                for (let i = 0; i < board.length; i++) {
                    const c = board[i];
                    if ((c !== 1 && c !== 2) || seen.has(i)) continue;
                    const grp = getConnectedGroup(i, c);
                    grp.forEach(g => seen.add(g));
                    const libs = new Set();
                    grp.forEach(g => getNeighbors(g).forEach(m => { if (board[m] === 0) libs.add(m); }));
                    if (libs.size === 1) noCap.push([...libs][0]);
                }
                ctx.save();
                ctx.strokeStyle = 'rgba(220,38,38,0.65)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                noCap.forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.21, cy - cellSize * 0.21);
                    ctx.lineTo(cx + cellSize * 0.21, cy + cellSize * 0.21);
                    ctx.stroke();
                });
                ctx.restore();
            }`],
    ...LEGAL_DOTS_SPEC,
    ...EVENT_CHIP_SPEC(`'合法手 ' + countLegalMoves(turn)`),
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
    ...LEGAL_DOTS_SPEC,
    // 詰みの予兆: 残り合法手を常時表示
    ...EVENT_CHIP_SPEC(`'合法手 ' + countLegalMoves(turn)`),
    ...STONE_SPEC,
], 'limitgo'));

// 29. GROWGO (増殖碁) — 着手ごとに石が空点へ増殖する
out('growgo.html', apply(ALGO, [
    ...rb('GROWGO', '増殖碁', 'growgo'),
    [ONE, RV_ALGO, rv([
        '増殖ルール: 着手ごとに、石に隣接する空点のうち約30%へ同じ色の石が増殖する。',
        '増殖はどの連の最後の呼吸点も埋めない (増殖だけでは石は取られないが、アタリまで追い込める)。',
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
                // 増殖先がどの連の最後の呼吸点でもある場合は増殖しない (増殖による連鎖全滅を防ぐ)
                const chokes = getNeighbors(i).some(n => {
                    const c = board[n];
                    if (c === 0) return false;
                    const libs = new Set();
                    getConnectedGroup(n, c).forEach(cell =>
                        getNeighbors(cell).forEach(m => { if (board[m] === 0) libs.add(m); }));
                    return libs.size === 1 && libs.has(i);
                });
                if (chokes) return;
                const s = adj[(Math.random() * adj.length) | 0];
                board[i] = board[s]; used.add(i);
            });
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
        '盤面がなかなか落ち着かないため、盤面マス数と同じ手数で自動終了して地集計に入る。',
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
    // 手数制限: もぐら移動で盤面が収束しないため盤面マス数の手数で自動終了
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            if (history.length >= BOARD_SIZE * BOARD_SIZE) endGameByScore();`],
    ...STONE_SPEC,
], 'molego'));

// 31. BLASTGO (爆撃碁) — 隣接する敵石の連を無条件破壊
out('blastgo.html', apply(ALGO, [
    ...rb('BLASTGO', '爆撃碁', 'blastgo'),
    [ONE, RV_ALGO, rv([
        '爆撃ルール: 置いた石に隣接する敵石の「連」は呼吸点に関係なくすべて破壊・取られる。',
        '通常の取り判定も有効。爆撃で取った石もアゲハマに数えられる。',
        '爆撃で盤面が埋まり切らないため、盤面マス数と同じ手数で自動終了して地集計に入る。',
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
    // 手数制限: 爆撃で盤面が飽和しないため盤面マス数の手数で自動終了
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            if (history.length >= BOARD_SIZE * BOARD_SIZE) endGameByScore();`],
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
    // 豆の顔: 原子球を楕円の豆に差し替え (斜め交互で並木感)
    [ONE, `                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.fill();`,
`                ctx.beginPath();
                ctx.ellipse(cx, cy, R, R * 0.72, ((p.x + p.y) % 2 === 0 ? 1 : -1) * Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();`],
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
    TILE_DRAW_SPEC,
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
    // 孤立の可視化: 手番側の石に隣接する空点 (禁手) に小さな×
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 孤立: 手番側の石に隣接する空点は禁手 — 小さな×を刻む
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(220,38,38,0.42)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                const t = cellSize * 0.13;
                ctx.beginPath();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 0) continue;
                    if (!getNeighbors(i).some(n => board[n] === turn)) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                    ctx.moveTo(cx - t, cy - t); ctx.lineTo(cx + t, cy + t);
                    ctx.moveTo(cx - t, cy + t); ctx.lineTo(cx + t, cy - t);
                }
                ctx.stroke();
                ctx.restore();
            }`],
    ...LEGAL_DOTS_SPEC,
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
    // 中央は深い井戸
    [ONE, COVERED_ANCHOR, texDraw(PAINT_RIFT('rgba(70,110,170,0.45)'))],
    ...WALL_GUARD_SPEC,
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
    // 四隅は削り取られた崖面
    [ONE, COVERED_ANCHOR, texDraw(PAINT_CLIFF)],
    ...WALL_GUARD_SPEC,
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
                fused.forEach(i => { board[i] = 3; fxGlow(i, '#f59e0b', 560); fxBurst(i, '#d6d3d1', 6, 1.1); });
                if (fused.length) {
                    fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '中和!', '#fbbf24', 900);
                    cleanUpPieces();
                }
            }`],
    // 中和ブロックはリベット留めの鋼板
    [ONE, COVERED_ANCHOR, texDraw(PAINT_STEEL)],
    ...WALL_GUARD_SPEC,
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
`            // ワームホール端点の描画 (紫の◎ペア + ペア間の薄い破線)
            ctx.strokeStyle = '#8b5cf6';
            ctx.save();
            ctx.setLineDash([cellSize * 0.12, cellSize * 0.10]);
            ctx.globalAlpha = 0.35;
            WORMHOLES.forEach(([a, b]) => {
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padding + (a % BOARD_SIZE) * cellSize, padding + Math.floor(a / BOARD_SIZE) * cellSize);
                ctx.lineTo(padding + (b % BOARD_SIZE) * cellSize, padding + Math.floor(b / BOARD_SIZE) * cellSize);
                ctx.stroke();
            });
            ctx.restore();
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
    // ワームホール上への着手は「転送」の表示と渦の光で発火
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 転送碁: ワームホール端点への着手は対側にも繋がる「転送」演出
            {
                const wc = move.cells[0];
                if (wc) {
                    const wi = wc.y * BOARD_SIZE + wc.x;
                    const pair = WORMHOLES.find(([a, b]) => a === wi || b === wi);
                    if (pair) {
                        const other = pair[0] === wi ? pair[1] : pair[0];
                        fxGlow(wi, '#a78bfa', 700);
                        fxGlow(other, '#a78bfa', 700);
                        fxText(wi, '転送', '#c4b5fd', 1100);
                    }
                }
            }

            turn = opponent;`],
    // ワームホールの脈動と対側へ飛ぶ火花 — 「遠隔で繋がっている」を常時演出
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 転送碁: ワームホールが脈動し、ペア間を火花が行き来する常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            WORMHOLES.forEach(([a, b], pi) => {
                // 端点の渦巻きリング (回転する弧で転送口を演出)
                [a, b].forEach((i, ei) => {
                    const cx = pad + (i % BOARD_SIZE) * cs;
                    const cy = pad + Math.floor(i / BOARD_SIZE) * cs;
                    const rot = now / 700 * (pi === 0 ? 1 : -1) + ei * Math.PI;
                    ctx2.strokeStyle = '#a78bfa';
                    ctx2.globalAlpha = 0.5 + 0.2 * Math.sin(now / 400 + i);
                    ctx2.lineWidth = Math.max(1.5, cs * 0.07);
                    ctx2.beginPath();
                    ctx2.arc(cx, cy, cs * 0.36, rot, rot + Math.PI * 1.4);
                    ctx2.stroke();
                });
                // ペア間を往復する火花 (トンネルを通る粒子)
                for (let k = 0; k < 3; k++) {
                    const ph = (now / 1800 + k * 0.33 + pi * 0.5) % 1;
                    const ax = pad + (a % BOARD_SIZE) * cs, ay = pad + Math.floor(a / BOARD_SIZE) * cs;
                    const bx = pad + (b % BOARD_SIZE) * cs, by = pad + Math.floor(b / BOARD_SIZE) * cs;
                    const t = ph < 0.5 ? ph * 2 : 2 - ph * 2;
                    ctx2.globalAlpha = 0.5 * (1 - Math.abs(ph - 0.5) * 2) + 0.15;
                    ctx2.fillStyle = '#c4b5fd';
                    ctx2.beginPath();
                    ctx2.arc(ax + (bx - ax) * t, ay + (by - ay) * t, cs * 0.09, 0, Math.PI * 2);
                    ctx2.fill();
                }
            });
            ctx2.restore();
        });`],
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
                captured.forEach(idx => { board[idx] = 3; fxGlow(idx, 'rgba(226,232,240,0.85)', 700); });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    // 墓標: 丸みのある碑 + 刻字
    [ONE, COVERED_ANCHOR, texDraw(PAINT_TOMB)],
    ...WALL_GUARD_SPEC,
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
    TILE_DRAW_SPEC,
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
    // 正方形の外枠は描かない (円縁が外枠になる)
    [ONE, GRID_RENDER,
`            // 格子線
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
            });`],
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`, CIRCLE_DRAW],
    ...WALL_GUARD_SPEC,
    // 円盤の艶: 円縁をなぞる光の帯がゆっくり回る
    [ONE, FX_BOOT,
`${FX_BOOT}
        fxAmbient((ctx2, now, pad, cs) => {
            const cr = (BOARD_SIZE - 1) / 2;
            const bx = pad + cr * cs, by = pad + cr * cs, rr = (cr + 0.55) * cs;
            const a0 = now / 2400;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(255,255,255,0.16)';
            ctx2.lineWidth = Math.max(1.5, cs * 0.10);
            ctx2.beginPath();
            ctx2.arc(bx, by, rr, a0, a0 + Math.PI * 0.35);
            ctx2.stroke();
            ctx2.restore();
        });`],
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
                dead.forEach(i => { board[i] = 0; fxBurst(i, '#ff6d00', 10, 1.2); });
                if (dead.length) captures[pl === 1 ? 2 : 1] += dead.length;
            });
            cleanUpPieces();
            if (changed) fxShake(5, 300); // 大地が沈む感触
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
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 溶岩: 泡立つ光彩と舞い上がる火の粉を常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            const n = BOARD_SIZE;
            ctx2.save();
            for (let i = 0; i < n * n; i++) {
                if (board[i] !== 3) continue;
                const x = i % n, y = Math.floor(i / n);
                const cx = pad + x * cs, cy = pad + y * cs;
                const ph = Math.sin(now / 420 + x * 1.7 + y * 2.3);
                if (ph > 0.55) { // ゆらめく溶岩の輝点
                    ctx2.globalAlpha = (ph - 0.55) * 0.9;
                    ctx2.fillStyle = '#ffb347';
                    ctx2.beginPath();
                    ctx2.arc(cx + Math.sin(now / 700 + y) * cs * 0.18, cy + Math.cos(now / 800 + x) * cs * 0.18, cs * 0.13, 0, Math.PI * 2);
                    ctx2.fill();
                }
            }
            // 沈降予告リングの縁を熱く光らせる
            if (lavaDepth < Math.ceil(n / 2)) {
                const d = lavaDepth, pulse = 0.25 + 0.2 * Math.sin(now / 300);
                ctx2.globalAlpha = pulse;
                ctx2.strokeStyle = '#ff5722';
                ctx2.lineWidth = Math.max(2, cs * 0.12);
                const inset = pad + (d - 0.5) * cs, sz = (n - 2 * d + 1) * cs;
                ctx2.strokeRect(inset, inset, sz, sz);
            }
            ctx2.restore();
        });`],
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
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 溶岩: LAVA_EVERY手ごとに外周が沈む
            if (history.length % LAVA_EVERY === 0) {
                // 沈むリングを先に赤く点滅させてから溶岩化
                {
                    const n = BOARD_SIZE, d = lavaDepth;
                    for (let y = d; y < n - d; y++) for (let x = d; x < n - d; x++) {
                        if (x !== d && x !== n - 1 - d && y !== d && y !== n - 1 - d) continue;
                        const i = y * n + x;
                        if (board[i] === 0) fxGlow(i, '#ff5722', 700);
                    }
                }
                applyLava();
            }`],
    // 沈んだリングは焦土色。次に沈むリングを微かな熱気で示す
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`, `            const covered = new Set(); // ピース描画でカバー済みのマス

            // 溶岩セルの表面: 玄武岩 + 脈動する灼熱の亀裂
            {
                const now = fxNow();
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = y * BOARD_SIZE + x;
                    if (board[i] !== 3) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.9);
                    g.addColorStop(0, '#3d2314'); g.addColorStop(1, '#1a0e08');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    // 灼熱の亀裂 (セルごとの位相で脈動)
                    const ph = Math.sin(now / 480 + x * 2.1 + y * 1.3);
                    ctx.strokeStyle = 'rgba(255,' + Math.round(80 + ph * 60) + ',20,' + (0.5 + ph * 0.3) + ')';
                    ctx.lineWidth = Math.max(1, cellSize * 0.07);
                    ctx.beginPath();
                    const s1 = Math.sin(i * 12.9898) * 0.5 + 0.5, s2 = Math.sin(i * 78.233) * 0.5 + 0.5;
                    ctx.moveTo(cx - hh + s1 * cellSize, cy - hh);
                    ctx.lineTo(cx + (s2 - 0.5) * cellSize * 0.4, cy);
                    ctx.lineTo(cx - hh + s2 * cellSize, cy + hh);
                    ctx.moveTo(cx + hh, cy - hh + s1 * cellSize * 0.6);
                    ctx.lineTo(cx + (s1 - 0.5) * cellSize * 0.3, cy + (s2 - 0.5) * cellSize * 0.3);
                    ctx.stroke();
                }
                ctx.restore();
            }
            // 次に沈むリングを微かな熱気で示す
            {
                const d = lavaDepth;
                const n = BOARD_SIZE;
                if (d < Math.ceil(n / 2)) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(215,90,30,0.13)';
                    for (let y = d; y < n - d; y++) for (let x = d; x < n - d; x++) {
                        if (x !== d && x !== n - 1 - d && y !== d && y !== n - 1 - d) continue;
                        const i = y * n + x;
                        if (board[i] === 0) ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                    }
                    ctx.restore();
                }
            }`],
    ...WALL_GUARD_SPEC,
    ...EVENT_CHIP_SPEC(`'沈下' + (LAVA_EVERY - history.length % LAVA_EVERY) + '手'`),
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
    // 陣地: 左半=黒域・右半=白域を微かに地色分けし、境界を破線で示す
    CUE_GRID(`            // 陣地の地色分け (左=黒側, 右=白側) と境界の破線
            {
                const hmid = Math.floor(BOARD_SIZE / 2);
                const y0 = padding - cellSize * 0.5, y1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                const x0 = padding - cellSize * 0.5, x1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                const bx = padding + hmid * cellSize, bh = cellSize * 0.5;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.p1Stroke, 0.05);
                ctx.fillRect(x0, y0, bx - bh - x0, y1 - y0);
                ctx.fillStyle = alphaColor(currentTheme.p2Fill, 0.16);
                ctx.fillRect(bx + bh, y0, x1 - bx - bh, y1 - y0);
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.4);
                ctx.lineWidth = 1;
                ctx.setLineDash([cellSize * 0.16, cellSize * 0.12]);
                ctx.beginPath();
                ctx.moveTo(bx - bh, y0);
                ctx.lineTo(bx - bh, y1);
                ctx.moveTo(bx + bh, y0);
                ctx.lineTo(bx + bh, y1);
                ctx.stroke();
                ctx.restore();
            }`),
    // 境界の中央共通列をゆっくり照らす光
    [ONE, FX_BOOT,
`${FX_BOOT}
        fxAmbient((ctx2, now, pad, cs) => {
            const hmid = Math.floor(BOARD_SIZE / 2);
            const bx = pad + hmid * cs;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(250,215,110,' + (0.10 + 0.10 * Math.sin(now / 650)) + ')';
            ctx2.lineWidth = Math.max(1.5, cs * 0.12);
            ctx2.beginPath();
            ctx2.moveTo(bx, pad - cs * 0.5);
            ctx2.lineTo(bx, pad + (BOARD_SIZE - 0.5) * cs);
            ctx2.stroke();
            ctx2.restore();
        });`],
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
    // 離散の可視化: あらゆる石に隣接する空点 (禁手) に薄い×
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 離散: どの石にも隣接する空点は禁手 — 薄い×を刻む
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(120,80,60,0.38)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                const t = cellSize * 0.13;
                ctx.beginPath();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 0) continue;
                    if (!getNeighbors(i).some(n => board[n] === 1 || board[n] === 2)) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                    ctx.moveTo(cx - t, cy - t); ctx.lineTo(cx + t, cy + t);
                    ctx.moveTo(cx - t, cy + t); ctx.lineTo(cx + t, cy - t);
                }
                ctx.stroke();
                ctx.restore();
            }`],
    ...LEGAL_DOTS_SPEC,
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
                    fxText(captured[0], '一撃!', '#ef4444', 1100);
                    fxShake(7, 400);
                    fxGlow(captured[0], '#f87171', 800);
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
    // 一撃未発生の緊張感を示す常時表示
    ...EVENT_CHIP_SPEC(`captures[1] + captures[2] === 0 ? '一撃 未発生' : '一撃 決着'`),
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
    // 宝マスのきらめき + 全近傍を囲んだ側の色で光彩 (得点予告)
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 宝: きらめきと囲み完成の光彩
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            getStarPoints(BOARD_SIZE).forEach((tp, ti) => {
                if (board[tp.y * BOARD_SIZE + tp.x] !== 0) return;
                const cx = pad + tp.x * cs, cy = pad + tp.y * cs;
                const nb = getNeighbors(tp.y * BOARD_SIZE + tp.x).map(i => board[i]);
                const owner = nb.length && nb.every(v => v === 1) ? 1 : (nb.length && nb.every(v => v === 2) ? 2 : 0);
                if (owner) {
                    const pulse = 0.5 + 0.5 * Math.sin(now / 400 + ti);
                    ctx2.globalAlpha = 0.30 + 0.25 * pulse;
                    ctx2.strokeStyle = owner === 1 ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)';
                    ctx2.lineWidth = Math.max(1.5, cs * 0.07);
                    ctx2.beginPath(); ctx2.arc(cx, cy, cs * 0.42, 0, Math.PI * 2); ctx2.stroke();
                }
                const tw = Math.sin(now / 500 + ti * 2.1);
                if (tw > 0.6) {
                    ctx2.globalAlpha = (tw - 0.6) * 2;
                    ctx2.fillStyle = '#fde047';
                    const sx = cx + Math.sin(ti * 13.7) * cs * 0.3, sy = cy + Math.cos(ti * 7.3) * cs * 0.3;
                    const s = cs * 0.10;
                    ctx2.beginPath();
                    ctx2.moveTo(sx, sy - s); ctx2.lineTo(sx + s * 0.3, sy); ctx2.lineTo(sx, sy + s); ctx2.lineTo(sx - s * 0.3, sy);
                    ctx2.closePath(); ctx2.fill();
                }
            });
            ctx2.restore();
        });`],
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
    // 霧表現: 視界外のマスを暗いベールで覆う (石の描画より先に敷く)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 視界外のマスを暗いベールで覆う (自石周辺のみ明るい)
            {
                ctx.save();
                ctx.fillStyle = 'rgba(16,20,34,0.30)';
                for (let fy = 0; fy < BOARD_SIZE; fy++) for (let fx = 0; fx < BOARD_SIZE; fx++) {
                    if (isFogVisible(fy * BOARD_SIZE + fx)) continue;
                    ctx.fillRect(padding + (fx - 0.5) * cellSize, padding + (fy - 0.5) * cellSize, cellSize, cellSize);
                }
                ctx.restore();
            }`],
    // 暗闇の演出: 霧の中を這う影の塊 + 自石の周りに灯りの縁
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 暗闇碁: 視界外を影の塊が静かに這い、自石の周りに灯りの輪が揺れる
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let k = 0; k < 12; k++) {
                const ph = now / 3200 + k * 1.71;
                const x = (Math.sin(ph * 0.77 + k * 3.3) * 0.5 + 0.5) * BOARD_SIZE;
                const y = (Math.sin(ph * 1.03 + k * 1.9) * 0.5 + 0.5) * BOARD_SIZE;
                const xi = Math.max(0, Math.min(BOARD_SIZE - 1, x | 0));
                const yi = Math.max(0, Math.min(BOARD_SIZE - 1, y | 0));
                if (isFogVisible(yi * BOARD_SIZE + xi)) continue;
                ctx2.fillStyle = 'rgba(10,12,26,0.30)';
                ctx2.beginPath();
                ctx2.arc(pad + x * cs, pad + y * cs, cs * (0.6 + 0.25 * Math.sin(ph * 2)), 0, Math.PI * 2);
                ctx2.fill();
            }
            // 自石の周りに薄い灯りの輪 — 「ここだけが見える」を強調
            ctx2.strokeStyle = 'rgba(253,224,71,0.12)';
            ctx2.lineWidth = Math.max(1, cs * 0.05);
            board.forEach((v, i) => {
                if (v !== fogViewer()) return;
                const cx = pad + (i % BOARD_SIZE) * cs;
                const cy = pad + Math.floor(i / BOARD_SIZE) * cs;
                ctx2.beginPath();
                ctx2.arc(cx, cy, cs * (0.55 + 0.08 * Math.sin(now / 500 + i)), 0, Math.PI * 2);
                ctx2.stroke();
            });
            ctx2.restore();
        });`],
    ...STONE_SPEC,
], 'darkgo'));

// 51. ORBITGO (周回碁) — 着手ごとに外周リングが1マス回転
out('orbitgo.html', apply(ALGO, [
    ...rb('ORBITGO', '周回碁', 'orbitgo'),
    [ONE, RV_ALGO, rv([
        '周回ルール: 着手ごとに盤の最外周リング上の石が1マスずつ時計回りに移動する。',
        '外周に置いた石はぐるぐる回り続ける。連が裂かれることもある。',
        '周回で盤面がなかなか落ち着かないため、盤面マス数と同じ手数で自動終了して地集計に入る。',
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
            idxs.forEach((i, k) => {
                board[i] = vals[k];
                if (vals[k] !== 0) fxSlide(idxs[(k - 1 + idxs.length) % idxs.length], i, 380);
            });
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
            applyOrbit();
            // 手数制限: 周回で盤面が収束しないため盤面マス数の手数で自動終了
            if (history.length >= BOARD_SIZE * BOARD_SIZE) endGameByScore();`],
    // 外周リングの回転方向 (時計回り) を枠外の矢印で示す
    CUE_STARS(`            // 外周リングの回転方向を示す矢印
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.55);
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                const ah = cellSize * 0.11, al = cellSize * 0.18;
                const arrow = (cx, cy, dx, dy) => {
                    ctx.beginPath();
                    ctx.moveTo(cx - dx * al - dy * ah, cy - dy * al + dx * ah);
                    ctx.lineTo(cx, cy);
                    ctx.lineTo(cx - dx * al + dy * ah, cy - dy * al - dx * ah);
                    ctx.stroke();
                };
                const mc = padding + (BOARD_SIZE - 1) / 2 * cellSize;
                const e0 = padding * 0.5, e1 = width - padding * 0.5;
                arrow(mc, e0, 1, 0);
                arrow(e1, mc, 0, 1);
                arrow(mc, e1, -1, 0);
                arrow(e0, mc, 0, -1);
                ctx.restore();
            }`),
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

// ============================================================
// ==== 第5バッチ: 追加10派生 ====
// ============================================================

// 53. STARGO (星碁) — 碁ホシ=プラス形5連結のみ
const STAR_MOLS = `        // 碁ホシ: 十字(プラス)形5連結の碁石
        const MOLECULES = {
            PLUS: { name: '碁ホシ', iupac: '十字5', formula: '5連結', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2]] }
        };`;
out('stargo.html', apply(ALGO, [
    ...rb('STARGO', '星碁', 'stargo'),
    [ONE, RV_ALGO, rv([
        'このゲームで使う碁ホシは十字(プラス)形5連結のみ。回転しても同じ形。',
        '四方向に腕を伸ばす形は接触点多く、攻防が激しい。',
    ])],
    [ONE, INFO_ALGO,
`            十字形「碁ホシ」を配置し合う変則囲碁<br>
            PC: クリックで配置 / スマホ: 1タップ目プレビュー、2タップ目確定`],
    [ONE, MOLECULES_ALGO, STAR_MOLS],
    [ONE, OCNT_ALGO, '// 碁ホシ: 十字は回転不変 = 1パターン'],
    [ONE, `let currentPieceType = 'ISOBUTANE';`, `let currentPieceType = 'PLUS';`],
    [ONE, `? s.currentPieceType : 'BUTANE'`, `? s.currentPieceType : 'PLUS'`],
    [ONE, '登場アルカン', '登場碁ホシ'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`碁ホシは十字形5連結のみ。四方向すべてに腕が伸びます。`],
    // 星の顔: 原子球を四隅星の輝き形に差し替え
    [ONE, `                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.fill();`,
`                ctx.beginPath();
                for (let k = 0; k < 8; k++) {
                    const a = k * Math.PI / 4 - Math.PI / 2;
                    const rr = k % 2 === 0 ? R * 1.15 : R * 0.5;
                    const sx = cx + Math.cos(a) * rr, sy = cy + Math.sin(a) * rr;
                    if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
                }
                ctx.closePath();
                ctx.fill();`],
    ...SIZE_91319,
    [ALL, '碁カン', '碁ホシ'],
    [ALL, '全7種1巡', '補充なし'],
], 'stargo'));

// 54. BIGGO (巨大碁) — 碁オオ=3×3ブロック9連結
const BIG_MOLS = `        // 碁オオ: 3x3ブロック9連結の巨大碁石
        const MOLECULES = {
            BIG: { name: '碁オオ', iupac: '正方形9', formula: '9連結', atoms: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]] }
        };`;
out('biggo.html', apply(ALGO, [
    ...rb('BIGGO', '巨大碁', 'biggo'),
    [ONE, RV_ALGO, rv([
        'このゲームで使う碁オオは3×3ブロック (9連結) のみ。',
        '窒息領域は9マス未満 — 小さな囲みは全て死に領域。盤面はすぐ埋まる超高速碁。',
    ])],
    [ONE, INFO_ALGO,
`            3×3ブロック「碁オオ」を配置し合う変則囲碁<br>
            PC: クリックで配置 / スマホ: 1タップ目プレビュー、2タップ目確定`],
    [ONE, MOLECULES_ALGO, BIG_MOLS],
    [ONE, OCNT_ALGO, '// 碁オオ: 正方形は回転不変 = 1パターン'],
    [ONE, `let currentPieceType = 'ISOBUTANE';`, `let currentPieceType = 'BIG';`],
    [ONE, `? s.currentPieceType : 'BUTANE'`, `? s.currentPieceType : 'BIG'`],
    [ONE, '登場アルカン', '登場碁オオ'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`碁オオは3×3の正方形のみ (9連結)。9マス未満の空領域は全て窒息領域です。`],
    // 巨大碁の顔: 原子球を巨石の角柱に差し替え
    [ONE, `                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.fill();`,
`                ctx.beginPath();
                ctx.rect(cx - R * 1.0, cy - R * 1.0, R * 2, R * 2);
                ctx.fill();`],
    ...SIZE_91319,
    [ALL, '碁カン', '碁オオ'],
    [ALL, '全7種1巡', '補充なし'],
], 'biggo'));

// 55. CONNECTGO (連絡碁) — 辺を繋いだら勝ち (Hex的勝利条件)
out('connectgo.html', apply(ALGO, [
    ...rb('CONNECTGO', '連絡碁', 'connectgo'),
    [ONE, RV_ALGO, rv([
        '連絡ルール: 黒は上辺と下辺、白は左辺と右辺を自分の石で連結すれば即勝利 (Hex型)。',
        '連結には通常の「連」(近傍共有)を使う。取り・地集計も通常通り有効。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 連絡ルール<br>
            ※黒は上下辺、白は左右辺を石で連結すれば即勝利`],
    [ONE, `        function endGameByScore() {`,
`        // 連絡勝利判定: 黒=上下辺、白=左右辺を同色連結
        function checkConnectWin(player) {
            const n = BOARD_SIZE;
            const isB = player === 1;
            const starts = [];
            const targets = new Set();
            for (let i = 0; i < n; i++) {
                const a = isB ? i : i * n;
                const b = isB ? (n - 1) * n + i : i * n + (n - 1);
                if (board[a] === player) starts.push(a);
                targets.add(b);
            }
            const seen = new Set(starts);
            const q = [...starts];
            while (q.length) {
                const cur = q.pop();
                if (targets.has(cur)) return true;
                getNeighbors(cur).forEach(nb => {
                    if (!seen.has(nb) && board[nb] === player) { seen.add(nb); q.push(nb); }
                });
            }
            return false;
        }
` + WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    [ONE, CAPTURE_BLOCK,
`${CAPTURE_BLOCK}

            // 連絡勝利判定
            if (checkConnectWin(player)) {
                winByRule(player, '連絡', player === 1 ? '黒が上辺と下辺を連結しました' : '白が左辺と右辺を連結しました');
                return;
            }`],
    // 連絡目標の端帯: 黒=上下辺, 白=左右辺
    CUE_GRID(`            // 連絡目標: 黒は上下辺・白は左右辺に微かな帯
            {
                const gb = cellSize * 0.17;
                const x0 = padding - cellSize * 0.5, y0 = padding - cellSize * 0.5;
                const x1 = padding + (BOARD_SIZE - 0.5) * cellSize, y1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.p2Fill, 0.22);
                ctx.fillRect(x0, y0, gb, y1 - y0);
                ctx.fillRect(x1 - gb, y0, gb, y1 - y0);
                ctx.fillStyle = alphaColor(currentTheme.p1Stroke, 0.13);
                ctx.fillRect(x0, y0, x1 - x0, gb);
                ctx.fillRect(x0, y1 - gb, x1 - x0, gb);
                ctx.restore();
            }`),
    // 連絡の進捗: 目標辺に接している連に色リング (どこまで繋がったか)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 連絡: 目標辺に接地した連を色リングで強調
            {
                const n = BOARD_SIZE;
                const mark = (pl, edges) => {
                    const seen = new Set();
                    edges.forEach(e => {
                        if (board[e] !== pl || seen.has(e)) return;
                        getConnectedGroup(e, pl).forEach(g => seen.add(g));
                    });
                    return seen;
                };
                const bEdge = [], wEdge = [];
                for (let i = 0; i < n; i++) { bEdge.push(i); bEdge.push((n - 1) * n + i); wEdge.push(i * n); wEdge.push(i * n + n - 1); }
                ctx.save();
                [[mark(1, bEdge), 'rgba(30,30,30,0.55)'], [mark(2, wEdge), 'rgba(255,255,255,0.65)']].forEach(([set, col]) => {
                    ctx.strokeStyle = col;
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                    set.forEach(i => {
                        const cx = padding + (i % n) * cellSize, cy = padding + ((i / n) | 0) * cellSize;
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.52, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`],
    ...STONE_SPEC,
], 'connectgo'));

// 56. CENTGO (中心碁) — 使用可能領域が中心から広がる
out('centgo.html', apply(ALGO, [
    ...rb('CENTGO', '中心碁', 'centgo'),
    [ONE, RV_ALGO, rv([
        '中心ルール: 着手できるのは中心からの半径 (2 + 総手数÷6) 以内の点のみ。',
        '盤が埋まるにつれ使える領域が外側へ広がる。6手ごとに半径+1。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 中心ルール<br>
            ※中心からの円内のみ配置可。6手ごとに半径が広がる`],
    [ONE, `        function endGameByScore() {`,
`        // 中心ルール: 許可半径は総手数とともに拡大
        function centRadius() {
            return Math.min((BOARD_SIZE - 1) / 2, 2 + Math.floor(history.length / 6));
        }

        function endGameByScore() {`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 中心ルール: 許可半径内のみ
            {
                const cc = (BOARD_SIZE - 1) / 2;
                const rr = centRadius();
                if (cells.some(p => {
                    const dx = p.x - cc, dy = p.y - cc;
                    return dx * dx + dy * dy > rr * rr + 0.01;
                })) return false;
            }`],
    // 許可領域の円を描画
    [ONE, `            // 星 (天元・星の点)`,
`            // 中心ルール: 現在の許可領域 (円)
            {
                const cc = (BOARD_SIZE - 1) / 2;
                ctx.strokeStyle = 'rgba(37, 99, 235, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.arc(padding + cc * cellSize, padding + cc * cellSize, (centRadius() + 0.5) * cellSize, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // 星 (天元・星の点)`],
    ...EVENT_CHIP_SPEC(`'拡大' + (6 - history.length % 6) + '手'`),
    // 領域拡大の瞬間: 中心からの波紋
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 中心: 6手ごとに許可領域が拡大する瞬間を可視化
            if (history.length % 6 === 0) {
                const cc = ((BOARD_SIZE - 1) / 2) | 0;
                const ci = cc * BOARD_SIZE + cc;
                fxText(ci, '領域拡大', '#3b82f6', 1100);
                fxGlow(ci, '#60a5fa', 800);
                fxBurst(ci, '#60a5fa', 18, 2.4);
            }`],
    ...STONE_SPEC,
], 'centgo'));

// 57. SWITCHGO (転換碁) — 12手ごとに全石の色が反転
out('switchgo.html', apply(ALGO, [
    ...rb('SWITCHGO', '転換碁', 'switchgo'),
    [ONE, RV_ALGO, rv([
        '転換ルール: 合計12手ごとに盤上の全ての石の色が反転する (黒⇔白)。',
        '節目直前の配置で形成した形が相手のものになる — 反転を意識した布石が肝心。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 転換ルール<br>
            ※12手ごとに盤上の全石の色が黒⇔白に反転。200手で自動終局`],
    [ONE, `        function endGameByScore() {`,
`        // 転換: 全石の色反転 + ピース所有色も入れ替え
        function applySwitch() {
            board = board.map(v => v === 1 ? 2 : v === 2 ? 1 : v);
            pieces.forEach(pc => { pc.player = pc.player === 1 ? 2 : 1; });
            deadStones = new Set([...deadStones]); // 死に石表示は維持
            soundManager.playCapture();
            // 転換演出: 盤全体の反転を大きな揺れと告知で
            const cc = Math.floor(BOARD_SIZE / 2) * (BOARD_SIZE + 1);
            fxShake(6, 360);
            fxGlow(cc, 'rgba(244,114,182,0.8)', 800);
            fxText(cc, '転換!', '#f472b6', 1100);
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 転換: 12手ごとに全石が反転
            if (history.length % 12 === 0) applySwitch();
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    ...EVENT_CHIP_SPEC(`'転換' + (12 - history.length % 12) + '手'`),
    ...STONE_SPEC,
], 'switchgo'));

// 58. THUNDERGO (雷碁) — 10手ごとに雷がランダムな連を破壊
out('thundergo.html', apply(ALGO, [
    ...rb('THUNDERGO', '雷碁', 'thundergo'),
    [ONE, RV_ALGO, rv([
        '雷ルール: 合計10手ごとに6石以下のランダムな石連が雷に打たれて消滅する (アゲハマにはならない)。',
        '小さな連も一撃で消えることがある — 盤面の運要素が大きい祭り碁。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 雷ルール<br>
            ※10手ごとに小さな連が雷で消滅 (アゲハマにならない)。200手で自動終局`],
    [ONE, `        function endGameByScore() {`,
`        // 雷: ランダムな小さな連(6石以下)を1つ消滅させる
        function applyThunder() {
            const seen = new Set(), groups = [];
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if ((v !== 1 && v !== 2) || seen.has(i)) continue;
                const g = getConnectedGroup(i, v);
                g.forEach(x => seen.add(x));
                if (g.length <= 6) groups.push(g);
            }
            if (!groups.length) return;
            const group = groups[(Math.random() * groups.length) | 0];
            group.forEach(i => { board[i] = 0; });
            cleanUpPieces();
            soundManager.playCapture();
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 雷: 10手ごとにランダムな連が消滅
            if (history.length % 10 === 0) applyThunder();
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    ...EVENT_CHIP_SPEC(`'落雷' + (10 - history.length % 10) + '手'`),
    ...STONE_SPEC,
], 'thundergo'));

// 59. CYLINDGO (円筒碁) — 左右の端のみ繋がる
out('cylindgo.html', apply(ALGO, [
    ...rb('CYLINDGO', '円筒碁', 'cylindgo'),
    [ONE, RV_ALGO, rv([
        '円筒ルール: 盤の左端と右端が繋がっている (上下は繋がらない)。',
        '端の概念が左右だけ消え、横に回り込んだ取りが成立する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 円筒ルール<br>
            ※左右の端がループして繋がる (上下端は通常通り)`],
    [ONE, NBRS_GRID,
`        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            // 左右はループ (円筒)、上下は通常
            if (x > 0) neighbors.push(idx - 1);
            else neighbors.push(y * BOARD_SIZE + BOARD_SIZE - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            else neighbors.push(y * BOARD_SIZE);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            return neighbors;
        }`],
    ...WRAP_MARKS_SPEC(`chev(padding * 0.55, midC, -1, 0); chev(width - padding * 0.55, midC, 1, 0);`),
    // 円筒: 左右端の石は対側の端にも半透明で映る (ループの可視化)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 円筒: 左右端の石は対側の端にも半透明で映る
            {
                ctx.save();
                ctx.globalAlpha = 0.30;
                for (let y = 0; y < BOARD_SIZE; y++) {
                    [[0, BOARD_SIZE - 1], [BOARD_SIZE - 1, 0]].forEach(([sx, gx]) => {
                        const v = board[y * BOARD_SIZE + sx];
                        if (v !== 1 && v !== 2) return;
                        ctx.fillStyle = v === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                        ctx.beginPath();
                        ctx.arc(padding + gx * cellSize, padding + y * cellSize, cellSize * 0.26, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
                ctx.restore();
            }`],
    ...STONE_SPEC,
], 'cylindgo'));

// 60. MOEBIUSGO (メビウス碁) — 左右端が上下反転して繋がる
out('moebiusgo.html', apply(ALGO, [
    ...rb('MOEBIUSGO', 'メビウス碁', 'moebiusgo'),
    [ONE, RV_ALGO, rv([
        'メビウスルール: 左端から出ると右端に、上下が反転して出てくる (メビウス帯)。',
        'ねじれたトポロジーで連・取りの読みが大きく変わる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + メビウス帯<br>
            ※左端↔右端が上下反転して繋がる (上下端は通常通り)`],
    [ONE, NBRS_GRID,
`        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            // 左右はメビウス帯: 反対端の上下反転位置に繋がる
            if (x > 0) neighbors.push(idx - 1);
            else neighbors.push((BOARD_SIZE - 1 - y) * BOARD_SIZE + BOARD_SIZE - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            else neighbors.push((BOARD_SIZE - 1 - y) * BOARD_SIZE);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            return neighbors;
        }`],
    // 左右端が上下反転して繋がる印: 左は上寄り・右は下寄りのオフセットシェブロン
    ...WRAP_MARKS_SPEC(`chev(padding * 0.55, padding + (BOARD_SIZE - 1) * cellSize * 0.3, -1, 0); chev(width - padding * 0.55, padding + (BOARD_SIZE - 1) * cellSize * 0.7, 1, 0);`),
    // メビウス: 左右端の石は対側の上下反転位置に半透明で映る
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // メビウス: 左右端の石は対側の反転位置に半透明で映る
            {
                ctx.save();
                ctx.globalAlpha = 0.30;
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const fy = BOARD_SIZE - 1 - y;
                    [[0, BOARD_SIZE - 1], [BOARD_SIZE - 1, 0]].forEach(([sx, gx]) => {
                        const v = board[y * BOARD_SIZE + sx];
                        if (v !== 1 && v !== 2) return;
                        ctx.fillStyle = v === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                        ctx.beginPath();
                        ctx.arc(padding + gx * cellSize, padding + fy * cellSize, cellSize * 0.26, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
                ctx.restore();
            }`],
    ...STONE_SPEC,
], 'moebiusgo'));

// 61. QUARTERGO (象限碁) — 手番ごとに使用可能象限が回転
out('quartergo.html', apply(ALGO, [
    ...rb('QUARTERGO', '象限碁', 'quartergo'),
    [ONE, RV_ALGO, rv([
        '象限ルール: 盤を4象限 (左上/右上/左下/右下) に分け、着手はその手番の象限内のみ。',
        '手番ごとに象限が時計回りに切り替わる (盤面の光っている区画が使用可能)。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 象限ルール<br>
            ※着手はその手番の象限のみ。手番ごとに許可象限が回転`],
    [ONE, `        function endGameByScore() {`,
`        // 象限: 現在許可されている象限 (0=左上,1=右上,2=左下,3=右下)
        function allowedQuadrant() {
            return history.length % 4;
        }
        function quadIndex(x, y) {
            const mid = BOARD_SIZE / 2;
            return (x >= mid ? 1 : 0) + (y >= mid ? 2 : 0);
        }

        function endGameByScore() {`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 象限ルール: 全セルが許可象限内
            if (cells.some(p => quadIndex(p.x, p.y) !== allowedQuadrant())) return false;`],
    // 許可象限を薄くハイライト
    [ONE, `            // 星 (天元・星の点)`,
`            // 象限ルール: 許可象限のハイライト
            {
                const mid = BOARD_SIZE / 2;
                const aq = allowedQuadrant();
                const qx = (aq & 1) ? mid : 0;
                const qy = (aq & 2) ? mid : 0;
                ctx.fillStyle = 'rgba(37, 99, 235, 0.10)';
                ctx.fillRect(padding + (qx - 0.5) * cellSize, padding + (qy - 0.5) * cellSize,
                    mid * cellSize, mid * cellSize);
            }

            // 星 (天元・星の点)`],
    // 許可象限の枠が脈動する
    [ONE, FX_BOOT,
`${FX_BOOT}
        fxAmbient((ctx2, now, pad, cs) => {
            const mid = BOARD_SIZE / 2;
            const aq = allowedQuadrant();
            const qx = (aq & 1) ? mid : 0, qy = (aq & 2) ? mid : 0;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(37,99,235,' + (0.30 + 0.22 * Math.sin(now / 450)) + ')';
            ctx2.lineWidth = Math.max(1.5, cs * 0.09);
            ctx2.strokeRect(pad + (qx - 0.5) * cs, pad + (qy - 0.5) * cs, mid * cs, mid * cs);
            ctx2.restore();
        });`],
    ...STONE_SPEC,
], 'quartergo'));

// 62. ESCAPEGO (脱出碁) — 辺に接する連は不死
out('escapego.html', apply(ALGO, [
    ...rb('ESCAPEGO', '脱出碁', 'escapego'),
    [ONE, RV_ALGO, rv([
        '脱出ルール: 盤の辺 (最外周) に接している連は不死 — 呼吸点が0でも取られない。',
        '辺まで伸ばした連は安全。ただし辺に届く前の石は通常通り取られる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 脱出ルール<br>
            ※辺に接する連は不死。辺への接続が死活を左右する`],
    [ONE, `                    if (!hasLiberty) {
                        captured.push(...group);
                    }`,
`                    // 脱出ルール: 辺に接する連は取られない
                    const onEdge = group.some(i => {
                        const gx = i % BOARD_SIZE, gy = (i / BOARD_SIZE) | 0;
                        return gx === 0 || gy === 0 || gx === BOARD_SIZE - 1 || gy === BOARD_SIZE - 1;
                    });
                    if (!hasLiberty && !onEdge) {
                        captured.push(...group);
                    }`],
    // 辺に接する不死連の全石に小さな菱形マーク
    ...STONE_MARKS_SPEC(`            // 辺に接する連は不死 — その連の全石に小さな菱形を刻む
            {
                const seen = new Set();
                const immortal = new Set();
                for (let i = 0; i < board.length; i++) {
                    const c = board[i];
                    if ((c !== 1 && c !== 2) || seen.has(i)) continue;
                    const g = getConnectedGroup(i, c);
                    g.forEach(v => seen.add(v));
                    if (g.some(v => {
                        const gx = v % BOARD_SIZE, gy = (v / BOARD_SIZE) | 0;
                        return gx === 0 || gy === 0 || gx === BOARD_SIZE - 1 || gy === BOARD_SIZE - 1;
                    })) g.forEach(v => immortal.add(v));
                }
                ctx.save();
                ctx.lineWidth = Math.max(1.2, cellSize * 0.04);
                immortal.forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                    const s = cellSize * 0.10;
                    ctx.strokeStyle = board[i] === 1 ? 'rgba(240,235,220,0.85)' : 'rgba(50,40,25,0.8)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - s);
                    ctx.lineTo(cx + s, cy);
                    ctx.lineTo(cx, cy + s);
                    ctx.lineTo(cx - s, cy);
                    ctx.closePath();
                    ctx.stroke();
                });
                ctx.restore();
            }`),
    // 不死の輝き: 辺に接する連に金色の脈動 (脱出=不死の可視化)
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 脱出: 辺に接する不死連に金色の脈動
        fxAmbient((ctx2, now, pad, cs) => {
            const n = BOARD_SIZE, seen = new Set(), imm = new Set();
            for (let i = 0; i < n * n; i++) {
                const c = board[i];
                if ((c !== 1 && c !== 2) || seen.has(i)) continue;
                const g = getConnectedGroup(i, c);
                g.forEach(v => seen.add(v));
                if (g.some(v => {
                    const gx = v % n, gy = (v / n) | 0;
                    return gx === 0 || gy === 0 || gx === n - 1 || gy === n - 1;
                })) g.forEach(v => imm.add(v));
            }
            ctx2.save();
            const pulse = 0.5 + 0.5 * Math.sin(now / 900);
            imm.forEach(i => {
                const cx = pad + (i % n) * cs, cy = pad + ((i / n) | 0) * cs;
                ctx2.globalAlpha = 0.10 + 0.08 * pulse;
                ctx2.fillStyle = '#fbbf24';
                ctx2.beginPath(); ctx2.arc(cx, cy, cs * 0.64, 0, Math.PI * 2); ctx2.fill();
            });
            ctx2.restore();
        });`],
    ...STONE_SPEC,
], 'escapego'));

// ============================================================
// ==== 第6バッチ: 追加10派生 ====
// ============================================================

// 63. SIPHONGO (吸収碁) — 取った敵石は消えず自分の色に変わる
out('siphongo.html', apply(ALGO, [
    ...rb('SIPHONGO', '吸収碁', 'siphongo'),
    [ONE, RV_ALGO, rv([
        '吸収ルール: 呼吸点0になった敵連は消えず、まるごと自分の石に変わる (アゲハマにはならない)。',
        '取り合いがそのまま陣地転換になる — 大連を奪えば一気に盤面が塗り替わる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 吸収ルール<br>
            ※取った敵連は消えず自分の色に変わる (アゲハマにはならない)`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 吸収: 取った連は自分の色に変わる
                captured.forEach(idx => board[idx] = player);
                // 吸収演出: 水色の吸い込み飛沫と吸収数
                captured.forEach(idx => fxBurst(idx, '#22d3ee', 4, 0.9));
                fxText(captured[0], '吸収+' + captured.length, '#0891b2', 1100);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    ...STONE_SPEC,
], 'siphongo'));

// 64. MONOGO (単石碁) — 2石以上の連は不死、単石のみ取れる
out('monogo.html', apply(ALGO, [
    ...rb('MONOGO', '単石碁', 'monogo'),
    [ONE, RV_ALGO, rv([
        '単石ルール: 呼吸点が0になっても、2石以上の連は取られない (不死)。',
        '取れるのは孤立した単石だけ — 早期に連を作ると安全だが隙もできる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 単石ルール<br>
            ※2石以上の連は不死。取れるのは孤立した単石のみ`],
    [ONE, `                    if (!hasLiberty) {
                        captured.push(...group);
                    }`,
`                    // 単石ルール: 2石以上の連は取られない
                    if (!hasLiberty && group.length === 1) {
                        captured.push(...group);
                    }`],
    ...STONE_MARKS_SPEC(`            // 取れるのは孤立単石のみ — 孤立石に小さな角□を刻む
            {
                const seen = new Set();
                ctx.save();
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2 || seen.has(i)) continue;
                    const g = getConnectedGroup(i, v);
                    g.forEach(j => seen.add(j));
                    if (g.length !== 1) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + ((i / BOARD_SIZE) | 0) * cellSize, s = cellSize * 0.09;
                    ctx.strokeStyle = v === 1 ? 'rgba(240,235,220,0.85)' : 'rgba(50,40,25,0.8)';
                    ctx.strokeRect(cx - s, cy - s, s * 2, s * 2);
                }
                ctx.restore();
            }`),
    // 単石の危険度: 呼吸点1以下の孤立石 (次に取られる) を赤く点滅
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 単石の危険度: 呼吸点1以下の孤立石を赤く点滅
        fxAmbient((ctx2, now, pad, cs) => {
            const n = BOARD_SIZE, seen = new Set();
            ctx2.save();
            for (let i = 0; i < n * n; i++) {
                const v = board[i];
                if ((v !== 1 && v !== 2) || seen.has(i)) continue;
                const g = getConnectedGroup(i, v);
                g.forEach(j => seen.add(j));
                if (g.length !== 1) continue;
                if (getLiberties(board, i) > 1) continue;
                const cx = pad + (i % n) * cs, cy = pad + ((i / n) | 0) * cs;
                const pulse = 0.5 + 0.5 * Math.sin(now / 200);
                ctx2.globalAlpha = 0.45 + 0.45 * pulse;
                ctx2.strokeStyle = '#ef4444';
                ctx2.lineWidth = Math.max(1.6, cs * 0.08);
                ctx2.beginPath(); ctx2.arc(cx, cy, cs * 0.58, 0, Math.PI * 2); ctx2.stroke();
            }
            ctx2.restore();
        });`],
    ...STONE_SPEC,
], 'monogo'));

// 65. REGGO (上限碁) — 自連は最大3石まで
out('reggo.html', apply(ALGO, [
    ...rb('REGGO', '上限碁', 'reggo'),
    [ONE, RV_ALGO, rv([
        '上限ルール: 着手の結果、自分の連が4石以上になる手は禁止 (連は最大3石)。',
        '大きな連を作れないため、小規模な攻防の連続になる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 上限ルール<br>
            ※自分の連は最大3石まで (4連以上になる着手は禁止)`],
    [ONE, `            // コウ判定: 相手の直前の着手前と同一の盤面になる手は禁止
            if (captured.length > 0 && prevBoard) {
                if (after.every((v, i) => v === prevBoard[i])) return false;
            }
            return true;`,
`            // コウ判定: 相手の直前の着手前と同一の盤面になる手は禁止
            if (captured.length > 0 && prevBoard) {
                if (after.every((v, i) => v === prevBoard[i])) return false;
            }

            // 上限ルール: 着手後に4石以上の連ができる手は禁止
            for (const p of cells) {
                const grp = new Set([p.y * BOARD_SIZE + p.x]);
                const q = [...grp];
                while (q.length) {
                    const cur = q.pop();
                    getNeighbors(cur).forEach(n => {
                        if (after[n] === player && !grp.has(n)) { grp.add(n); q.push(n); }
                    });
                }
                if (grp.size > 3) return false;
            }
            return true;`],
    ...LEGAL_DOTS_SPEC,
    // 上限3: 各連の石数を刻む (3=上限到達で赤強調)
    ...STONE_MARKS_SPEC(`            {
                const seen = new Set();
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.round(cellSize * 0.34) + 'px sans-serif';
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if ((v !== 1 && v !== 2) || seen.has(i)) continue;
                    const g = getConnectedGroup(i, v);
                    g.forEach(j => seen.add(j));
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                    const full = g.length >= 3;
                    ctx.fillStyle = full ? '#ef4444' : (v === 1 ? 'rgba(240,235,220,0.9)' : 'rgba(50,40,25,0.85)');
                    ctx.fillText(String(g.length), cx + cellSize * 0.30, cy - cellSize * 0.30);
                }
                ctx.restore();
            }`),
    ...STONE_SPEC,
], 'reggo'));

// 66. ANTIGRAVGO (反重力碁) — 上向き重力
out('antigravgo.html', apply(ALGO, [
    ...rb('ANTIGRAVGO', '反重力碁', 'antigravgo'),
    [ONE, RV_ALGO, rv([
        '反重力ルール: 石は上に落ちる — 最上段か、直上に石がある点にしか置けない。',
        '上から積み下ろす逆さまの重力碁。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 反重力ルール<br>
            ※最上段か石の直下のみ配置可 (上向きに積み上がる)`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 反重力: 最上段か、直上に石がある点のみ
            if (cells.some(p => p.y !== 0 && board[(p.y - 1) * BOARD_SIZE + p.x] === 0)) return false;`],
    // 反重力方向の印: 上端余白の小さな三角
    CUE_STARS(`            // 反重力の印: 上端中央の上向き三角
            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.6);
                const gx = padding + (BOARD_SIZE - 1) / 2 * cellSize, gy = padding * 0.42;
                const gs = cellSize * 0.11;
                ctx.beginPath();
                ctx.moveTo(gx - gs, gy + gs * 0.6);
                ctx.lineTo(gx + gs, gy + gs * 0.6);
                ctx.lineTo(gx, gy - gs * 0.8);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }`),
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
], 'antigravgo'));

// 67. FOURGO (四方重力碁) — 着手ごとに重力方向が回転
out('fourgo.html', apply(ALGO, [
    ...rb('FOURGO', '四方重力碁', 'fourgo'),
    [ONE, RV_ALGO, rv([
        '四方重力ルール: 手番ごとに重力方向が 下→左→上→右 と回転する。',
        '着手はその手番の重力方向で「端に接するか、直下に石がある」点のみ。',
        '手番表示の矢印が現在の重力方向。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 四方重力ルール<br>
            ※重力方向が手番ごとに回転 (下→左→上→右)。矢印方向の端か石の上のみ配置可`],
    [ONE, `        function endGameByScore() {`,
`        // 四方重力: 現在の重力方向ベクトル
        function gravityDir() {
            return [[0, 1], [-1, 0], [0, -1], [1, 0]][history.length % 4];
        }

        function endGameByScore() {`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 四方重力: 重力方向の端か、その直下に石がある点のみ
            {
                const gd = gravityDir();
                if (cells.some(p => {
                    const nx = p.x + gd[0], ny = p.y + gd[1];
                    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return false;
                    return board[ny * BOARD_SIZE + nx] === 0;
                })) return false;
            }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + ' ' + ['↓','←','↑','→'][history.length % 4];`],
    // 現在の重力方向をその辺の余白に三角で示す
    CUE_STARS(`            // 重力方向の印: 現在方向の辺の余白に三角
            {
                const gd = gravityDir();
                const s = cellSize * 0.13;
                const mid = padding + (BOARD_SIZE - 1) / 2 * cellSize;
                const acx = mid + gd[0] * (width / 2 - padding * 0.42);
                const acy = mid + gd[1] * (width / 2 - padding * 0.42);
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.65);
                ctx.beginPath();
                ctx.moveTo(acx + gd[0] * s, acy + gd[1] * s);
                ctx.lineTo(acx - gd[0] * s * 0.6 - gd[1] * s * 0.55, acy - gd[1] * s * 0.6 + gd[0] * s * 0.55);
                ctx.lineTo(acx - gd[0] * s * 0.6 + gd[1] * s * 0.55, acy - gd[1] * s * 0.6 - gd[0] * s * 0.55);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }`),
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
], 'fourgo'));

// 68. PUSHCHAINGO (連鎖押し碁) — 押した石が連鎖して押す
out('pushchaingo.html', apply(ALGO, [
    ...rb('PUSHCHAINGO', '連鎖押し碁', 'pushchaingo'),
    [ONE, RV_ALGO, rv([
        '連鎖押しルール: 置いた石に隣接する敵石を1マス押す。行き先が敵石なら連鎖して押し続ける。',
        '行き先が盤外か自分の石なら押せない (何も起きない)。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 連鎖押しルール<br>
            ※隣接する敵石を1マス押す。押された先が敵石なら連鎖`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 連鎖押し: 隣接する敵石を方向へ押す (列が続けば連鎖)
            {
                const opp2 = player === 1 ? 2 : 1;
                move.cells.forEach(p => {
                    getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => {
                        if (board[n] !== opp2) return;
                        const dx = (n % BOARD_SIZE) - p.x;
                        const dy = ((n / BOARD_SIZE) | 0) - p.y;
                        const chain = [];
                        let cx = n % BOARD_SIZE, cy = (n / BOARD_SIZE) | 0;
                        while (true) {
                            if (board[cy * BOARD_SIZE + cx] === 0) break;
                            if (board[cy * BOARD_SIZE + cx] === player) return;
                            chain.push(cy * BOARD_SIZE + cx);
                            cx += dx; cy += dy;
                            if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) return;
                        }
                        for (let k = chain.length - 1; k >= 0; k--) {
                            board[chain[k] + dx + dy * BOARD_SIZE] = board[chain[k]];
                            board[chain[k]] = 0;
                        }
                    });
                });
                cleanUpPieces();
            }`],
    ...STONE_SPEC,
], 'pushchaingo'));

// 69. TWILIGHTGO (黄昏碁) — 昼=自由配置、夜=自石隣接のみ
out('twilightgo.html', apply(ALGO, [
    ...rb('TWILIGHTGO', '黄昏碁', 'twilightgo'),
    [ONE, RV_ALGO, rv([
        '黄昏ルール: 12手周期で昼と夜が交互に来る。昼 (前半6手) は通常配置、',
        '夜 (後半6手) は自分の石に隣接する点にしか置けない (自石が無ければどこでも可)。',
        '手番表示の ☀/☾ が現在のフェーズ。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 黄昏ルール<br>
            ※昼(6手)=自由配置、夜(6手)=自石隣接のみ。☀/☾表示`],
    [ONE, `        function endGameByScore() {`,
`        // 黄昏: 12手周期の後半6手が「夜」
        function isNight() {
            return Math.floor(history.length / 6) % 2 === 1;
        }

        function endGameByScore() {`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 黄昏ルール: 夜は自石隣接のみ
            if (isNight() && board.some(v => v === player) &&
                !cells.some(p => getNeighbors(p.y * BOARD_SIZE + p.x).some(n => board[n] === player))) return false;`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + (isNight() ? ' ☾' : ' ☀');`],
    // 夜は盤全体を薄く冷たく沈める
    CUE_GRID(`            // 黄昏: 夜の間は盤全体を冷色のヴェールで覆う
            if (isNight()) {
                ctx.save();
                ctx.fillStyle = 'rgba(30,40,70,0.15)';
                ctx.fillRect(0, 0, width, width);
                ctx.restore();
            } else {
                ctx.save();
                ctx.fillStyle = 'rgba(255,230,150,0.05)';
                ctx.fillRect(0, 0, width, width);
                ctx.restore();
            }`),
    // 昼夜の切替を「昼/夜」のフラッシュで知らせる
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 黄昏碁: 6手ごとの昼夜切替を盤上の表示で発火
            if (history.length % 6 === 0 && history.length > 0) {
                const tc = move.cells[0];
                if (tc) {
                    const ti = tc.y * BOARD_SIZE + tc.x;
                    fxText(ti, isNight() ? '夜 ☾' : '昼 ☀', isNight() ? '#93c5fd' : '#fde68a', 1200);
                    fxGlow(ti, isNight() ? '#60a5fa' : '#fbbf24', 800);
                }
            }

            turn = opponent;`],
    // 夜の星空と昼の陽光の燦めき — フェーズが一目で分かる常時演出
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 黄昏碁: 夜は瞬く星、昼は陽光の燦めきが舞う常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            if (isNight()) {
                for (let k = 0; k < 16; k++) {
                    const tw = Math.sin(now / 400 + k * 2.7);
                    if (tw < 0.2) continue;
                    ctx2.globalAlpha = 0.10 + tw * 0.20;
                    ctx2.fillStyle = '#e0e7ff';
                    ctx2.beginPath();
                    ctx2.arc((Math.sin(k * 12.9898) * 0.5 + 0.5) * w, (Math.sin(k * 78.233) * 0.5 + 0.5) * w, cs * 0.05, 0, Math.PI * 2);
                    ctx2.fill();
                }
            } else {
                for (let k = 0; k < 8; k++) {
                    const ph = now / 2600 + k * 1.9;
                    ctx2.globalAlpha = 0.06 + 0.07 * Math.sin(ph * 2 + k);
                    ctx2.fillStyle = '#fbbf24';
                    ctx2.beginPath();
                    ctx2.arc((Math.sin(ph * 0.6 + k * 2.9) * 0.5 + 0.5) * w, (Math.cos(ph * 0.8 + k * 1.7) * 0.5 + 0.5) * w, cs * 0.14, 0, Math.PI * 2);
                    ctx2.fill();
                }
            }
            ctx2.restore();
        });`],
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
], 'twilightgo'));

// 70. HYDRAGO (ヒドラ碁) — 取られた石が隣の空点に復活
out('hydrago.html', apply(ALGO, [
    ...rb('HYDRAGO', 'ヒドラ碁', 'hydrago'),
    [ONE, RV_ALGO, rv([
        'ヒドラルール: 取られた石は隣のランダムな空点に1つずつ復活する (復活先がなければ消える)。',
        'ただし復活は各石1回だけ — 再生した石をもう一度取れば完全に取り切れる。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + ヒドラルール<br>
            ※取られた石は隣のランダムな空点に1回だけ復活。200手で自動終局`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let hydraUsed = new Set(); // 復活済みの石 (二度目は消える)`],
    [ONE, RESET_BOARD,
`${RESET_BOARD}
            hydraUsed = new Set();`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                // ヒドラ: 取られた石は隣の空点に1回だけランダム復活
                captured.forEach(idx => {
                    if (hydraUsed.has(idx)) { hydraUsed.delete(idx); return; }
                    const cand = getNeighbors(idx).filter(i => board[i] === 0);
                    if (cand.length) {
                        const ni = cand[(Math.random() * cand.length) | 0];
                        board[ni] = opponent;
                        hydraUsed.add(ni);
                        // 再生: 取跡から新しい頭が生える
                        fxSlide(idx, ni, 420);
                        fxGlow(ni, 'rgba(52,211,153,0.85)', 650);
                    }
                });
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    // 再生済みヒドラ頭に緑の小点
    ...STONE_MARKS_SPEC(`            // 再生済みヒドラ頭: 緑の小点 (もう取り切れる印)
            {
                ctx.save();
                ctx.fillStyle = 'rgba(52,211,153,0.95)';
                for (const idx of hydraUsed) {
                    const v = board[idx];
                    if (v !== 1 && v !== 2) continue;
                    const cx = padding + (idx % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(idx / BOARD_SIZE) * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.10, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                hydraUsed: [...hydraUsed],
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            hydraUsed = new Set(snap.hydraUsed || []);`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    hydraUsed: [...hydraUsed],
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            hydraUsed = new Set(s.hydraUsed || []);`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                hydraUsed: [...hydraUsed],
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (Array.isArray(data.hydraUsed)) hydraUsed = new Set(data.hydraUsed);`],
    ...STONE_SPEC,
], 'hydrago'));

// 71. GHOSTGO (幽霊碁) — 取られたマスに6手間だけ幽霊が残る
out('ghostgo.html', apply(ALGO, [
    ...rb('GHOSTGO', '幽霊碁', 'ghostgo'),
    [ONE, RV_ALGO, rv([
        '幽霊ルール: 取られた石は消えず「幽霊」となって6手間そのマスを塞ぐ。',
        '幽霊は置けず呼吸点にもならないが、6手経つと消えて空点に戻る。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 幽霊ルール<br>
            ※取られたマスは幽霊となり6手間だけ塞がる`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let ghostTimer = []; // 幽霊の残りターン (idxごと)`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            ghostTimer = Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 幽霊: 取られたマスは幽霊(4)として6手間残る
                captured.forEach(idx => { board[idx] = 4; ghostTimer[idx] = 6; fxGlow(idx, 'rgba(165,190,235,0.9)', 650); });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 幽霊の消滅カウントダウン
            for (let gi = 0; gi < ghostTimer.length; gi++) {
                if (ghostTimer[gi] > 0 && --ghostTimer[gi] === 0 && board[gi] === 4) {
                    board[gi] = 0;
                    fxSplash(gi, '#aabde0', 7);
                }
            }`],
    // 幽霊の描画
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 幽霊マスの描画 (漂う半透明の亡霊 + 残り手数)
            {
                const now = fxNow();
                for (let gy = 0; gy < BOARD_SIZE; gy++) {
                    for (let gx = 0; gx < BOARD_SIZE; gx++) {
                        const gi = gy * BOARD_SIZE + gx;
                        if (board[gi] !== 4) continue;
                        const bx = padding + gx * cellSize;
                        const by = padding + gy * cellSize;
                        const remain = ghostTimer[gi] || 0;
                        const bob = Math.sin(now / 420 + gi * 1.9) * cellSize * 0.04;
                        const gw = cellSize * 0.30;
                        ctx.save();
                        ctx.globalAlpha = 0.22 + 0.55 * (remain / 6);
                        // 丸い頭と波打つ裾のシルエット
                        const g2 = ctx.createLinearGradient(bx, by - gw, bx, by + gw * 1.4);
                        g2.addColorStop(0, 'rgba(196,210,240,0.95)');
                        g2.addColorStop(1, 'rgba(150,170,210,0.30)');
                        ctx.fillStyle = g2;
                        ctx.beginPath();
                        ctx.arc(bx, by + bob - cellSize * 0.05, gw, Math.PI, 0);
                        ctx.lineTo(bx + gw, by + bob + gw * 0.5);
                        for (let k = 0; k < 3; k++) {
                            const wx = bx + gw - (k + 0.5) * (gw * 2 / 3);
                            ctx.quadraticCurveTo(wx + gw / 6, by + bob + gw * 1.0 + Math.sin(now / 300 + k + gi) * cellSize * 0.03,
                                wx - gw / 6, by + bob + gw * 0.55);
                        }
                        ctx.closePath();
                        ctx.fill();
                        // 目と口
                        ctx.fillStyle = 'rgba(30,35,60,0.8)';
                        ctx.beginPath();
                        ctx.arc(bx - gw * 0.35, by + bob - gw * 0.2, cellSize * 0.045, 0, Math.PI * 2);
                        ctx.arc(bx + gw * 0.35, by + bob - gw * 0.2, cellSize * 0.045, 0, Math.PI * 2);
                        ctx.arc(bx, by + bob + gw * 0.15, cellSize * 0.05, 0, Math.PI * 2);
                        ctx.fill();
                        // 残り手数
                        ctx.fillStyle = 'rgba(225,235,255,0.95)';
                        ctx.font = 'bold ' + Math.round(cellSize * 0.30) + 'px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(String(remain), bx, by + cellSize * 0.42);
                        ctx.restore();
                    }
                }
            }`],
    [ONE, FALLBACK_SKIP,
`                    if (val !== 1 && val !== 2) continue; // 空点・幽霊は石として描かない`],
    [ONE, TOGGLE_GUARD,
`            const color = board[startIdx];
            if (color === 0 || color === 4) return;`],
    // 幽霊の永続化・同期
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    ghostTimer,
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            ghostTimer = Array.isArray(s.ghostTimer) ? s.ghostTimer : Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                ghostTimer,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (Array.isArray(data.ghostTimer)) ghostTimer = data.ghostTimer;`],
    // undo用スナップショット
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                ghostTimer: [...ghostTimer],
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            ghostTimer = snap.ghostTimer ? [...snap.ghostTimer] : ghostTimer;`],
    // 漂う霧 (幽霊の揺らぎを動かす駆動にもなる)
    [ONE, FX_BOOT, FX_BOOT + AMBIENT_MIST('170,190,220')],
    ...STONE_SPEC,
], 'ghostgo'));

// 72. KLEINGO (クライン碁) — 両軸ループ+横は反転 (クライン瓶)
out('kleingo.html', apply(ALGO, [
    ...rb('KLEINGO', 'クライン碁', 'kleingo'),
    [ONE, RV_ALGO, rv([
        'クライン瓶ルール: 左右端は上下反転で繋がり、上下端も普通にループする。',
        'トーラスよりさらにねじれたトポロジー。全ての端が存在しない。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + クライン瓶<br>
            ※左右端は上下反転で接続、上下端もループ。端は存在しない`],
    [ONE, NBRS_GRID,
`        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            // 左右: 反転ループ (クライン瓶のねじれ)
            if (x > 0) neighbors.push(idx - 1);
            else neighbors.push((BOARD_SIZE - 1 - y) * BOARD_SIZE + BOARD_SIZE - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            else neighbors.push((BOARD_SIZE - 1 - y) * BOARD_SIZE);
            // 上下: 通常ループ
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            else neighbors.push((BOARD_SIZE - 1) * BOARD_SIZE + x);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            else neighbors.push(x);

            return neighbors;
        }`],
    // 左右=反転ループ(オフセット), 上下=通常ループ(中央)
    ...WRAP_MARKS_SPEC(`chev(padding * 0.55, padding + (BOARD_SIZE - 1) * cellSize * 0.3, -1, 0); chev(width - padding * 0.55, padding + (BOARD_SIZE - 1) * cellSize * 0.7, 1, 0); chev(midC, padding * 0.55, 0, -1); chev(midC, width - padding * 0.55, 0, 1);`),
    // クライン瓶: 端の石は対側にも半透明で映る (左右は上下反転)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // クライン瓶: 端の石は対側にも半透明で映る (左右は反転位置)
            {
                ctx.save();
                ctx.globalAlpha = 0.30;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const v = board[y * BOARD_SIZE + x];
                    if (v !== 1 && v !== 2) continue;
                    ctx.fillStyle = v === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                    const ghost = (gx, gy) => {
                        ctx.beginPath();
                        ctx.arc(padding + gx * cellSize, padding + gy * cellSize, cellSize * 0.26, 0, Math.PI * 2);
                        ctx.fill();
                    };
                    if (x === 0) ghost(BOARD_SIZE - 1, BOARD_SIZE - 1 - y);
                    if (x === BOARD_SIZE - 1) ghost(0, BOARD_SIZE - 1 - y);
                    if (y === 0) ghost(x, BOARD_SIZE - 1);
                    if (y === BOARD_SIZE - 1) ghost(x, 0);
                }
                ctx.restore();
            }`],
    ...STONE_SPEC,
], 'kleingo'));

// ============================================================
// ==== 第7バッチ: 追加10派生 ====
// ============================================================

// 73. ZOMBEGO (ゾンビ碁) — 取られた石は徘徊する中立ゾンビになる
out('zombego.html', apply(ALGO, [
    ...rb('ZOMBEGO', 'ゾンビ碁', 'zombego'),
    [ONE, RV_ALGO, rv([
        'ゾンビルール: 取られた石は中立の「ゾンビ」(壁ブロック) になり、毎手ランダムに隣の空点へ徘徊する。',
        'ゾンビは置けず呼吸点にも地にもならない。徘徊で開いたり塞いだりする盤面が生まれる。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + ゾンビルール<br>
            ※取られた石は中立ゾンビになり毎手ランダム徘徊する`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let zombies = []; // ゾンビの盤面インデックス一覧`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            zombies = [];`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // ゾンビ: 取られたマスは中立ゾンビ(壁)になる
                captured.forEach(idx => { board[idx] = 3; zombies.push(idx); fxGlow(idx, '#a3e635', 620); });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // ゾンビ徘徊: 各ゾンビがランダムな空点へ1マス移動
            zombies = zombies.filter(zi => board[zi] === 3);
            zombies.forEach((zi, k) => {
                const cand = getNeighbors(zi).filter(i => board[i] === 0);
                if (!cand.length) return;
                const ni = cand[(Math.random() * cand.length) | 0];
                board[ni] = 3; board[zi] = 0; zombies[k] = ni;
                fxSlide(zi, ni, 520); // 徘徊の軌跡
            });`],
    // undo/保存/同期
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                zombies: [...zombies],
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            zombies = snap.zombies ? [...snap.zombies] : zombies;`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    zombies: [...zombies],
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            zombies = Array.isArray(s.zombies) ? [...s.zombies] : [];`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                zombies,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (Array.isArray(data.zombies)) zombies = [...data.zombies];`],
    // ゾンビは腐ったオリーブ肌 + 瞬く赤い目
    [ONE, COVERED_ANCHOR, texDraw(PAINT_ZOMBIE)],
    ...WALL_GUARD_SPEC,
    // ゾンビの目の瞬きを動かす霧
    [ONE, FX_BOOT, FX_BOOT + AMBIENT_MIST('150,180,110')],
    ...STONE_SPEC,
], 'zombego'));

// 74. RELAYGO (追撃碁) — 相手の直前の着手の近くにしか置けない
out('relaygo.html', apply(ALGO, [
    ...rb('RELAYGO', '追撃碁', 'relaygo'),
    [ONE, RV_ALGO, rv([
        '追撃ルール: 相手の直前の着手からマンハッタン距離4以内にしか置けない。',
        '戦線が相手の着手を追いかける形で進む。序盤1手目のみ自由配置。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 追撃ルール<br>
            ※相手の直前着手から距離4以内のみ配置可`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 追撃ルール: 相手の直前着手から距離4以内
            if (lastMove && lastMove.player !== player) {
                const ok = cells.some(p => lastMove.cells.some(lp =>
                    Math.abs(lp.x - p.x) + Math.abs(lp.y - p.y) <= 4));
                if (!ok) return false;
            }`],
    // 追撃域: 相手の直前着手から距離4の菱形を示す
    CUE_GRID(`            // 追撃域: 相手の直前着手からマンハッタン距離4の範囲
            if (lastMove && lastMove.player !== turn && !gameOver) {
                ctx.save();
                lastMove.cells.forEach(lp => {
                    const cx = padding + lp.x * cellSize, cy = padding + lp.y * cellSize;
                    const r = 4.4 * cellSize;
                    ctx.fillStyle = 'rgba(251,146,60,0.06)';
                    ctx.strokeStyle = 'rgba(251,146,60,0.5)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.setLineDash([cellSize * 0.14, cellSize * 0.10]);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - r);
                    ctx.lineTo(cx + r, cy);
                    ctx.lineTo(cx, cy + r);
                    ctx.lineTo(cx - r, cy);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                });
                ctx.restore();
            }`),
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
], 'relaygo'));

// 75. SUMGO (実子碁) — 地+生き石の合算得点 (中国式風)
out('sumgo.html', apply(ALGO, [
    ...rb('SUMGO', '実子碁', 'sumgo'),
    [ONE, RV_ALGO, rv([
        '実子ルール: 得点 = 地 + 盤上の生き石 + アゲハマ (+白はコミ)。中国式の子地皆数に近い。',
        '石を置くこと自体が得点なので地の詰め合いより勢力拡大が重要。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 実子得点<br>
            ※得点=地+盤上の石数+アゲハマ (中国式風)`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackStones = board.filter(v => v === 1).length;
            const whiteStones = board.filter(v => v === 2).length;
            const blackTotal = territory.black + blackStones + captures[1];
            const whiteTotal = territory.white + whiteStones + captures[2] + komi;`],
    [ONE, `<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の生き石:</span> <strong>\${blackStones}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の生き石:</span> <strong>\${whiteStones}</strong></div>`],
    // 実子: 盤上の生き石数を常時表示 (石がそのまま得点)
    ...EVENT_CHIP_SPEC(`'実子 ' + board.filter(v => v === 1).length + '-' + board.filter(v => v === 2).length`),
    ...STONE_SPEC,
], 'sumgo'));

// 76. FUELGO (燃料碁) — 遠くに置くほど燃料を消費
out('fuelgo.html', apply(ALGO, [
    ...rb('FUELGO', '燃料碁', 'fuelgo'),
    [ONE, RV_ALGO, rv([
        '燃料ルール: 各プレイヤーは燃料を25持つ。着手は最寄りの自石までのマンハッタン距離分の燃料を消費。',
        '燃料不足の手は打てない (自石隣接なら0消費)。燃料切れ後は自石隣接のみ。盤上に自石が無ければ消費0。',
        '手番表示の後ろの数値が残燃料。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 燃料ルール<br>
            ※着手は自石までの距離分の燃料を消費 (初期25)。切れると隣接のみ`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let fuel = { 1: 25, 2: 25 }; // 燃料ルール
        function fuelCost(player, cells) {
            // 着手セル自身は距離0の自石として数えない
            const placed = new Set(cells.map(p => p.y * BOARD_SIZE + p.x));
            let best = Infinity, has = false;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || placed.has(i)) continue;
                has = true;
                const bx = i % BOARD_SIZE, by = (i / BOARD_SIZE) | 0;
                cells.forEach(p => {
                    best = Math.min(best, Math.abs(p.x - bx) + Math.abs(p.y - by));
                });
            }
            return has ? best : 0;
        }`],
    [ONE, RESET_HELD,
`${RESET_HELD}
            fuel = { 1: 25, 2: 25 };`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 燃料ルール: 距離分の燃料が足りなければ置けない
            if (fuelCost(player, cells) > fuel[player]) return false;`],
    [ONE, PIECES_PUSH,
`            // 燃料消費を着手点に表示
            {
                const cost = fuelCost(player, move.cells);
                fuel[player] -= cost;
                if (cost > 0) fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '-' + cost + '⛽', '#f59e0b', 1000);
            }

${PIECES_PUSH}`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + ' ⛽' + fuel[turn];`],
    // undo/保存/同期
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                fuel: { ...fuel },
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            if (snap.fuel) fuel = { ...snap.fuel };`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    fuel: { ...fuel },
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            if (s.fuel) fuel = { ...s.fuel };`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                fuel: { ...fuel },
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.fuel) fuel = { ...data.fuel };`],
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
], 'fuelgo'));

// 77. STRIPEGO (縞碁) — 奇数行は壁のストライプ盤
out('stripego.html', apply(ALGO, [
    ...rb('STRIPEGO', '縞碁', 'stripego'),
    [ONE, RV_ALGO, rv([
        '縞盤ルール: 奇数行は全て壁 (使用不能)。石は偶数行のレーン上でのみ戦う。',
        '上下の呼吸点が無いため、各レーンは事実上1次元の取り合い。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 縞盤<br>
            ※奇数行は壁。偶数行のレーン上でのみ戦う。200手で自動終局`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 縞盤: 奇数行を壁にする
            for (let y = 1; y < BOARD_SIZE; y += 2)
                for (let x = 0; x < BOARD_SIZE; x++) board[y * BOARD_SIZE + x] = 3;`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局 (レーン上の追跡膠着を防ぐ)
            if (history.length >= 200) { endGameByScore(); return; }`],
    // 奇数行は暗い溝
    [ONE, COVERED_ANCHOR, texDraw(PAINT_RIFT('rgba(185,150,95,0.4)'))],
    ...WALL_GUARD_SPEC,
    ...STONE_SPEC,
], 'stripego'));

// 78. DRIFTGO (漂流碁) — 8手ごとに全石がランダム方向に1マス流される
out('driftgo.html', apply(ALGO, [
    ...rb('DRIFTGO', '漂流碁', 'driftgo'),
    [ONE, RV_ALGO, rv([
        '漂流ルール: 合計8手ごとに盤上の全石がランダムな方向 (上下左右) に1マス流される。',
        '行き先が塞がっている石は動かない。陣形が不定期に流される混沌碁。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 漂流ルール<br>
            ※8手ごとに全石がランダム方向へ1マス流される。200手で自動終局`],
    [ONE, `        function endGameByScore() {`,
`        // 漂流: 全石を1マスランダム方向へ (衝突は移動しない)
        function applyDrift() {
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            const arrows = ['\\u2192', '\\u2190', '\\u2193', '\\u2191'];
            const di = (Math.random() * 4) | 0;
            const [dx, dy] = dirs[di];
            const n = BOARD_SIZE;
            const order = [];
            for (let i = 0; i < n * n; i++)
                order.push({ i, key: (i % n) * dx + ((i / n) | 0) * dy });
            order.sort((a, b) => b.key - a.key); // 進行方向の先頭から処理
            const moved = {};
            order.forEach(({ i }) => {
                if (board[i] !== 1 && board[i] !== 2) return;
                const x = i % n, y = (i / n) | 0, nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= n || ny < 0 || ny >= n) return;
                const ni = ny * n + nx;
                if (board[ni] === 0) { board[ni] = board[i]; board[i] = 0; moved[i] = ni; fxSlide(i, ni, 380); }
            });
            pieces.forEach(pc => {
                pc.cells = pc.cells.map(p => {
                    const i = p.y * BOARD_SIZE + p.x;
                    return moved[i] === undefined ? p
                        : { x: moved[i] % BOARD_SIZE, y: (moved[i] / BOARD_SIZE) | 0 };
                });
            });
            if (lastMove) lastMove = { player: lastMove.player, cells: lastMove.cells.map(p => {
                const i = p.y * BOARD_SIZE + p.x;
                return moved[i] === undefined ? p
                    : { x: moved[i] % BOARD_SIZE, y: (moved[i] / BOARD_SIZE) | 0 };
            }) };
            if (Object.keys(moved).length) {
                fxShake(2, 180);
                const cc = Math.floor(n / 2) * n + Math.floor(n / 2);
                fxText(cc, arrows[di], '#7dd3fc', 900);
            }
            cleanUpPieces();
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 漂流: 8手ごとに全石が流れる
            if (history.length % 8 === 0) applyDrift();
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    ...EVENT_CHIP_SPEC(`'漂流' + (8 - history.length % 8) + '手'`),
    ...STONE_SPEC,
], 'driftgo'));

// 79. LASTGO (終着碁) — 最後に石を置いた側が勝つ
out('lastgo.html', apply(ALGO, [
    ...rb('LASTGO', '終着碁', 'lastgo'),
    [ONE, RV_ALGO, rv([
        '終着ルール: 双方パスで終局したとき、地の数ではなく「最後に石を置いた側」が勝つ (正常形の終局)。',
        '置ききれる場所を残す側が有利 — 序盤から終盤の手数まで読む碁。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 終着ルール<br>
            ※終局時「最後に石を置いた側」の勝ち (地は数えない)`],
    [ONE, `        function endGameByScore() {
            gameOver = true;
            const territory = calculateTerritory();`,
WIN_BY_RULE_FN + `
        function endGameByScore() {
            gameOver = true;
            // 終着ルール: 最後に石を置いた側が勝ち
            if (lastMove) {
                winByRule(lastMove.player, '終着', \`\${lastMove.player === 1 ? '黒' : '白'}が最後の着手をしました\`);
                return;
            }
            const territory = calculateTerritory();`],
    // 終着: 現状の「最後の着手者」(=そのまま終われば勝者) を常時表示
    ...EVENT_CHIP_SPEC(`'終着権 ' + (lastMove ? (lastMove.player === 1 ? '黒' : '白') : '-')`),
    ...STONE_SPEC,
], 'lastgo'));

// 80. EYEGO (眼碁) — 最初に眼 (完全囲み空領域) を作った側が勝つ
out('eyego.html', apply(ALGO, [
    ...rb('EYEGO', '眼碁', 'eyego'),
    [ONE, RV_ALGO, rv([
        '眼ルール: 自分の石だけで完全に囲まれた小さな空領域 (眼・6点以内) を最初に作った側が即勝利。',
        '相手は侵入して囲みを壊せる。取り・地集計も通常通り有効。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 眼ルール<br>
            ※自分の石だけで囲まれた小領域 (6点以内) を最初に作った側が即勝利`],
    [ONE, `        function endGameByScore() {`,
`        // 眼判定: 全近傍が自分の石の小さな空領域(6点以内)があれば勝利
        function checkEyeWin(player) {
            const seen = new Set();
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0 || seen.has(i)) continue;
                const q = [i]; seen.add(i);
                let onlyP = true, size = 0;
                while (q.length) {
                    const cur = q.pop(); size++;
                    getNeighbors(cur).forEach(n => {
                        if (board[n] === 0 && !seen.has(n)) { seen.add(n); q.push(n); }
                        else if (board[n] !== 0 && board[n] !== player) onlyP = false;
                    });
                }
                if (onlyP && size <= 6) return true;
            }
            return false;
        }
` + WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    [ONE, CAPTURE_BLOCK,
`${CAPTURE_BLOCK}

            // 眼勝利判定
            if (checkEyeWin(player)) {
                winByRule(player, '眼', \`\${player === 1 ? '黒' : '白'}が眼を完成させました\`);
                return;
            }`],
    // 形成中の眼: 単色で囲まれた空領域をその色で薄く照らす (6点以内=完成=即勝利)
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 眼: 単色で囲まれた空領域を所有者色で照らす (6点以内=完成=即勝利)
        fxAmbient((ctx2, now, pad, cs) => {
            const n = BOARD_SIZE, seen = new Set();
            ctx2.save();
            for (let i = 0; i < n * n; i++) {
                if (board[i] !== 0 || seen.has(i)) continue;
                const q = [i]; seen.add(i);
                const region = [];
                let owner = 0, mixed = false;
                while (q.length) {
                    const cur = q.pop(); region.push(cur);
                    getNeighbors(cur).forEach(m => {
                        if (board[m] === 0 && !seen.has(m)) { seen.add(m); q.push(m); }
                        else if (board[m] !== 0) {
                            if (owner === 0) owner = board[m];
                            else if (board[m] !== owner) mixed = true;
                        }
                    });
                }
                if (mixed || owner === 0 || region.length > 9) continue;
                const done = region.length <= 6;
                const col = owner === 1 ? '30,30,30' : '255,255,255';
                const pulse = 0.5 + 0.5 * Math.sin(now / 500);
                ctx2.fillStyle = 'rgba(' + col + ',' + (done ? 0.30 + 0.2 * pulse : 0.10 + 0.06 * pulse) + ')';
                region.forEach(r => {
                    ctx2.fillRect(pad + (r % n - 0.42) * cs, pad + (((r / n) | 0) - 0.42) * cs, cs * 0.84, cs * 0.84);
                });
                if (done) {
                    const cx0 = region.reduce((s, r) => s + (r % n), 0) / region.length;
                    const cy0 = region.reduce((s, r) => s + ((r / n) | 0), 0) / region.length;
                    ctx2.strokeStyle = 'rgba(' + col + ',0.8)';
                    ctx2.lineWidth = Math.max(1.4, cs * 0.06);
                    ctx2.beginPath(); ctx2.arc(pad + cx0 * cs, pad + cy0 * cs, cs * (0.28 + pulse * 0.08), 0, Math.PI * 2); ctx2.stroke();
                }
            }
            ctx2.restore();
        });`],
    ...STONE_SPEC,
], 'eyego'));

// 81. BRAWLGO (乱闘碁) — 周囲3マス以上を敵で囲んだ石は個別に取れる
out('brawlgo.html', apply(ALGO, [
    ...rb('BRAWLGO', '乱闘碁', 'brawlgo'),
    [ONE, RV_ALGO, rv([
        '乱闘ルール: 通常の取りに加え、周囲の3方向以上が敵石の石は個別に取られる (連の呼吸点不要)。',
        '密集地帯では個別撃破が起きる乱戦碁。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 乱闘ルール<br>
            ※周囲3方向以上が敵石の石は単独でも取られる`],
    [ONE, CAPTURE_BLOCK,
`            let captured = getCapturedStones(board, opponent);
            // 乱闘: 周囲3方向以上が自分の石の敵石も取る
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== opponent || captured.includes(i)) continue;
                if (getNeighbors(i).filter(n => board[n] === player).length >= 3) captured.push(i);
            }
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                fxText(captured[0], '撃破!', '#ef4444', 900);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    // 乱闘: 周囲3方向以上が敵石の石 (個別撃破候補) を赤く点滅
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 乱闘: 個別撃破候補 (敵に3方向以上囲まれた石) を点滅
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            const pulse = 0.5 + 0.5 * Math.sin(now / 180);
            ctx2.globalAlpha = 0.5 + 0.4 * pulse;
            ctx2.lineWidth = Math.max(1.5, cs * 0.07);
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                const foes = getNeighbors(i).filter(n => board[n] !== 0 && board[n] !== v).length;
                if (foes < 3) continue;
                const cx = pad + (i % BOARD_SIZE) * cs, cy = pad + ((i / BOARD_SIZE) | 0) * cs;
                ctx2.strokeStyle = '#ef4444';
                ctx2.beginPath(); ctx2.arc(cx, cy, cs * 0.60, 0, Math.PI * 2); ctx2.stroke();
            }
            ctx2.restore();
        });`],
    ...STONE_SPEC,
], 'brawlgo'));

// 82. CHAINGO (連鎖爆発碁) — 取った空点に隣接する敵連も連鎖で取れる
out('chaingo.html', apply(ALGO, [
    ...rb('CHAINGO', '連鎖爆発碁', 'chaingo'),
    [ONE, RV_ALGO, rv([
        '連鎖爆発ルール: 敵連を取ると、空いたマスの周囲8方向 (斜め含む) にある敵石も連鎖して取られる (連鎖分は最大8石)。',
        '斜めの接触が爆発を伝える高火力碁。取り合いがドミノ式に広がる。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 連鎖爆発ルール<br>
            ※取った空点の8方向にある敵石も連鎖して取られる (最大8石)。200手で自動終局`],
    [ONE, `        function endGameByScore() {`,
`        // 8方向近傍 (連鎖爆発用)
        function nbrs8(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            const out8 = [...getNeighbors(i)];
            [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx, dy]) => {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE)
                    out8.push(ny * BOARD_SIZE + nx);
            });
            return out8;
        }

        function endGameByScore() {`],
    [ONE, CAPTURE_BLOCK,
`            // 連鎖爆発: 呼吸点0の敵連を取り、空いたマスの8方向の敵石も再帰的に取る (連鎖分は最大8石)
            const captured = [];
            const done = new Set();
            const queue = [...getCapturedStones(board, opponent)];
            const chainCap = queue.length + 8;
            while (queue.length && captured.length < chainCap) {
                const cur = queue.shift();
                if (done.has(cur) || board[cur] !== opponent) continue;
                done.add(cur); captured.push(cur);
                nbrs8(cur).forEach(n => {
                    if (board[n] === opponent && !done.has(n)) queue.push(n);
                });
            }
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    ...STONE_SPEC,
], 'chaingo'));

// ============================================================
// ==== 第8バッチ: 追加10派生 ====
// ============================================================

// 83. FINITEGO (有限碁) — 各プレイヤーの石は最大12個、超えると最古が消える
out('finitego.html', apply(ALGO, [
    ...rb('FINITEGO', '有限碁', 'finitego'),
    [ONE, RV_ALGO, rv([
        '有限ルール: 各プレイヤーが盤上に持てる石は最大12個。13個目を置くと最も古い石が消える。',
        '消えた石はアゲハマにならない。取り合いに加えて「どの石を残すか」の管理が要る。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 有限ルール<br>
            ※各プレイヤーの石は最大12個。超過すると最古の石が消える。200手で自動終局`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 有限: 自石は最大12個 — 超過分は最古から消える
            {
                const mine = pieces.filter(pc => pc.player === player);
                if (mine.length > 12) {
                    const old = mine[0];
                    old.cells.forEach(p => {
                        board[p.y * BOARD_SIZE + p.x] = 0;
                        fxBurst(p.y * BOARD_SIZE + p.x, '#a78bfa', 8, 1.4);
                    });
                    fxText(old.cells[0].y * BOARD_SIZE + old.cells[0].x, '消滅', '#a78bfa', 1100);
                    pieces = pieces.filter(pc => pc !== old);
                }
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    // 有限: 手持ち石数と上限表示 + 次に消える最古石を刻む
    ...EVENT_CHIP_SPEC(`'石数 ' + board.filter(v => v === turn).length + '/12'`),
    ...STONE_MARKS_SPEC(`            // 有限: 上限に達した自連の最古石 (次に消える石) に時限刻印
            {
                const mine = pieces.filter(pc => pc.player === turn && pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === turn));
                if (mine.length >= 12) {
                    const p = mine[0].cells[0];
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    ctx.save();
                    ctx.strokeStyle = '#a78bfa';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                    ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.55, 0, Math.PI * 2); ctx.stroke();
                    const t = cellSize * 0.09;
                    ctx.beginPath();
                    ctx.moveTo(cx - t, cy - t); ctx.lineTo(cx + t, cy - t); ctx.lineTo(cx - t, cy + t); ctx.lineTo(cx + t, cy + t);
                    ctx.closePath(); ctx.stroke();
                    ctx.restore();
                }
            }`),
    ...STONE_SPEC,
], 'finitego'));

// 84. COPYGO (模倣碁) — 相手の直前着手の対称点にしか打てない
out('copygo.html', apply(ALGO, [
    ...rb('COPYGO', '模倣碁', 'copygo'),
    [ONE, RV_ALGO, rv([
        '模倣ルール: 相手の直前の着手と盤の中心に点対称な位置にしか打てない (鏡写し)。',
        'その位置が埋まっていれば自由に打てる。序盤は完全なコピー戦になる古典的な対称碁。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 模倣ルール<br>
            ※相手の直前着手の点対称位置にしか打てない (埋まっていれば自由)`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 模倣ルール: 相手直前着手の点対称位置が空いていればそこにしか打てない
            if (lastMove && lastMove.player !== player) {
                const need = lastMove.cells.map(p => ({ x: BOARD_SIZE - 1 - p.x, y: BOARD_SIZE - 1 - p.y }));
                const mirrorOk = need.every(p => board[p.y * BOARD_SIZE + p.x] === 0);
                const isMirror = cells.length === need.length &&
                    cells.every((p, i) => p.x === need[i].x && p.y === need[i].y);
                if (mirrorOk && !isMirror) return false;
            }`],
    // 模倣: 相手の手と点対称位置を破線リンクと目印で示す
    CUE_STARS(`            // 模倣: 次の一手は点対称位置 — リンク線と必着手リング
            if (lastMove && lastMove.player !== turn && !gameOver) {
                const need = lastMove.cells.map(p => ({ x: BOARD_SIZE - 1 - p.x, y: BOARD_SIZE - 1 - p.y }));
                if (need.every(p => board[p.y * BOARD_SIZE + p.x] === 0)) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(217,70,239,0.7)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                    // 元の石と模倣点を結ぶ薄いリンク
                    ctx.setLineDash([cellSize * 0.10, cellSize * 0.09]);
                    lastMove.cells.forEach((p, i) => {
                        const m = need[i];
                        ctx.beginPath();
                        ctx.moveTo(padding + p.x * cellSize, padding + p.y * cellSize);
                        ctx.lineTo(padding + m.x * cellSize, padding + m.y * cellSize);
                        ctx.stroke();
                    });
                    // 模倣点の必着手リング
                    ctx.setLineDash([cellSize * 0.16, cellSize * 0.12]);
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                    need.forEach(m => {
                        ctx.beginPath();
                        ctx.arc(padding + m.x * cellSize, padding + m.y * cellSize, cellSize * 0.40, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                    ctx.restore();
                }
            }`),
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
], 'copygo'));

// 85. SWAMPGO (沼碁) — 沼地の石は3手後に沈む
out('swampgo.html', apply(ALGO, [
    ...rb('SWAMPGO', '沼碁', 'swampgo'),
    [ONE, RV_ALGO, rv([
        '沼ルール: 盤上に6個の沼地 (緑色の枡) がある。沼に置いた石は6手後に沈んで消える。',
        '沼地は置けるが寿命付き。沈む直前に取り合いに使う高等戦術もある。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 沼ルール<br>
            ※緑の沼地に置いた石は6手後に沈む。200手で自動終局`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let swamp = new Set();    // 沼地の盤面インデックス
        let swampSink = {};       // 沼上の石 -> 沈む手数 (history.length基準)`],
    [ONE, RESET_BOARD,
`${RESET_BOARD}
            swamp = new Set();
            swampSink = {};
            // 内側エリアに6個の沼をランダム配置
            while (swamp.size < 6) {
                const x = 1 + ((Math.random() * (BOARD_SIZE - 2)) | 0);
                const y = 1 + ((Math.random() * (BOARD_SIZE - 2)) | 0);
                swamp.add(y * BOARD_SIZE + x);
            }`],
    // 沼描画 (石の下の地形)
    [ONE, `        function drawBoardElements(padding, cellSize) {
            const r = cellSize * 0.46;`,
`        function drawBoardElements(padding, cellSize) {
            const r = cellSize * 0.46;

            // 沼地: 泥水のグラデーション
            swamp.forEach(i => {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const sx = padding + x * cellSize, sy = padding + y * cellSize, hh = cellSize * 0.5;
                const g = ctx.createRadialGradient(sx, sy, cellSize * 0.1, sx, sy, cellSize * 0.75);
                g.addColorStop(0, 'rgba(84,120,20,0.60)');
                g.addColorStop(1, 'rgba(50,78,12,0.30)');
                ctx.fillStyle = g;
                ctx.fillRect(sx - hh, sy - hh, cellSize, cellSize);
            });`],
    // 配置時: 沼上なら沈没タイマー登録
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            move.cells.forEach(p => {
                const i = p.y * BOARD_SIZE + p.x;
                if (swamp.has(i)) swampSink[i] = history.length + 6;
            });`],
    // 手番交代時: 期限切れの沼上の石を沈める
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            Object.keys(swampSink).forEach(k => {
                const i = +k;
                if (swampSink[i] <= history.length || board[i] === 0) {
                    if (board[i] !== 0) {
                        board[i] = 0;
                        fxSplash(i, '#84a02a', 10); // 泥が弾ける
                        fxText(i, 'ぐぽっ', '#a3e635', 750);
                    }
                    delete swampSink[i];
                }
            });
            pieces.forEach(pc => { pc.cells = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player); });
            cleanUpPieces();
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    // undo/保存/同期
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                swamp: [...swamp], swampSink: { ...swampSink },
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            swamp = new Set(snap.swamp || []); swampSink = snap.swampSink ? { ...snap.swampSink } : swampSink;`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    swamp: [...swamp], swampSink: { ...swampSink },
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            swamp = new Set(s.swamp || []); swampSink = s.swampSink ? { ...s.swampSink } : {};`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                swamp: [...swamp], swampSink,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.swamp) swamp = new Set(data.swamp);
            if (data.swampSink) swampSink = { ...data.swampSink };`],
    ...STONE_MARKS_SPEC(`            // 沼の上の石は沈む — 小さな▽を刻む
            {
                ctx.save();
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                ctx.lineJoin = 'round';
                for (const i of swamp) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + ((i / BOARD_SIZE) | 0) * cellSize, s = cellSize * 0.09;
                    ctx.strokeStyle = v === 1 ? 'rgba(240,235,220,0.85)' : 'rgba(50,40,25,0.8)';
                    ctx.beginPath();
                    ctx.moveTo(cx - s, cy - s * 0.6);
                    ctx.lineTo(cx, cy + s);
                    ctx.lineTo(cx + s, cy - s * 0.6);
                    ctx.closePath();
                    ctx.stroke();
                }
                ctx.restore();
            }`),
    // 沼の泡: 沼地でぽこぽこ泡が昇る
    [ONE, FX_BOOT,
`${FX_BOOT}
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            swamp.forEach(i => {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const t = (now / 2600 + (i % 7) * 0.35) % 1;
                const bx = pad + x * cs + Math.sin(i * 3.3) * cs * 0.25;
                const by = pad + y * cs + cs * 0.3 - t * cs * 0.5;
                ctx2.globalAlpha = 0.5 * (1 - t);
                ctx2.strokeStyle = '#bef264';
                ctx2.lineWidth = Math.max(1, cs * 0.03);
                ctx2.beginPath();
                ctx2.arc(bx, by, cs * (0.05 + t * 0.09), 0, Math.PI * 2);
                ctx2.stroke();
            });
            ctx2.restore();
        });`],
    ...STONE_SPEC,
], 'swampgo'));

// 86. TIDEGO (潮汐碁) — 10手ごとに外周が水没/干潟を繰り返す
out('tidego.html', apply(ALGO, [
    ...rb('TIDEGO', '潮汐碁', 'tidego'),
    [ONE, RV_ALGO, rv([
        '潮汐ルール: 10手ごとに満ち干が交代。満潮時は盤の外周1列が水没 (壁) になり、そこにある石は消える。',
        '干潮時は外周が戻る。外周の陣地は定期的に失われる。手番横の表示が潮位。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 潮汐ルール<br>
            ※10手ごとに外周が水没↔復活。手番横の🌊が満潮。200手で自動終局`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let tideHigh = false; // 満潮フラグ`],
    [ONE, RESET_BOARD,
`${RESET_BOARD}
            tideHigh = false;`],
    [ONE, `        function endGameByScore() {`,
`        // 潮汐: 外周1列を水没/復活させる
        function applyTide() {
            tideHigh = !tideHigh;
            const n = BOARD_SIZE;
            const ci = Math.floor(n / 2) * n + Math.floor(n / 2);
            fxText(ci, tideHigh ? '満潮' : '干潮', '#7dd3fc', 1100);
            fxShake(3, 260);
            for (let i = 0; i < n; i++) {
                [i, (n - 1) * n + i, i * n, i * n + n - 1].forEach(idx => {
                    board[idx] = tideHigh ? 3 : 0;
                    if (tideHigh) fxSplash(idx, '#7dd3fc', 4); // 着水
                    else fxGlow(idx, '#bae6fd', 420);          // 潮が退く
                });
            }
            pieces.forEach(pc => {
                pc.cells = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
            });
            cleanUpPieces();
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 潮汐: 10手ごとに満ち干交代
            if (history.length % 10 === 0) applyTide();
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + (tideHigh ? ' 🌊満' : ' 干');`],
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                tideHigh,
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            if (snap.tideHigh !== undefined) tideHigh = snap.tideHigh;`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    tideHigh,
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            if (s.tideHigh !== undefined) tideHigh = s.tideHigh;`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                tideHigh,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.tideHigh !== undefined) tideHigh = data.tideHigh;`],
    // 水没部は揺れる水面
    [ONE, COVERED_ANCHOR, texDraw(PAINT_WATER('#1b5e8a', '#0a3049'))],
    ...WALL_GUARD_SPEC,
    // 満潮時の水面のきらめき
    [ONE, FX_BOOT, FX_BOOT + AMBIENT_WATER],
    ...EVENT_CHIP_SPEC(`'潮汐' + (10 - history.length % 10) + '手'`),
    ...STONE_SPEC,
], 'tidego'));

// 87. PULSEGO (脈動碁) — 6手ごとに全ての連が呼吸点へ1石伸びる
out('pulsego.html', apply(ALGO, [
    ...rb('PULSEGO', '脈動碁', 'pulsego'),
    [ONE, RV_ALGO, rv([
        '脈動ルール: 合計6手ごとに盤上の全連がランダムな呼吸点へ1石伸びる (自動増殖)。',
        '囲いきる前に連が伸びるので、取り合いは時間との勝負。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 脈動ルール<br>
            ※6手ごとに全連がランダムな空点へ1石伸びる`],
    [ONE, `        function endGameByScore() {`,
`        // 脈動: 全連をランダムな呼吸点へ1石伸ばす
        function applyPulse() {
            pieces.forEach(pc => {
                const libs = new Set();
                pc.cells.forEach(p => {
                    getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => {
                        if (board[n] === 0) libs.add(n);
                    });
                });
                if (!libs.size) return;
                const arr = [...libs];
                const ni = arr[(Math.random() * arr.length) | 0];
                board[ni] = pc.player;
                pc.cells.push({ x: ni % BOARD_SIZE, y: (ni / BOARD_SIZE) | 0 });
                // 脈動増殖: 連から新しい芽が滑り出る
                const src = getNeighbors(ni).find(n => pc.cells.slice(0, -1).some(p => p.y * BOARD_SIZE + p.x === n));
                if (src !== undefined) fxSlide(src, ni, 420);
                fxGlow(ni, 'rgba(52,211,153,0.8)', 560);
            });
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 脈動: 6手ごとに全連が増殖
            if (history.length % 6 === 0) applyPulse();`],
    ...EVENT_CHIP_SPEC(`'脈動' + (6 - history.length % 6) + '手'`),
    ...STONE_SPEC,
], 'pulsego'));

// 88. RECYCLEGO (再生碁) — 取られた石は10手後に持ち主の色でランダム復活
out('recyclego.html', apply(ALGO, [
    ...rb('RECYCLEGO', '再生碁', 'recyclego'),
    [ONE, RV_ALGO, rv([
        '再生ルール: 取られた石は10手後に元の持ち主の色でランダムな空点に復活する。',
        'ただし再生は各石1回だけ — 再生した石をもう一度取れば完全に取り切れる。アゲハマは通常通り計上。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 再生ルール<br>
            ※取られた石は10手後に元の持ち主の石として1回だけ復活。200手で自動終局`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let returnQueue = []; // { player, due } — 再生待ちの石
        let revivedUsed = new Set(); // 再生済みの石 (二度目は消える)`],
    [ONE, RESET_BOARD,
`${RESET_BOARD}
            returnQueue = [];
            revivedUsed = new Set();`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    board[idx] = 0;
                    // 再生: 10手後に元の持ち主の色で復活 (各石1回だけ)
                    if (revivedUsed.has(idx)) revivedUsed.delete(idx);
                    else returnQueue.push({ player: opponent, due: history.length + 10 });
                });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 再生: 期限到来の石をランダムな空点に復活 (復活した石は再生済み)
            returnQueue = returnQueue.filter(q => {
                if (q.due > history.length) return true;
                const empties = [];
                for (let i = 0; i < board.length; i++) if (board[i] === 0) empties.push(i);
                if (!empties.length) return true;
                const ni = empties[(Math.random() * empties.length) | 0];
                board[ni] = q.player;
                revivedUsed.add(ni);
                // 復活演出: 緑の光と飛沫
                fxGlow(ni, 'rgba(74,222,128,0.9)', 800);
                fxBurst(ni, '#4ade80', 8, 1.2);
                fxText(ni, '復活', '#34d399', 1000);
                pieces.push({
                    id: Date.now() + Math.random(), player: q.player, type: 'STONE', rot: 0,
                    cells: [{ x: ni % BOARD_SIZE, y: (ni / BOARD_SIZE) | 0 }]
                });
                return false;
            });
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                returnQueue: returnQueue.map(q => ({ ...q })),
                revivedUsed: [...revivedUsed],
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            returnQueue = snap.returnQueue ? snap.returnQueue.map(q => ({ ...q })) : returnQueue;
            revivedUsed = new Set(snap.revivedUsed || []);`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    returnQueue: returnQueue.map(q => ({ ...q })),
                    revivedUsed: [...revivedUsed],
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            returnQueue = Array.isArray(s.returnQueue) ? s.returnQueue.map(q => ({ ...q })) : [];
            revivedUsed = new Set(s.revivedUsed || []);`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                returnQueue: returnQueue.map(q => ({ ...q })),
                revivedUsed: [...revivedUsed],
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (Array.isArray(data.returnQueue)) returnQueue = data.returnQueue.map(q => ({ ...q }));
            if (Array.isArray(data.revivedUsed)) revivedUsed = new Set(data.revivedUsed);`],
    ...EVENT_CHIP_SPEC(`(returnQueue.length ? '復活' + (Math.min(...returnQueue.map(q => q.due)) - history.length) + '手' : '')`),
    ...STONE_SPEC,
], 'recyclego'));

// 89. LIBGO (呼吸碁) — 得点は自連の呼吸点の合計
out('libgo.html', apply(ALGO, [
    ...rb('LIBGO', '呼吸碁', 'libgo'),
    [ONE, RV_ALGO, rv([
        '呼吸得点: 得点 = 自分の全連の呼吸点の合計 + アゲハマ (+白はコミ)。地は数えない。',
        '囲うより呼吸の多い形を作るほうが得 — 伸び伸びした形が強い碁。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 呼吸得点<br>
            ※得点=自連の呼吸点合計+アゲハマ (地は数えない)`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            // 呼吸得点: 各自の連の呼吸点合計を得点に
            const libSum = p => {
                const seen = new Set(); let total = 0;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== p || seen.has(i)) continue;
                    const grp = getConnectedGroup(i, p);
                    grp.forEach(g => seen.add(g));
                    const libs = new Set();
                    grp.forEach(g => getNeighbors(g).forEach(n => { if (board[n] === 0) libs.add(n); }));
                    total += libs.size;
                }
                return total;
            };
            const blackLibs = libSum(1), whiteLibs = libSum(2);
            const blackTotal = blackLibs + captures[1];
            const whiteTotal = whiteLibs + captures[2] + komi;`],
    [ONE, `<div class="flex justify-between"><span>黒の地:</span> <strong>\${territory.black}</strong></div>`,
`<div class="flex justify-between"><span>黒の呼吸点:</span> <strong>\${blackLibs}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白の地:</span> <strong>\${territory.white}</strong></div>`,
`<div class="flex justify-between"><span>白の呼吸点:</span> <strong>\${whiteLibs}</strong></div>`],
    // 呼吸: 全連の呼吸点合計を得点として常時表示
    [ONE, `        function endGameByScore() {`,
`        // 呼吸: 全連の呼吸点合計 (常時得点表示にも利用)
        function libScore(p) {
            const seen = new Set(); let total = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== p || seen.has(i)) continue;
                const grp = getConnectedGroup(i, p);
                grp.forEach(g => seen.add(g));
                const libs = new Set();
                grp.forEach(g => getNeighbors(g).forEach(n => { if (board[n] === 0) libs.add(n); }));
                total += libs.size;
            }
            return total;
        }

        function endGameByScore() {`],
    ...EVENT_CHIP_SPEC(`'呼吸 ' + libScore(1) + '-' + libScore(2)`),
    ...STONE_SPEC,
], 'libgo'));

// 90. STONERAIN (石雨碁) — 9手ごとにランダムな空点に壁が降る
out('stonerain.html', apply(ALGO, [
    ...rb('STONERAIN', '石雨碁', 'stonerain'),
    [ONE, RV_ALGO, rv([
        '石雨ルール: 合計9手ごとにランダムな空点に中立の壁ブロックが1個降ってくる。',
        '壁は呼吸点にも地にもならず、盤面がだんだん欠けていく。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 石雨ルール<br>
            ※9手ごとにランダムな空点へ中立壁が降る`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 石雨: 9手ごとにランダムな空点へ壁が降る
            if (history.length % 9 === 0) {
                const empties = [];
                for (let i = 0; i < board.length; i++) if (board[i] === 0) empties.push(i);
                if (empties.length) {
                    const land = empties[(Math.random() * empties.length) | 0];
                    board[land] = 3;
                    fxGlow(land, '#fbbf24', 650);
                    fxBurst(land, '#a8a29e', 12, 1.7);
                    fxShake(5, 300);
                    fxText(land, 'ドン!', '#fdba74', 800);
                }
            }`],
    // 降りた壁は玄武岩の隕石
    [ONE, COVERED_ANCHOR, texDraw(PAINT_METEOR)],
    ...WALL_GUARD_SPEC,
    ...EVENT_CHIP_SPEC(`'石雨' + (9 - history.length % 9) + '手'`),
    ...STONE_SPEC,
], 'stonerain'));

// 91. SPLITGO (分裂碁) — 7石以上の連は半分が敵色に変わる
out('splitgo.html', apply(ALGO, [
    ...rb('SPLITGO', '分裂碁', 'splitgo'),
    [ONE, RV_ALGO, rv([
        '分裂ルール: 着手後、自分の7石以上の連は分裂 — 半分の石が敵色に変わる。',
        '大きな連は作れない。半分を敵に取られるかどうかは連鎖捕捉の後に判定。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 分裂ルール<br>
            ※着手後、自分の7石以上の連は半分が敵色に変わる。200手で自動終局`],
    [ONE, CAPTURE_BLOCK,
`${CAPTURE_BLOCK}

            // 分裂: 自分の7石以上の連は半分が敵色に
            {
                const seenS = new Set();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player || seenS.has(i)) continue;
                    const grp = getConnectedGroup(i, player);
                    grp.forEach(g => seenS.add(g));
                    if (grp.length >= 7) {
                        grp.slice(Math.ceil(grp.length / 2)).forEach(g => { board[g] = opponent; });
                        // 分裂演出: 連が割れる衝撃
                        fxShake(3, 200);
                        fxText(grp[0], '分裂!', '#fb7185', 1000);
                        grp.slice(Math.ceil(grp.length / 2)).forEach(g => fxGlow(g, 'rgba(251,113,133,0.8)', 640));
                    }
                }
                cleanUpPieces();
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    ...STONE_SPEC,
], 'splitgo'));

// 92. MINIGO (少子碁) — 得点の少ない側が勝つ (ミゼール)
out('minigo.html', apply(ALGO, [
    ...rb('MINIGO', '少子碁', 'minigo'),
    [ONE, RV_ALGO, rv([
        '少子ルール (ミゼール): 得点計算は通常と同じだが、少ない側が勝つ。',
        '地もアゲハマも少ないほうが勝ち — 相手に取らせる・囲わせる逆転の碁。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 少子ルール<br>
            ※合計得点が少ない側の勝ち (ミゼール)`],
    [ONE, `            let winnerTitle = '';
            if (blackTotal > whiteTotal) winnerTitle = '黒の勝ち';
            else if (whiteTotal > blackTotal) winnerTitle = '白の勝ち';
            else winnerTitle = '引き分け';`,
`            let winnerTitle = '';
            // 少子ルール: 少ない側が勝ち
            if (blackTotal < whiteTotal) winnerTitle = '黒の勝ち';
            else if (whiteTotal < blackTotal) winnerTitle = '白の勝ち';
            else winnerTitle = '引き分け';`],
    [ONE, CAPTURE_BLOCK,
`${CAPTURE_BLOCK}

            // ミゼール: 大量に取るほど損 — 取り過ぎの警告
            if (captured.length >= 3) fxText(captured[0], '取り過ぎ注意', '#f97316', 1100);`],
    // ミゼール: 得点の少ない側が勝つ — アゲハマが増える側が劣勢
    ...EVENT_CHIP_SPEC(`'ミゼール アゲハマ ' + captures[1] + '-' + captures[2]`),
    ...STONE_SPEC,
], 'minigo'));

// ============================================================
// ==== 第9バッチ: 追加10派生 ====
// ============================================================

// 8方向近傍ヘルパー (連鎖爆発・榴弾共通)
const NBRS8_FN = `        // 8方向近傍
        function nbrs8(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            const out8 = [...getNeighbors(i)];
            [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx, dy]) => {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE)
                    out8.push(ny * BOARD_SIZE + nx);
            });
            return out8;
        }
`;

// 93. GRENADEGO (榴弾碁) — 取られた連は爆発し周囲8方向の石を道連れ
out('grenadego.html', apply(ALGO, [
    ...rb('GRENADEGO', '榴弾碁', 'grenadego'),
    [ONE, RV_ALGO, rv([
        '榴弾ルール: 取られた連は爆発し、周囲8方向の石 (両色・最大8個) も道連れに消える。',
        '爆発に巻き込まれた自分の石もアゲハマに加算される。囲みすぎると自爆する攻撃的碁。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 榴弾ルール<br>
            ※取られた連は爆発し周囲8方向の石 (両色・最大8個) を道連れ。200手で自動終局`],
    [ONE, `        function endGameByScore() {`, NBRS8_FN + `
        function endGameByScore() {`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                // 榴弾: 取られたマスの8方向の石 (両色・最大8個) も爆発で消える
                const boom = new Set();
                captured.forEach(idx => nbrs8(idx).forEach(n => {
                    if ((board[n] === 1 || board[n] === 2) && boom.size < 8) boom.add(n);
                }));
                boom.forEach(i => { board[i] = 0; });
                captures[player] += captured.length + boom.size;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    ...STONE_SPEC,
], 'grenadego'));

// 94. INFECTGO (感染碁) — 7手ごとに孤立石が隣接する敵石を感染させる
out('infectgo.html', apply(ALGO, [
    ...rb('INFECTGO', '感染碁', 'infectgo'),
    [ONE, RV_ALGO, rv([
        '感染ルール: 合計7手ごとに、味方石と繋がっていない孤立石が隣接する敵石を全て自分の色に感染させる。',
        '孤立石は感染源として兵器になる。連を維持するか散らすかの駆け引き。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 感染ルール<br>
            ※7手ごとに孤立石が隣の敵石を自色に変える。200手で自動終局`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 感染: 7手ごとに孤立石が敵石を自色化
            if (history.length % 7 === 0) {
                const flips = [];
                for (let i = 0; i < board.length; i++) {
                    const c0 = board[i];
                    if (c0 !== 1 && c0 !== 2) continue;
                    if (getNeighbors(i).some(n => board[n] === c0)) continue;
                    getNeighbors(i).forEach(n => {
                        if (board[n] === 3 - c0) flips.push([n, c0]);
                    });
                }
                flips.forEach(([n]) => { board[n] = 0; });
                pieces.forEach(pc => {
                    pc.cells = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                });
                cleanUpPieces();
                flips.forEach(([n, c]) => {
                    board[n] = c;
                    pieces.push({
                        id: Date.now() + Math.random(), player: c, type: 'STONE', rot: 0,
                        cells: [{ x: n % BOARD_SIZE, y: (n / BOARD_SIZE) | 0 }]
                    });
                });
            }
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    ...EVENT_CHIP_SPEC(`'変色' + (7 - history.length % 7) + '手'`),
    ...STONE_SPEC,
], 'infectgo'));

// 95. BONDGO (結合碁) — 敵連を取ると接触していた自連も道連れ
out('bondgo.html', apply(ALGO, [
    ...rb('BONDGO', '結合碁', 'bondgo'),
    [ONE, RV_ALGO, rv([
        '結合ルール: 敵連を取ると、その連に隣接していた自分の石も道連れに消える (相手のアゲハマになる)。',
        '取りは必ず相打ち。囲んだ側も犠牲を払う特攻的な碁。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 結合ルール<br>
            ※敵連を取ると接触していた自石も全て道連れ (相手のアゲハマ)。200手で自動終局`],
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 結合の代償: 取った連に隣接する自分の石も全て道連れ
                const ownDead = new Set();
                captured.forEach(idx => getNeighbors(idx).forEach(n => {
                    if (board[n] === player) ownDead.add(n);
                }));
                ownDead.forEach(i => { board[i] = 0; });
                captures[opponent] += ownDead.size;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    ...STONE_SPEC,
], 'bondgo'));

// 96. RIMGO (淵碁) — 外周の地は2倍計算
out('rimgo.html', apply(ALGO, [
    ...rb('RIMGO', '淵碁', 'rimgo'),
    [ONE, RV_ALGO, rv([
        '淵ルール: 終局時、外周1列の自分の地は2倍計算される。',
        '辺の取り合いが通常以上に重要になる外周重視碁。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 淵ルール<br>
            ※外周1列の地は2倍計算`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            // 淵: 外周の地の所有者を判定して2倍分を加算
            const n = BOARD_SIZE;
            const ringVis = new Set();
            let blackEdge = 0, whiteEdge = 0;
            const ringOwner = i => {
                const q = [i], vis = new Set([i]);
                let tb = false, tw = false;
                while (q.length) {
                    const c0 = q.pop();
                    getNeighbors(c0).forEach(m => {
                        if (board[m] === 0 && !vis.has(m)) { vis.add(m); q.push(m); }
                        else if (board[m] === 1) tb = true;
                        else if (board[m] === 2) tw = true;
                    });
                }
                vis.forEach(v => ringVis.add(v));
                return tb && !tw ? 1 : (!tb && tw ? 2 : 0);
            };
            for (let i = 0; i < n; i++) {
                [i, (n - 1) * n + i, i * n, i * n + n - 1].forEach(idx => {
                    if (board[idx] !== 0 || ringVis.has(idx)) return;
                    const o = ringOwner(idx);
                    if (o === 1) blackEdge++; else if (o === 2) whiteEdge++;
                });
            }
            const blackTotal = territory.black + blackEdge + captures[1];
            const whiteTotal = territory.white + whiteEdge + captures[2] + komi;`],
    [ONE, `<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の淵ボーナス:</span> <strong>+\${blackEdge}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の淵ボーナス:</span> <strong>+\${whiteEdge}</strong></div>`],
    // 淵: 得点2倍の外周リングを金色に染める
    CUE_GRID(`            // 淵: 得点2倍の外周リングを金色に染める
            {
                const o0 = padding - cellSize * 0.5, o1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                const i0 = padding + cellSize * 0.5, i1 = padding + (BOARD_SIZE - 1.5) * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(217, 119, 6, 0.14)';
                ctx.fillRect(o0, o0, o1 - o0, i0 - o0);
                ctx.fillRect(o0, i1, o1 - o0, o1 - i1);
                ctx.fillRect(o0, i0, i0 - o0, i1 - i0);
                ctx.fillRect(i1, i0, o1 - i1, i1 - i0);
                ctx.restore();
            }`),
    // 淵の境界: 外周1列と内側を隔てる破線の方形
    CUE_STARS(`            // 淵の境界: 外周1列(得点2倍)と内側を隔てる破線
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.4);
                ctx.lineWidth = Math.max(1, cellSize * 0.028);
                ctx.setLineDash([cellSize * 0.16, cellSize * 0.12]);
                const i0 = padding + cellSize * 0.5;
                ctx.strokeRect(i0, i0, (BOARD_SIZE - 2) * cellSize, (BOARD_SIZE - 2) * cellSize);
                ctx.restore();
            }`),
    ...STONE_SPEC,
], 'rimgo'));

// 97. BUDGETGO (手数碁) — 60手で自動終局
out('budgetgo.html', apply(ALGO, [
    ...rb('BUDGETGO', '手数碁', 'budgetgo'),
    [ONE, RV_ALGO, rv([
        '手数ルール: 合計60手に達すると自動終局し、その時点で得点計算する。',
        'パスで手数を稼ぐことはできない (パスも1手に数える)。手番横が残り手数。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 手数ルール<br>
            ※合計60手で自動終局。手番横が残り手数`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 残り手数の警告: 10/5/2手で盤中央に告知
            {
                const rem = 60 - history.length;
                if (rem === 10 || rem === 5 || rem === 2) {
                    const cc = Math.floor(BOARD_SIZE / 2) * (BOARD_SIZE + 1);
                    fxText(cc, '残り' + rem + '手', '#f59e0b', 1200);
                    if (rem <= 2) fxShake(3, 200);
                }
            }
            // 手数上限: 60手で自動終局
            if (history.length >= 60) { endGameByScore(); return; }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + ' 残' + Math.max(0, 60 - history.length) + '手';`],
    ...STONE_SPEC,
], 'budgetgo'));

// 98. FRONTGO (前線碁) — 前線が上から下へ進み、後方の石は不死
out('frontgo.html', apply(ALGO, [
    ...rb('FRONTGO', '前線碁', 'frontgo'),
    [ONE, RV_ALGO, rv([
        '前線ルール: 4手ごとに前線が1行下へ進む。前線より上の行の石は確定済みで取られなくなる。',
        '上から確定していくので、盤面上部の陣取りが早い者勝ちになる。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 前線ルール<br>
            ※4手ごとに前線が1行下へ。前線より上の石は取られない。200手で自動終局`],
    [ONE, `        function endGameByScore() {`,
`        const frontRow = () => Math.min(((history.length / 4) | 0), BOARD_SIZE - 1);
        function endGameByScore() {`],
    [ONE, CAPTURE_BLOCK,
`            let captured = getCapturedStones(board, opponent);
            // 前線: 前線より上の石は確定済みで取られない
            captured = captured.filter(i => ((i / BOARD_SIZE) | 0) >= frontRow());
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局 (最下行での追跡膠着を防ぐ)
            if (history.length >= 200) { endGameByScore(); return; }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + ' 前線' + (frontRow() + 1) + '行';`],
    // 前線: 確定済みの上方を薄いヴェールで覆い、前線を破線で示す
    CUE_STARS(`            // 前線の表示: 確定済み領域の薄いヴェール + 前線の破線
            {
                const fr = frontRow();
                const x0 = padding - cellSize * 0.5, x1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                if (fr > 0) {
                    ctx.save();
                    ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.07);
                    ctx.fillRect(x0, padding - cellSize * 0.5, x1 - x0, fr * cellSize);
                    ctx.restore();
                }
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.5);
                ctx.setLineDash([cellSize * 0.15, cellSize * 0.11]);
                ctx.lineWidth = Math.max(1, cellSize * 0.03);
                const fy = padding + (fr - 0.5) * cellSize;
                ctx.beginPath();
                ctx.moveTo(x0, fy);
                ctx.lineTo(x1, fy);
                ctx.stroke();
                ctx.restore();
            }`),
    ...STONE_SPEC,
], 'frontgo'));

// 99. CHARGEGO (溜め碁) — パスで次の石が5手間不死
out('chargego.html', apply(ALGO, [
    ...rb('CHARGEGO', '溜め碁', 'chargego'),
    [ONE, RV_ALGO, rv([
        '溜めルール: パスをすると溜めが貯まり、次に置く石が5手間取られなくなる (装甲)。',
        'パスの代償で絶対に死なない一手が打てる — 侵入・押さえ込みに有効。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 溜めルール<br>
            ※パスで溜めが貯まり次の石が5手間不死になる`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let passCharge = { 1: false, 2: false }; // 溜めフラグ
        let armorUntil = {};                     // 装甲の残り (idx -> 期限手数)`],
    [ONE, RESET_HELD,
`${RESET_HELD}
            passCharge = { 1: false, 2: false };
            armorUntil = {};`],
    // パス時に溜める
    [ONE, PASS_INC,
`${PASS_INC}
            passCharge[turn] = true; // 溜め`],
    // 配置時: 溜めがあれば装甲付与
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            if (passCharge[player]) {
                passCharge[player] = false;
                move.cells.forEach(p => { armorUntil[p.y * BOARD_SIZE + p.x] = history.length + 5; });
            }`],
    // 装甲のある敵石は取れない
    [ONE, CAPTURE_BLOCK,
`            let captured = getCapturedStones(board, opponent);
            // 装甲中の石は取れない (期限切れは取れる)
            captured = captured.filter(i => !(armorUntil[i] > history.length));
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; delete armorUntil[idx]; });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + (passCharge[turn] ? ' ⚡溜' : '');`],
    // undo/保存/同期
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                passCharge: { ...passCharge }, armorUntil: { ...armorUntil },
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            passCharge = snap.passCharge ? { ...snap.passCharge } : passCharge;
            armorUntil = snap.armorUntil ? { ...snap.armorUntil } : armorUntil;`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    passCharge: { ...passCharge }, armorUntil: { ...armorUntil },
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            if (s.passCharge) passCharge = { ...s.passCharge };
            if (s.armorUntil) armorUntil = { ...s.armorUntil };`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                passCharge, armorUntil,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.passCharge) passCharge = { ...data.passCharge };
            if (data.armorUntil) armorUntil = { ...data.armorUntil };`],
    // 装甲中の石に薄い青のリング
    ...STONE_MARKS_SPEC(`            // 装甲中の石: 薄い青のリング
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(80,130,220,0.75)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                for (const k in armorUntil) {
                    if (!(armorUntil[k] > history.length)) continue;
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    ctx.beginPath();
                    ctx.arc(padding + (i % BOARD_SIZE) * cellSize, padding + ((i / BOARD_SIZE) | 0) * cellSize, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
    ...STONE_SPEC,
], 'chargego'));

// 100. SHUFFLEGO (混成碁) — 15手ごとに全石が50%で色反転
out('shufflego.html', apply(ALGO, [
    ...rb('SHUFFLEGO', '混成碁', 'shufflego'),
    [ONE, RV_ALGO, rv([
        '混成ルール: 合計15手ごとに盤上の全石が50%の確率で色が反転する。',
        '勢力図が定期的にシャッフルされる混沌碁。アゲハマと地集計は通常通り。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 混成ルール<br>
            ※15手ごとに全石が50%で色反転`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 混成: 15手ごとに全石が50%で反転しピース再構成
            if (history.length % 15 === 0) {
                const flipped = [];
                for (let i = 0; i < board.length; i++)
                    if ((board[i] === 1 || board[i] === 2) && Math.random() < 0.5) {
                        board[i] = 3 - board[i];
                        flipped.push(i);
                    }
                // 混成演出: 盤が大きく揺れ反転した石に紫の飛沫
                if (flipped.length) {
                    fxShake(7, 420);
                    flipped.forEach(i => fxBurst(i, '#a78bfa', 3, 0.8));
                    fxText(flipped[0], '混成!', '#8b5cf6', 1100);
                }
                pieces = [];
                for (let i = 0; i < board.length; i++) {
                    const c = board[i];
                    if (c === 1 || c === 2)
                        pieces.push({
                            id: Date.now() + Math.random(), player: c, type: 'STONE', rot: 0,
                            cells: [{ x: i % BOARD_SIZE, y: (i / BOARD_SIZE) | 0 }]
                        });
                }
            }`],
    ...EVENT_CHIP_SPEC(`'混成' + (15 - history.length % 15) + '手'`),
    ...STONE_SPEC,
], 'shufflego'));

// 101. TAXGO (関税碁) — 敵陣半分に置くと相手に+1目
out('taxgo.html', apply(ALGO, [
    ...rb('TAXGO', '関税碁', 'taxgo'),
    [ONE, RV_ALGO, rv([
        '関税ルール: 敵陣側の半分 (黒なら下半分、白なら上半分) に石を置くたび相手に+1目が入る。',
        '侵入は強力だが税がかかる — 攻め込みコストを考える碁。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 関税ルール<br>
            ※敵陣半分 (黒=下側/白=上側) への着手は相手に+1目`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let toll = { 1: 0, 2: 0 }; // 相手に支払った関税`],
    [ONE, RESET_HELD,
`${RESET_HELD}
            toll = { 1: 0, 2: 0 };`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 関税: 敵陣半分への着手は相手に+1目
            {
                const mid = Math.ceil(BOARD_SIZE / 2);
                if (move.cells.some(p => player === 1 ? p.y >= mid : p.y < BOARD_SIZE - mid)) {
                    toll[player]++;
                    // 課税: 金の飛沫と関税告知
                    const ti = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxBurst(ti, '#facc15', 6, 1.1);
                    fxText(ti, '関税+1', '#eab308', 1000);
                }
            }`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + toll[2];
            const whiteTotal = territory.white + captures[2] + toll[1] + komi;`],
    [ONE, `<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の関税収入:</span> <strong>+\${toll[2]}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の関税収入:</span> <strong>+\${toll[1]}</strong></div>`],
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                toll: { ...toll },
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            if (snap.toll) toll = { ...snap.toll };`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    toll: { ...toll },
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            if (s.toll) toll = { ...s.toll };`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                toll: { ...toll },
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.toll) toll = { ...data.toll };`],
    // 関税: 上下の課税域 (上半分=白が課税/下半分=黒が課税) を薄く色分けし境界を破線で示す
    CUE_GRID(`            // 課税域の地色分け (上=白に+1の着手域, 下=黒に+1の着手域)
            {
                const mid = Math.ceil(BOARD_SIZE / 2);
                const y0 = padding - cellSize * 0.5, y1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                const x0 = padding - cellSize * 0.5, x1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                const t1 = padding + (BOARD_SIZE - mid - 0.5) * cellSize;
                const t2 = padding + (mid - 0.5) * cellSize;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.p1Stroke, 0.07);
                ctx.fillRect(x0, y0, x1 - x0, t1 - y0);
                ctx.fillStyle = alphaColor(currentTheme.p2Fill, 0.15);
                ctx.fillRect(x0, t2, x1 - x0, y1 - t2);
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.4);
                ctx.lineWidth = 1;
                ctx.setLineDash([cellSize * 0.16, cellSize * 0.12]);
                ctx.beginPath();
                ctx.moveTo(x0, t1); ctx.lineTo(x1, t1);
                ctx.moveTo(x0, t2); ctx.lineTo(x1, t2);
                ctx.stroke();
                ctx.restore();
            }`),
    ...STONE_SPEC,
], 'taxgo'));

// 102. GREEDGO (強欲碁) — 取れる手があるときは取る手のみ合法
out('greedgo.html', apply(ALGO, [
    ...rb('GREEDGO', '強欲碁', 'greedgo'),
    [ONE, RV_ALGO, rv([
        '強欲ルール: 敵連の呼吸点が1つだけ残っている (アタリ) 場合、その呼吸点を取る手しか打てない。',
        '取れるなら取れ。逃げる猶予がない即断の碁。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 強欲ルール<br>
            ※敵連がアタリ状態なら取る手しか打てない。200手で自動終局`],
    [ONE, `        function endGameByScore() {`,
`        // 強欲: 敵連の呼吸点が1つのものがあれば取る手のみ合法
        // (強制される取り点の盤面 idx 一覧も返せるよう分離)
        function forcedCaptureCells(player) {
            const opp = player === 1 ? 2 : 1;
            const seen = new Set();
            const out = [];
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== opp || seen.has(i)) continue;
                const grp = getConnectedGroup(i, opp);
                grp.forEach(g => seen.add(g));
                const libs = new Set();
                grp.forEach(g => getNeighbors(g).forEach(n => { if (board[n] === 0) libs.add(n); }));
                if (libs.size === 1) out.push([...libs][0]);
            }
            return out;
        }
        function canCaptureMove(player) { return forcedCaptureCells(player).length > 0; }

        function endGameByScore() {`],
    [ONE, `            const opponent = player === 1 ? 2 : 1;
            const captured = getCapturedStones(tempBoard, opponent);`,
`            const opponent = player === 1 ? 2 : 1;
            const captured = getCapturedStones(tempBoard, opponent);

            // 強欲: この手で取れず、他に取れる手があれば非合法
            if (captured.length === 0 && canCaptureMove(player)) return false;`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    // 強欲: 取る手が必須のとき、その点を赤リングと「取」で強調
    CUE_STARS(`            // 強欲: 強制される取り点を赤く強調
            if (!gameOver && gamePhase === 'playing' && canCaptureMove(turn)) {
                ctx.save();
                forcedCaptureCells(turn).forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = 'rgba(239,68,68,0.9)';
                    ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(239,68,68,0.9)';
                    ctx.font = 'bold ' + Math.round(cellSize * 0.34) + 'px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('取', cx, cy);
                });
                ctx.restore();
            }`),
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
], 'greedgo'));

// ============================================================
// ==== 第10バッチ: 最終6派生 (計100) ====
// ============================================================

// 103. CROSSWALLGO (十字壁碁) — 中央十字の壁で4区域に分断
out('crosswallgo.html', apply(ALGO, [
    ...rb('CROSSWALLGO', '十字壁碁', 'crosswallgo'),
    [ONE, RV_ALGO, rv([
        '十字壁ルール: 盤の中央を通る十字の壁で盤面が4つの区域に分断される。',
        '区域同士は石も呼吸も通れない完全分離。4つの小盤で同時に地を争う。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 十字壁<br>
            ※中央十字の壁が盤を4区域に分断`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 中央十字壁
            const mid = (BOARD_SIZE / 2) | 0;
            for (let i = 0; i < BOARD_SIZE; i++) {
                board[mid * BOARD_SIZE + i] = 3; // 横線
                board[i * BOARD_SIZE + mid] = 3; // 縦線
            }`],
    // 十字は城壁レンガ
    [ONE, COVERED_ANCHOR, texDraw(PAINT_BRICK('#6b4a3a', '#402a20'))],
    ...WALL_GUARD_SPEC,
    ...STONE_SPEC,
], 'crosswallgo'));

// 104. POLARGO (額縁碁) — 内側は全て壁、外周1列のみで戦う
out('polargo.html', apply(ALGO, [
    ...rb('POLARGO', '額縁碁', 'polargo'),
    [ONE, RV_ALGO, rv([
        '額縁ルール: 盤の内側は全て壁。戦えるのは外周1列の細い回廊のみ。',
        '石の呼吸点は最大3つ。回廊上での追い込みと封鎖だけの極限碁。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 額縁盤<br>
            ※内側は全て壁。外周1列の回廊のみで戦う。200手で自動終局`],
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 額縁盤: 内側は全て壁
            for (let y = 1; y < BOARD_SIZE - 1; y++)
                for (let x = 1; x < BOARD_SIZE - 1; x++)
                    board[y * BOARD_SIZE + x] = 3;`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局 (回廊上の追跡膠着を防ぐ)
            if (history.length >= 200) { endGameByScore(); return; }`],
    // 内側は木枠の額縁 (回廊との境界は金の内フチ)
    [ONE, COVERED_ANCHOR, texDraw(PAINT_FRAME)],
    ...WALL_GUARD_SPEC,
    ...STONE_SPEC,
], 'polargo'));

// 105. MICROGO (微細碁) — 5/7/9路の小盤
out('microgo.html', apply(ALGO, [
    ...rb('MICROGO', '微細碁', 'microgo'),
    [ONE, RV_ALGO, rv([
        '微細盤ルール: 5路・7路・9路の小さな碁盤のみ。通常ルールそのまま。',
        '小盤は取り合いが即座に始まる乱戦。9路がデフォルト。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 微細盤<br>
            ※5/7/9路の小盤のみ (デフォルト9路)`],
    ...STONE_SPEC, // 先に通常サイズ置換 (9/13/19) を適用してから微細盤に上書き
    [ONE, `        let BOARD_SIZE = 13;`, `        let BOARD_SIZE = 9;`],
    [ONE, SIZE_BTNS_91319,
`                    <button data-size="5" class="btn-size py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">5路盤</button>
                    <button data-size="7" class="btn-size py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">7路盤</button>
                    <button data-size="9" class="btn-size py-2 rounded-lg border border-neutral-300 font-bold text-sm hover:bg-neutral-100 transition-all">9路盤</button>`],
    [ONE, `![9, 13, 19].includes(s.boardSize)`, `![5, 7, 9].includes(s.boardSize)`],
    [ONE, STARS_GENERIC,
`        function getStarPoints(size) {
            if (size === 5) return [{x:2,y:2}];
            if (size === 7) return [{x:3,y:3}];
            return [{x:4,y:4}];
        }`],
    // 微細盤の顔: 外枠の外側に目盛線 (ルーペのスケール)
    [ONE, `            // 星 (天元・星の点)`,
`            // 微細盤: 盤の縁に目盛りを刻む
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.55);
                ctx.lineWidth = Math.max(1, cellSize * 0.035);
                const x0 = padding - cellSize * 0.5, y0 = padding - cellSize * 0.5;
                const x1 = padding + (BOARD_SIZE - 0.5) * cellSize, y1 = padding + (BOARD_SIZE - 0.5) * cellSize;
                for (let i = 0; i < BOARD_SIZE; i++) {
                    const pos = padding + i * cellSize;
                    const len = i % 2 === 0 ? cellSize * 0.16 : cellSize * 0.09;
                    ctx.beginPath(); ctx.moveTo(pos, y0); ctx.lineTo(pos, y0 + len); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(pos, y1 - len); ctx.lineTo(pos, y1); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x0, pos); ctx.lineTo(x0 + len, pos); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x1 - len, pos); ctx.lineTo(x1, pos); ctx.stroke();
                }
                ctx.restore();
            }

            // 星 (天元・星の点)`],
], 'microgo'));

// 106. JUMPGO (跳躍碁) — 自石からちょうど距離2の点にしか打てない
out('jumpgo.html', apply(ALGO, [
    ...rb('JUMPGO', '跳躍碁', 'jumpgo'),
    [ONE, RV_ALGO, rv([
        '跳躍ルール: 自分の石からマンハッタン距離ちょうど2の点にしか置けない (初手のみ自由)。',
        'ただし距離2の空点が盤上に1つも無い場合は制約解除 — どこにでも置ける。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 跳躍ルール<br>
            ※自石から距離ちょうど2の点のみ (距離2の空点が無ければ自由)。200手で自動終局`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 跳躍ルール: 自石から距離ちょうど2のみ (自石が無い、または距離2の空点が無ければ自由)
            {
                const JOFF = [[2,0],[-2,0],[0,2],[0,-2],[1,1],[1,-1],[-1,1],[-1,-1]];
                let hasOwn = false, best = Infinity, anyJump = false;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    hasOwn = true;
                    const bx = i % BOARD_SIZE, by = (i / BOARD_SIZE) | 0;
                    cells.forEach(p => {
                        best = Math.min(best, Math.abs(p.x - bx) + Math.abs(p.y - by));
                    });
                    if (!anyJump) JOFF.forEach(([dx, dy]) => {
                        const nx = bx + dx, ny = by + dy;
                        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny * BOARD_SIZE + nx] === 0)
                            anyJump = true;
                    });
                }
                if (hasOwn && anyJump && best !== 2) return false;
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
], 'jumpgo'));

// 107. NOKOGO (無コウ碁) — コウ禁止が無い
out('nokogo.html', apply(ALGO, [
    ...rb('NOKOGO', '無コウ碁', 'nokogo'),
    [ONE, RV_ALGO, rv([
        '無コウルール: コウ禁止が存在しない。直前の盤面と同じ形に戻る着手も合法。',
        'コウ争いが即座に繰り返せるため、単劫は互いに取り合い続ける膠着になる。',
        '安全装置: 合計200手に達すると自動終局し得点計算する (劫争いの無限継続を防ぐ)。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 無コウルール<br>
            ※コウ禁止なし — 同一盤面の再現も合法。200手で自動終局`],
    [ONE, `            // コウ判定: 相手の直前の着手前と同一の盤面になる手は禁止
            if (captured.length > 0 && prevBoard) {
                if (after.every((v, i) => v === prevBoard[i])) return false;
            }`,
`            // 無コウ: コウ判定は行わない (同一盤面の再現も合法)`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限: 200手で自動終局 (劫ループの膠着を防ぐ)
            if (history.length >= 200) { endGameByScore(); return; }`],
    // 無コウ: 直前盤面への完全な逆戻り (劫返し) を可視化
    [ONE, CAPTURE_BLOCK,
`${CAPTURE_BLOCK}

            // 無コウ: 相手の着手前と同一盤面に戻った = 劫返し
            if (captured.length > 0 && prevBoard && board.every((v, i) => v === prevBoard[i])) {
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '劫返し!', '#a78bfa', 1000);
                fxGlow(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '#a78bfa', 700);
            }`],
    ...EVENT_CHIP_SPEC(`'無コウ 残' + Math.max(0, 200 - history.length) + '手'`),
    ...STONE_SPEC,
], 'nokogo'));

// 108. CHAOTICGO (混沌碁) — 潮汐+漂流+石雨の全乗せ
out('chaoticgo.html', apply(ALGO, [
    ...rb('CHAOTICGO', '混沌碁', 'chaoticgo'),
    [ONE, RV_ALGO, rv([
        '混沌ルール: 盤面が常に変化する全乗せモード。',
        '・8手ごとに全石がランダム方向へ漂流 / ・10手ごとに外周が水没↔復活 (潮汐) / ・9手ごとにランダムな空点へ壁が降る (石雨)',
        '陣形も盤面も維持できない。最終的に地+アゲハマ+コミで勝敗。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_ALGO,
`            通常の囲碁 + 混沌ルール<br>
            ※8手で全石漂流 / 10手で外周潮汐 / 9手で壁降下 — 全部同時。200手で自動終局`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        let tideHigh = false;`],
    [ONE, RESET_BOARD,
`${RESET_BOARD}
            tideHigh = false;`],
    [ONE, `        function endGameByScore() {`,
`        // 混沌: 漂流 + 潮汐 + 石雨
        function applyDrift() {
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            const [dx, dy] = dirs[(Math.random() * 4) | 0];
            const n = BOARD_SIZE;
            const order = [];
            for (let i = 0; i < n * n; i++)
                order.push({ i, key: (i % n) * dx + ((i / n) | 0) * dy });
            order.sort((a, b) => b.key - a.key);
            const moved = {};
            order.forEach(({ i }) => {
                if (board[i] !== 1 && board[i] !== 2) return;
                const x = i % n, y = (i / n) | 0, nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= n || ny < 0 || ny >= n) return;
                const ni = ny * n + nx;
                if (board[ni] === 0) { board[ni] = board[i]; board[i] = 0; moved[i] = ni; fxSlide(i, ni, 380); }
            });
            if (Object.keys(moved).length) fxShake(2, 180);
            pieces.forEach(pc => {
                pc.cells = pc.cells.map(p => {
                    const i = p.y * BOARD_SIZE + p.x;
                    return moved[i] === undefined ? p
                        : { x: moved[i] % BOARD_SIZE, y: (moved[i] / BOARD_SIZE) | 0 };
                });
            });
            cleanUpPieces();
        }
        function applyTide() {
            tideHigh = !tideHigh;
            const n = BOARD_SIZE;
            for (let i = 0; i < n; i++) {
                [i, (n - 1) * n + i, i * n, i * n + n - 1].forEach(idx => {
                    board[idx] = tideHigh ? 3 : 0;
                    if (tideHigh) fxSplash(idx, '#7dd3fc', 5);
                });
            }
            const cc = Math.floor(n / 2) * n + Math.floor(n / 2);
            fxText(cc, tideHigh ? '\\u6e80\\u6f6e' : '\\u5e72\\u6f6e', '#7dd3fc', 1100);
            if (tideHigh) fxShake(3, 220);
            pieces.forEach(pc => {
                pc.cells = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
            });
            cleanUpPieces();
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 混沌: 漂流(8) + 潮汐(10) + 石雨(9)
            if (history.length % 8 === 0) applyDrift();
            if (history.length % 10 === 0) applyTide();
            if (history.length % 9 === 0) {
                const empties = [];
                for (let i = 0; i < board.length; i++) if (board[i] === 0) empties.push(i);
                if (empties.length) board[empties[(Math.random() * empties.length) | 0]] = 3;
            }
            // 手数上限: 200手で自動終局
            if (history.length >= 200) { endGameByScore(); return; }`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + (tideHigh ? ' 🌊満' : '');`],
    [ONE, `                prevBoard,
                lastMove,
                currentPieceType,`,
`                prevBoard,
                lastMove,
                tideHigh,
                currentPieceType,`],
    [ONE, `            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;`,
`            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            if (snap.tideHigh !== undefined) tideHigh = snap.tideHigh;`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    tideHigh,
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            if (s.tideHigh !== undefined) tideHigh = s.tideHigh;`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                tideHigh,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (data.tideHigh !== undefined) tideHigh = data.tideHigh;`],
    // 潮汐の壁は水面 — 深い青の彫り込み + ゆらぐ波紋
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 水没マス: 深い青 + ゆらぐ波紋で塗る (潮汐で現れる水面)
            {
                const now = fxNow();
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.8);
                    g.addColorStop(0, '#1a6fa8'); g.addColorStop(1, '#0b3d5f');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const ph = Math.sin(now / 600 + x * 0.8 + y * 1.1);
                    ctx.strokeStyle = 'rgba(160,225,255,' + (0.4 + ph * 0.25) + ')';
                    ctx.lineWidth = Math.max(1, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * (0.22 + ph * 0.1), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(140,200,240,0.45)';
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
            }`],
    ...WALL_GUARD_SPEC,
    // 満潮時に薄い青の揺らめきを全面に敷く
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            if (!tideHigh) return;
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            ctx2.fillStyle = 'rgba(30,90,150,' + (0.06 + Math.sin(now / 900) * 0.03) + ')';
            ctx2.fillRect(0, 0, w, w);
            ctx2.restore();
        });`],
    ...EVENT_CHIP_SPEC(`(() => { const e = [['漂流', 8], ['潮汐', 10], ['石雨', 9]].map(([l, p]) => [l, p - history.length % p]); e.sort((a, b) => a[1] - b[1]); return e[0][0] + e[0][1] + '手'; })()`),
    ...STONE_SPEC,
], 'chaoticgo'));

console.log(K.failures === 0 ? 'ALL OK' : `${K.failures} replacements MISSING`);
process.exitCode = K.failures ? 1 : 0;
