// TWINGO — 双子碁: 中央隔壁で分かれた2枚の盤がワープ点で接続
const K = require('../gen_kit.js');
module.exports = {
    file: 'twingo.html',
    en: 'TWINGO',
    jp: '双子碁',
    prefix: 'twingo',
    desc: '隔壁で分かれた2盤。中央のワープ点だけが両盤を結ぶ。',
    kind: 'stone',
    spec: [
        ...K.rb('TWINGO', '双子碁', 'twingo'),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            // ワープ点: 左右盤の中心同士が繋がる
            const c = Math.floor(BOARD_SIZE / 2);
            const wl = c * BOARD_SIZE + Math.floor(c / 2);
            const wr = c * BOARD_SIZE + (c + Math.ceil(c / 2));
            if (idx === wl) neighbors.push(wr);
            if (idx === wr) neighbors.push(wl);
            return neighbors;
        }`],
        // 中央列を隔壁に
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2);
                for (let y = 0; y < BOARD_SIZE; y++) board[y * BOARD_SIZE + c] = 3;
            }`],
        // ワープ点: 回転する金環ポータルと両点を結ぶリンク弧
        K.CUE_STARS(`            {
                const c = Math.floor(BOARD_SIZE / 2);
                const pts = [[Math.floor(c / 2), c], [c + Math.ceil(c / 2), c]];
                const now = fxNow();
                ctx.save();
                // ワープリンク: 隔壁を跨ぐ淡い破線の弧
                {
                    const ax = padding + pts[0][0] * cellSize, ay = padding + pts[0][1] * cellSize;
                    const bx = padding + pts[1][0] * cellSize, by = padding + pts[1][1] * cellSize;
                    ctx.strokeStyle = 'rgba(184,134,11,0.45)';
                    ctx.setLineDash([cellSize * 0.12, cellSize * 0.10]);
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.quadraticCurveTo((ax + bx) / 2, ay - cellSize * 1.5, bx, by);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                pts.forEach(([wx, wy], pi) => {
                    const cx = padding + wx * cellSize, cy = padding + wy * cellSize;
                    const ph = (now / 900 + pi * 0.5) % 1;
                    ctx.strokeStyle = 'rgba(184,134,11,' + (0.85 - ph * 0.5) + ')';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * (0.28 + ph * 0.14), 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                    // 周回する光点
                    const an = now / 500 + pi * Math.PI;
                    ctx.fillStyle = '#fde68a';
                    ctx.beginPath();
                    ctx.arc(cx + Math.cos(an) * cellSize * 0.34, cy + Math.sin(an) * cellSize * 0.34, cellSize * 0.06, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は中央の隔壁で左右2枚に分断。通常は行き来できない。',
            '両盤の中心にある金環のワープ点同士だけが近傍として繋がる。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 隔壁: リベット鋼板 (中央の断絶壁は「隔壁」らしい質感)
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`, `            const covered = new Set(); // ピース描画でカバー済みのマス

            // 隔壁セル: リベット鋼板の質感で覆い、境界は盤の縁線で締める
            {
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    const cx0 = padding + x * cellSize, cy0 = padding + y * cellSize;
                    const g = ctx.createLinearGradient(cx0 - cellSize * 0.5, cy0, cx0 + cellSize * 0.5, cy0);
                    g.addColorStop(0, '#3f3f46'); g.addColorStop(0.5, '#57575e'); g.addColorStop(1, '#26262b');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx0 - cellSize * 0.5, cy0 - cellSize * 0.5, cellSize, cellSize);
                    // リベット
                    ctx.fillStyle = 'rgba(228,228,231,0.55)';
                    [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]].forEach(([rx, ry]) => {
                        ctx.beginPath();
                        ctx.arc(cx0 + rx * cellSize, cy0 + ry * cellSize, cellSize * 0.045, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    // 鋼板の枠線
                    ctx.strokeStyle = 'rgba(24,24,27,0.9)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(cx0 - cellSize * 0.5, cy0 - cellSize * 0.5, cellSize, cellSize);
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
            }`],
        ...K.WALL_GUARD_SPEC,
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.STONE_SPEC,
    ],
    test: `
        const c = Math.floor(BOARD_SIZE / 2);
        const wl = c * BOARD_SIZE + Math.floor(c / 2);
        const wr = c * BOARD_SIZE + (c + Math.ceil(c / 2));
        assert('中央列は隔壁', board[c] === 3 && isValidPlacement([{ x: c, y: 0 }], 1) === false);
        assert('左のワープ点は右に繋がる', getNeighbors(wl).includes(wr));
        assert('右のワープ点は左に繋がる', getNeighbors(wr).includes(wl));
        assert('左盤は普通に置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board.fill(0);
        board[wl] = 1; board[wr] = 2;
        assert('ワープ越しに取れる', getNeighbors(wl).includes(wr) && board[wl] === 1);
    `,
};
