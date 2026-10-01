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
        K.params([
            { key: 'maze_seed', label: '迷路のシード', min: 0, max: 99, def: 0, hint: '迷路の形が変わる (0=標準)' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.7, max: 2.5, def: 1.4, step: 0.05, hint: '交点数×倍率' },
        ]),
        // 部屋格子の全域木を掘る (seeded で決定的)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(3);
            {
                let seed = (BOARD_SIZE * 2654435761 + (P('maze_seed') || 0)) % 2147483647;
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
        // 迷路の壁は苔むした石壁
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_MOSS)],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '迷路のように掘り抜かれた盤。通路は1マス幅で行き止まりも多い。',
            '通路を押さえれば連を分断できる。袋小路の逃げ込みに注意。',
            '迷路の形は盤サイズごとに固定。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        // 打ち切り手数は設定で調整可能
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 新規対局 (履歴空) で打ち切りを再武装
            if (moveCapFired && history.length === 0) moveCapFired = false;
            // 打ち切り手数: 交点数の1.4倍を超える長期戦は死に石選択へ移行して自動終局
            // (1局につき1回のみ発火。死に石選択を取り消して続行する場合は再発火しない)
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.4))) {
                moveCapFired = true;
                startDeadStoneSelectionPhase();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }`],
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
