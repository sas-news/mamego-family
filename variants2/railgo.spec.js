// RAILGO — 環状線碁: 最外周が環状線路のように対辺で繋がる
const K = require('../gen_kit.js');
module.exports = {
    file: 'railgo.html',
    en: 'RAILGO',
    jp: '環状線碁',
    prefix: 'railgo',
    desc: '最外周だけが左右・上下で環状に繋がる。端を越えて連が伸びる。',
    kind: 'stone',
    spec: [
        ...K.rb('RAILGO', '環状線碁', 'railgo'),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            // 環状線: 外周同士が対辺で繋がる
            if (x === 0) neighbors.push(y * BOARD_SIZE + (BOARD_SIZE - 1));
            if (x === BOARD_SIZE - 1) neighbors.push(y * BOARD_SIZE);
            if (y === 0) neighbors.push((BOARD_SIZE - 1) * BOARD_SIZE + x);
            if (y === BOARD_SIZE - 1) neighbors.push(x);
            return neighbors;
        }`],
        // 対辺が繋がるシェブロン印
        ...K.WRAP_MARKS_SPEC(`                chev(midC, padding, 0, -1);
                chev(midC, width - padding, 0, 1);
                chev(padding, midC, -1, 0);
                chev(width - padding, midC, 1, 0);`),
        [K.ONE, K.RV_ALGO, K.rv([
            '最外周の点だけが対辺と環状に繋がる (左端↔右端、上端↔下端)。',
            '連も呼吸も端を越えて伸びるので、隅が弱くない円環の碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE;
        assert('左端は右端と繋がる', getNeighbors(0).includes(N - 1));
        assert('上端は下端と繋がる', getNeighbors(0).includes((N - 1) * N));
        assert('中央は通常の4近傍', getNeighbors(4 * N + 4).length === 4);
        board.fill(0);
        board[0] = 1;
        board[1] = 2; board[N] = 2; board[N - 1] = 2; board[(N - 1) * N] = 2;
        assert('端を越えて囲めば取れる', getCapturedStones(board, 1).includes(0));
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
