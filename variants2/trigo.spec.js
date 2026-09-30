// TRIGO — 三角碁: 近傍3方向の三角格子盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'trigo.html',
    en: 'TRIGO',
    jp: '三角碁',
    prefix: 'trigo',
    desc: '近傍が3方向の三角格子。呼吸点が少なく取り合いが激しい。',
    kind: 'stone',
    spec: [
        ...K.rb('TRIGO', '三角碁', 'trigo'),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            // 三角格子: 偶数点は上、奇数点は下にもう1辺だけ伸びる (計3方向)
            if ((x + y) % 2 === 0) {
                if (y > 0) neighbors.push(idx - BOARD_SIZE);
            } else {
                if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            }
            return neighbors;
        }`],
        // 各点が3つ目の辺をどちらに伸ばすか小三角で示す
        K.CUE_GRID(`            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.18);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const r = cellSize * 0.30, dir = (x + y) % 2 === 0 ? -1 : 1;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy + dir * r);
                    ctx.lineTo(cx - r * 0.87, cy - dir * r * 0.5);
                    ctx.lineTo(cx + r * 0.87, cy - dir * r * 0.5);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '三角格子の盤: 各点は左右+交互の上下、計3方向にだけ繋がる。',
            '呼吸点が少ないので小さな連でもすぐ取られる激しい碁。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
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
        assert('偶数点(3,3)の近傍は3', getNeighbors(3 * BOARD_SIZE + 3).length === 3);
        assert('偶数点は上に伸びる', getNeighbors(3 * BOARD_SIZE + 3).includes(2 * BOARD_SIZE + 3));
        assert('奇数点は下に伸びる', getNeighbors(4 * BOARD_SIZE + 3).includes(5 * BOARD_SIZE + 3));
        board.fill(0);
        board[3 * BOARD_SIZE + 3] = 1;
        board[3 * BOARD_SIZE + 2] = 2;
        board[3 * BOARD_SIZE + 4] = 2;
        board[2 * BOARD_SIZE + 3] = 2;
        assert('3方向から囲めば取れる', getCapturedStones(board, 1).includes(3 * BOARD_SIZE + 3));
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: 2, y: 2 }], 1) === true);
    `,
};
