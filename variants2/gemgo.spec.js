// GEMGO — 宝石碁: 取られた石はその場で宝石に結晶化し、置けない壁として残る
const K = require('../gen_kit.js');
module.exports = {
    file: 'gemgo.html',
    en: 'GEMGO',
    jp: '宝石碁',
    prefix: 'gemgo',
    desc: '取られた石は宝石に結晶化。永久の壁として盤上に残る。',
    kind: 'stone',
    spec: [
        ...K.rb('GEMGO', '宝石碁', 'gemgo'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    board[idx] = 3; // 宝石化: 取られた石は壁として残る
                    fxBurst(idx, '#7dd3fc', 8, 1.2);
                    fxGlow(idx, '#7dd3fc', 800);
                });
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxText(ci, '結晶!', '#7dd3fc', 1100);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 宝石セルの描画 (drawBoardElements の先頭に差し込み)
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 宝石セル (board===3): 青い結晶ダイヤ
            {
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (board[y * BOARD_SIZE + x] !== 3) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const rr = cellSize * 0.42;
                    ctx.fillStyle = 'rgba(70, 180, 235, 0.9)';
                    ctx.strokeStyle = 'rgba(20, 90, 150, 0.95)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - rr);
                    ctx.lineTo(cx + rr * 0.75, cy);
                    ctx.lineTo(cx, cy + rr);
                    ctx.lineTo(cx - rr * 0.75, cy);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(cx - rr * 0.28, cy - rr * 0.28);
                    ctx.lineTo(cx + rr * 0.28, cy + rr * 0.28);
                    ctx.stroke();
                }
                ctx.restore();
            }`],
        // 宝石の瞬き: 結晶の上を光がゆっくり巡る (再描画を駆動するオーバーレイ)
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 3) continue;
                const tw = Math.sin(now / 600 + i * 1.9);
                if (tw <= 0.55) continue;
                const cx = pad + (i % BOARD_SIZE) * cs, cy = pad + Math.floor(i / BOARD_SIZE) * cs;
                ctx2.globalAlpha = (tw - 0.55) * 0.8;
                ctx2.fillStyle = '#ffffff';
                ctx2.beginPath();
                ctx2.arc(cx - cs * 0.10, cy - cs * 0.12, cs * 0.09, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        // 宝石は石として描かない & 死に石選択から除外
        [K.ONE, K.FALLBACK_SKIP,
`                    if (val !== 1 && val !== 2) continue; // 空点・宝石は石として描かない`],
        [K.ONE, K.TOGGLE_GUARD,
`            const color = board[startIdx];
            if (color === 0 || color === 3) return;`],
        [K.ONE, K.RV_BASE, K.rv([
            '取られた敵石はその場で宝石 (青い結晶) に結晶化し、永久の壁として残る。',
            '宝石の上には置けず呼吸点にもならない。取るたび盤が少しずつ埋まっていく。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('取られた石は宝石化', board[5 * BOARD_SIZE + 5] === 3);
        assert('取り数は通常通り', captures[1] === 1);
        assert('宝石の上には置けない', isValidPlacement([{ x: 5, y: 5 }], 2) === false);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 2);
        assert('他の点は普通に置ける', board[3 * BOARD_SIZE + 3] === 2);
    `,
};
