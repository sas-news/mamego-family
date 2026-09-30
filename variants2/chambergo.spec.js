// CHAMBERGO — 四室碁: 十字の壁で4大部屋に分割 (扉あり)
const K = require('../gen_kit.js');
module.exports = {
    file: 'chambergo.html',
    en: 'CHAMBERGO',
    jp: '四室碁',
    prefix: 'chambergo',
    desc: '十字の隔壁で4部屋に分割。扉を巡る城攻めの碁。',
    kind: 'stone',
    spec: [
        ...K.rb('CHAMBERGO', '四室碁', 'chambergo'),
        // 十字壁 + 各辺2枚の扉
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2), q = Math.floor(BOARD_SIZE / 4);
                const m = BOARD_SIZE - 1 - q;
                for (let i = 0; i < BOARD_SIZE; i++) {
                    board[c * BOARD_SIZE + i] = 3;
                    board[i * BOARD_SIZE + c] = 3;
                }
                board[c * BOARD_SIZE + q] = 0;
                board[c * BOARD_SIZE + m] = 0;
                board[q * BOARD_SIZE + c] = 0;
                board[m * BOARD_SIZE + c] = 0;
            }`],
        // 扉に薄い金丸
        K.CUE_STARS(`            {
                const c = Math.floor(BOARD_SIZE / 2), q = Math.floor(BOARD_SIZE / 4);
                const m = BOARD_SIZE - 1 - q;
                ctx.save();
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                [[q, c], [m, c], [c, q], [c, m]].forEach(([dx, dy]) => {
                    ctx.beginPath();
                    ctx.arc(padding + dx * cellSize, padding + dy * cellSize, cellSize * 0.26, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.WALL_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '十字の隔壁で4つの大部屋に分割。各部屋は2つの扉で隣室と繋がる。',
            '扉を押さえれば敵の侵入を防げる。部屋ごとの局地戦。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, c = Math.floor(N / 2), q = Math.floor(N / 4);
        assert('扉は置ける', isValidPlacement([{ x: q, y: c }], 1) === true);
        assert('隔壁は置けない', isValidPlacement([{ x: 0, y: c }], 1) === false);
        assert('中央交点も壁', board[c * N + c] === 3);
        assert('部屋の中は置ける', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
        assert('扉で部屋が繋がる', getNeighbors(q * N + c).includes(q * N + c - 1) && getNeighbors(q * N + c).includes(q * N + c + 1));
    `,
};
