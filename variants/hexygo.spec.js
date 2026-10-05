// HEXYGO — 六角辺碁: 6方向近傍 + 辺 (盤端) の地が2倍
const K = require('../gen_kit.js');
module.exports = {
    file: 'hexygo.html',
    en: 'HEXYGO',
    jp: '六角辺碁',
    prefix: 'hexygo',
    desc: '6方向近傍の擬似六角盤。さらに辺の地は2倍計算で端の争いが熱い。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('HEXYGO', '六角辺碁', 'hexygo'),
        K.params([
            { key: 'edge_mult', label: '辺の地の倍率', min: 1, max: 4, def: 2, step: 0.5, unit: '倍' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0, max: 400, def: 0, unit: '手', hint: '0=制限なし' },
        ]),
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 設定で有効化した場合、長期戦は強制採点 (1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && (P('ply_cap') || 0) > 0 && history.length >= (P('ply_cap') || 0)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
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
        // 辺の地は2倍にする集計
        [K.ONE, `                    if (touchesBlack && !touchesWhite) blackTerritory += region.length;
                    else if (touchesWhite && !touchesBlack) whiteTerritory += region.length;`,
`                    const wsum = arr => arr.reduce((s, i2) => {
                        const wx = i2 % BOARD_SIZE, wy = Math.floor(i2 / BOARD_SIZE);
                        const isEdge = wx === 0 || wy === 0 || wx === BOARD_SIZE - 1 || wy === BOARD_SIZE - 1;
                        return s + (isEdge ? (P('edge_mult') || 2) : 1);
                    }, 0);
                    if (touchesBlack && !touchesWhite) blackTerritory += wsum(region);
                    else if (touchesWhite && !touchesBlack) whiteTerritory += wsum(region);`],
        // 辺の帯をうっすら強調
        K.CUE_GRID(`            // 辺の帯を強調 (地2倍エリア)
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.45);
                ctx.lineWidth = cellSize * 0.5;
                ctx.globalAlpha = 0.25;
                ctx.strokeRect(padding, padding, (BOARD_SIZE - 1) * cellSize, (BOARD_SIZE - 1) * cellSize);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            六角辺碁: 6方向近傍の擬似六角盤。辺の地は2倍計算<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '近傍が上下左右+斜め2方向の計6方向になる六角形盤。連の形が大きく変わる。',
            'さらに地集計では盤端 (辺) の空点が1点2目で計算される。辺の取り合いが勝敗を分ける。',
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
        board.fill(0); pieces = [];
        assert('中央の近傍は6', getNeighbors(6 * BOARD_SIZE + 6).length === 6);
        assert('角の近傍は3', getNeighbors(0).length === 3);
        board[1] = 1; board[BOARD_SIZE] = 1; board[BOARD_SIZE + 1] = 1;
        const t = calculateTerritory();
        let cells = 0, edge = 0;
        for (let i = 0; i < board.length; i++) {
            if (board[i] !== 0) continue;
            const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
            cells++;
            if (x === 0 || y === 0 || x === BOARD_SIZE - 1 || y === BOARD_SIZE - 1) edge++;
        }
        assert('辺の地は2倍', t.black === cells + edge);
    `,
};
