// HOLEGO — 穴あき碁: 盤に散在する穴 (着手不可・非呼吸点)
const K = require('../gen_kit.js');
module.exports = {
    file: 'holego.html',
    en: 'HOLEGO',
    jp: '穴あき碁',
    prefix: 'holego',
    desc: '盤にポツポツ空いた穴。置けない・呼吸にもならない欠損点。',
    kind: 'stone',
    spec: [
        ...K.rb('HOLEGO', '穴あき碁', 'holego'),
        // 決定的なハッシュで穴を配置 (盤サイズで再現性あり)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if ((x * 31 + y * 17 + BOARD_SIZE) % 13 === 0) board[y * BOARD_SIZE + x] = 3;
            }`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の所々に穴が空いている。穴には置けず、呼吸点にも地にもならない。',
            '穴は盤サイズごとに固定。欠けた呼吸点を計算に入れて戦う。',
        ])],
        // 穴は底なしの丸い落とし穴
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_PIT)],
        ...K.WALL_GUARD_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        let holes = 0, first = -1;
        for (let i = 0; i < board.length; i++) if (board[i] === 3) { holes++; if (first < 0) first = i; }
        assert('穴が散在する', holes > 5);
        assert('穴には置けない', isValidPlacement([{ x: first % BOARD_SIZE, y: Math.floor(first / BOARD_SIZE) }], 1) === false);
        const t = board.map(v => v === 3 ? 3 : 0);
        t[0] = 1;
        const expected = getNeighbors(0).filter(n => t[n] === 0).length;
        assert('穴は呼吸点にならない', getLiberties(t, 0) === expected);
        let open = 0;
        for (const v of board) if (v === 0) open++;
        assert('大部分は通常盤', open > BOARD_SIZE * BOARD_SIZE * 0.8);
    `,
};
