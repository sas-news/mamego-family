// LABYRINTHGO — 迷路碁: 盤は蛇行する迷路。幅1の関門は自分の石に隣接する側からしか通れない
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'labyrinthgo.html',
    en: 'LABYRINTHGO',
    jp: '迷路碁',
    prefix: 'labyrinthgo',
    desc: '蛇行迷路。幅1の関門は自分の石に隣接する側からしか通れない。',
    kind: 'stone',
    icon: 'labyrinthgo',
    spec: [
        ...K.rb('LABYRINTHGO', '迷路碁', 'labyrinthgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 迷路: 偶数行は壁、奇数行は通路。偶数行の開口部「関門」は左右交互に開く
        const GATE_SET = new Set();
        for (let y = 2; y < BOARD_SIZE - 1; y += 2) {
            const gx = (y % 4 === 0) ? BOARD_SIZE - 2 : 1;
            GATE_SET.add(y * BOARD_SIZE + gx);
        }
        function isMazeOpen(x, y) {
            if (x <= 0 || y <= 0 || x >= BOARD_SIZE - 1 || y >= BOARD_SIZE - 1) return false;
            if (y % 2 === 1) return true;
            return GATE_SET.has(y * BOARD_SIZE + x);
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!isMazeOpen(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 関門は「到達した側」からしか通れない — 隣接する自分の石が必要
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `
            {
                const gi = cells[0].y * BOARD_SIZE + cells[0].x;
                if (GATE_SET.has(gi)
                    && !getNeighbors(gi).some(n => board[n] === player)) return false;
            }`],
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_MOSS)],
        ...K.WALL_GUARD_SPEC,
        K.CUE_GRID(`            // 関門: 鳥居のような赤い門を描く
            {
                ctx.save();
                GATE_SET.forEach(g => {
                    const x = g % BOARD_SIZE, y = (g / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(220, 38, 38, 0.8)';
                    ctx.lineWidth = Math.max(1.6, cellSize * 0.08);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.32, cy + cellSize * 0.3);
                    ctx.lineTo(cx - cellSize * 0.32, cy - cellSize * 0.2);
                    ctx.moveTo(cx + cellSize * 0.32, cy + cellSize * 0.3);
                    ctx.lineTo(cx + cellSize * 0.32, cy - cellSize * 0.2);
                    ctx.moveTo(cx - cellSize * 0.42, cy - cellSize * 0.22);
                    ctx.lineTo(cx + cellSize * 0.42, cy - cellSize * 0.22);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            迷路碁: 蛇行する迷路。関門は自分の石に隣接する側からしか通れない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は苔むした蛇行迷路。奇数行が通路で、通路同士は幅1の関門で繋がる。',
            '関門は「片側通行」: 自分の石に隣接する側からしか入れない。',
            '迷路を辿って地を確保する。関門を押さえて通路を塞ぐのが攻防。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('関門が迷路に存在する', GATE_SET.size >= 4);
        assert('偶数行の非関門は壁', board[I(4, 2)] === 3);
        assert('奇数行は通路', board[I(4, 3)] !== 3);
        const g = [...GATE_SET][0];
        const gx = g % BOARD_SIZE, gy = Math.floor(g / BOARD_SIZE);
        assert('孤立した側から関門に入れない', isValidPlacement([{ x: gx, y: gy }], 1) === false);
        board[I(gx, gy - 1)] = 1;
        assert('隣接する自分の石があれば関門を通れる', isValidPlacement([{ x: gx, y: gy }], 1) === true);
    `,
};
