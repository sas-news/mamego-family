// MAZEGO — 迷路碁:  seeded DFS で掘られた迷路状の壁
const K = require('../gen_kit.js');
module.exports = {
    file: 'mazego.html',
    en: 'MAZEGO',
    jp: '迷路碁',
    prefix: 'mazego',
    desc: '迷路状に掘り抜かれた盤。一本道を巡る追撃戦。',
    kind: 'stone',
    spec: [
        ...K.rb('MAZEGO', '迷路碁', 'mazego'),
        // 部屋格子の全域木を掘る (seeded で決定的)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(3);
            {
                let seed = (BOARD_SIZE * 2654435761) % 2147483647;
                if (seed <= 0) seed += 2147483646;
                const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
                const RW = Math.floor(BOARD_SIZE / 2), RH = Math.floor(BOARD_SIZE / 2);
                const seen = new Set(['0,0']);
                const stack = [[0, 0]];
                board[1 * BOARD_SIZE + 1] = 0;
                while (stack.length) {
                    const [cx, cy] = stack[stack.length - 1];
                    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]]
                        .map(([dx, dy]) => [cx + dx, cy + dy, dx, dy])
                        .filter(([nx, ny]) => nx >= 0 && nx < RW && ny >= 0 && ny < RH && !seen.has(nx + ',' + ny));
                    if (!opts.length) { stack.pop(); continue; }
                    const [nx, ny, dx, dy] = opts[Math.floor(rnd() * opts.length)];
                    seen.add(nx + ',' + ny);
                    board[(1 + 2 * ny) * BOARD_SIZE + (1 + 2 * nx)] = 0;
                    board[(1 + 2 * cy + dy) * BOARD_SIZE + (1 + 2 * cx + dx)] = 0;
                    stack.push([nx, ny]);
                }
            }`],
        ...K.WALL_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '迷路のように掘り抜かれた盤。通路は1マス幅で行き止まりも多い。',
            '通路を押さえれば連を分断できる。袋小路の逃げ込みに注意。',
            '迷路の形は盤サイズごとに固定。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        let w = 0;
        for (const v of board) if (v === 3) w++;
        assert('迷路の壁がある', w > 60);
        assert('起点の部屋は置ける', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
        const before = w;
        resetGame();
        let w2 = 0;
        for (const v of board) if (v === 3) w2++;
        assert('迷路は盤サイズで決定的', w2 === before);
        assert('壁には置けない', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
