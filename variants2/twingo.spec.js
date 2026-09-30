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
        // ワープ点に金の二重環
        K.CUE_STARS(`            {
                const c = Math.floor(BOARD_SIZE / 2);
                const pts = [[Math.floor(c / 2), c], [c + Math.ceil(c / 2), c]];
                ctx.save();
                pts.forEach(([wx, wy]) => {
                    const cx = padding + wx * cellSize, cy = padding + wy * cellSize;
                    ctx.strokeStyle = '#b8860b';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.28, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は中央の隔壁で左右2枚に分断。通常は行き来できない。',
            '両盤の中心にある金環のワープ点同士だけが近傍として繋がる。',
        ])],
        ...K.WALL_SPEC,
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
