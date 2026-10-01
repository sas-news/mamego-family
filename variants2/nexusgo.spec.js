// NEXUSGO — 結節碁: 十字の溝で分かれた4小盤が中央ネクサスで接続
const K = require('../gen_kit.js');
module.exports = {
    file: 'nexusgo.html',
    en: 'NEXUSGO',
    jp: '結節碁',
    prefix: 'nexusgo',
    desc: '十字溝で隔てた4小盤。唯一の中央点が全てを結ぶ結節点。',
    kind: 'stone',
    spec: [
        ...K.rb('NEXUSGO', '結節碁', 'nexusgo'),
        K.params([
            { key: 'nexus_open', label: '中央の結節点', options: [{ v: 'open', l: 'あり (4小盤を結ぶ)' }, { v: 'closed', l: 'なし (完全分断)' }], def: 'open' },
        ]),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const c = Math.floor(BOARD_SIZE / 2);
            const nexus = c * BOARD_SIZE + c;
            // ネクサスは斜め4点 (各小盤の角) にだけ繋がる
            if (idx === nexus) {
                if (P('nexus_open') === 'closed') return [];
                return [nexus - BOARD_SIZE - 1, nexus - BOARD_SIZE + 1,
                        nexus + BOARD_SIZE - 1, nexus + BOARD_SIZE + 1];
            }
            const neighbors = [];
            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            // ネクサスに接する斜め4点はネクサスにも繋がる
            if (Math.abs(x - c) === 1 && Math.abs(y - c) === 1 && P('nexus_open') !== 'closed') neighbors.push(nexus);
            return neighbors;
        }
        // 結節点の有無を変えたら溝を含め盤面を作り直す
        function onVariantParam(p) {
            if (p.key === 'nexus_open') resetGame();
        }`],
        // 十字の溝 (ネクサスだけ残す)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2);
                for (let i = 0; i < BOARD_SIZE; i++) {
                    board[c * BOARD_SIZE + i] = 3;
                    board[i * BOARD_SIZE + c] = 3;
                }
                board[c * BOARD_SIZE + c] = P('nexus_open') === 'closed' ? 3 : 0;
            }`],
        // ネクサスに金環
        K.CUE_STARS(`            {
                const c = Math.floor(BOARD_SIZE / 2);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                ctx.save();
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.44, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '十字の溝で4つの小盤に分断。中央の1点「ネクサス」だけが斜め4点を結ぶ。',
            'ネクサスを握れば4盤の連絡を支配できる。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        // 溝は深淵テクスチャで自前描画 (WALL_SPECの彫り込みを差し替え)
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`, `            const covered = new Set(); // ピース描画でカバー済みのマス

            // 溝: 星屑の瞬く深淵
            {
                const now = fxNow();
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.75);
                    g.addColorStop(0, '#141433');
                    g.addColorStop(1, '#07071a');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const tw = Math.sin(now / 500 + x * 2.7 + y * 3.9);
                    if (tw > 0.55) {
                        ctx.fillStyle = 'rgba(190,200,255,' + ((tw - 0.55) * 0.9).toFixed(3) + ')';
                        ctx.beginPath();
                        ctx.arc(cx + Math.sin(x * 13.7 + y * 7.1) * cellSize * 0.25, cy + Math.cos(x * 9.3 + y * 11.7) * cellSize * 0.25, Math.max(0.8, cellSize * 0.04), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.5);
                ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
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
        ...K.WALL_GUARD_SPEC,
        // ネクサスの鼓動: 斜め4点へ流れる光と脈動リング
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const c = Math.floor(BOARD_SIZE / 2);
            const nx = pad + c * cs, ny = pad + c * cs;
            const ph = (Math.sin(now / 700) + 1) / 2;
            ctx2.save();
            [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx, dy]) => {
                ctx2.strokeStyle = 'rgba(255,215,120,' + (0.10 + ph * 0.20).toFixed(3) + ')';
                ctx2.lineWidth = Math.max(1, cs * 0.05);
                ctx2.beginPath();
                ctx2.moveTo(nx, ny);
                ctx2.lineTo(pad + (c + dx) * cs, pad + (c + dy) * cs);
                ctx2.stroke();
            });
            ctx2.strokeStyle = 'rgba(255,210,110,' + (0.35 + ph * 0.45).toFixed(3) + ')';
            ctx2.lineWidth = Math.max(1.4, cs * 0.07);
            ctx2.beginPath();
            ctx2.arc(nx, ny, cs * (0.3 + ph * 0.14), 0, Math.PI * 2);
            ctx2.stroke();
            ctx2.restore();
        });`],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        const c = Math.floor(BOARD_SIZE / 2);
        const nexus = c * BOARD_SIZE + c;
        assert('ネクサスは置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('十字溝は置けない', isValidPlacement([{ x: 0, y: c }], 1) === false);
        assert('ネクサスの近傍は斜め4点', getNeighbors(nexus).length === 4 && getNeighbors(nexus).includes(nexus - BOARD_SIZE - 1));
        assert('斜め点はネクサスに繋がる', getNeighbors(nexus - BOARD_SIZE - 1).includes(nexus));
        assert('小盤の中は普通に置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
