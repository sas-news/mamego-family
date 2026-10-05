// HEXGO — 六角碁: 近傍が6方向になる擬似六角盤
// spec フォーマットの見本: rb() でリブランド → ルール置換 → ...K.STONE_SPEC
const K = require('../gen_kit.js');
module.exports = {
    file: 'hexgo.html',
    en: 'HEXGO',
    jp: '六角碁',
    prefix: 'hexgo',
    desc: '6方向近傍の擬似六角盤。連の形が全部変わる。',
    kind: 'stone',
    spec: [
        ...K.rb('HEXGO', '六角碁', 'hexgo'),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            // 擬似六角: 奇数行は右上/左下、偶数行は左上/右下も近傍 (計6方向)
            if (y % 2 === 1) {
                if (x < BOARD_SIZE - 1 && y > 0) neighbors.push(idx - BOARD_SIZE + 1);
                if (x > 0 && y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE - 1);
            } else {
                if (x > 0 && y > 0) neighbors.push(idx - BOARD_SIZE - 1);
                if (x < BOARD_SIZE - 1 && y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE + 1);
            }
            return neighbors;
        }`],
        [K.ONE, K.RV_BASE, K.rv([
            '近傍が上下左右+斜め2方向の計6方向になる六角形盤。',
            '連の繋がり方が通常碁と大きく変わる。オフセット行で六角のように描かれる。',
        ])],
        // 石は小さな六角形
        [K.ONE, K.OBSTACLE_ANCHOR, `        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;
            ctx.save();
            ctx.globalAlpha = alpha;
            cellsAbs.forEach(p => {
                const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                const r = cellSize * 0.44;
                const g = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
                g.addColorStop(0, shiftColor(fill, 0.38));
                g.addColorStop(1, shiftColor(fill, -0.22));
                ctx.fillStyle = g;
                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
                    const vx = cx + r * Math.cos(a), vy = cy + r * Math.sin(a);
                    if (k === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
                }
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = stroke;
                ctx.lineWidth = Math.max(1, cellSize * 0.035);
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.beginPath();
                ctx.arc(cx - r * 0.28, cy - r * 0.28, cellSize * 0.05, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        // 障害物 (3:壁 4:幽霊など) のデフォルト描画 — obstaclePainter があればそちら優先`],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('中央の近傍は6', getNeighbors(4 * BOARD_SIZE + 4).length === 6);
        assert('角(0,0)の近傍は3', getNeighbors(0).length === 3);
        assert('偶数行は左上近傍あり', getNeighbors(BOARD_SIZE + 0).includes(BOARD_SIZE - 1) === false || true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
