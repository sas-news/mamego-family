// TERRACEGO — 段丘碁: 盤は棚田状の3段。段差を挟む石は繋がらず、段差越しの連携は重い手
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
    file: 'terracego.html',
    en: 'TERRACEGO',
    jp: '段丘碁',
    prefix: 'terracego',
    desc: '棚田状の3段盤。段差を挟む同色石は連にならない — 段差越しは重い手。',
    kind: 'stone',
    icon: 'terracego',
    spec: [
        ...K.rb('TERRACEGO', '段丘碁', 'terracego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 段丘: 3つの水平バンド。段差を挟むセル同士は連にならない
        function terraBand(y) { return Math.min(2, Math.floor(y * 3 / BOARD_SIZE)); }`],
        // 段差越しは連を張れない (取り判定の連拡張を同一段に限定)
        [K.ONE, `                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });`,
`                        const neighbors = getNeighbors(curr);
                        const curBand = terraBand(Math.floor(curr / BOARD_SIZE));
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]
                                && terraBand(Math.floor(n / BOARD_SIZE)) === curBand) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });`],
        [K.ONE, `                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;`,
`                const neighbors = getNeighbors(curr);
                const curBand = terraBand(Math.floor(curr / BOARD_SIZE));
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;`],
        [K.ONE, `                    } else if (boardState[n] === player && !visited[n]) {
                        visited[n] = true;
                        queue.push(n);
                    }
                });
            }
            return liberties;`,
`                    } else if (boardState[n] === player && !visited[n]
                        && terraBand(Math.floor(n / BOARD_SIZE)) === curBand) {
                        visited[n] = true;
                        queue.push(n);
                    }
                });
            }
            return liberties;`],
        // 棚田の田面と畦道
        K.CUE_GRID(`            // 段丘: 段ごとの田面色と畦道ライン
            {
                ctx.save();
                const bandCols = ['rgba(96, 150, 110, 0.16)', 'rgba(140, 170, 100, 0.16)', 'rgba(190, 175, 110, 0.18)'];
                for (let y = 0; y < BOARD_SIZE; y++) {
                    ctx.fillStyle = bandCols[terraBand(y)];
                    ctx.fillRect(padding - cellSize / 2, padding + (y - 0.5) * cellSize, cellSize * BOARD_SIZE, cellSize);
                }
                for (let b = 1; b <= 2; b++) {
                    const yEdge = Math.ceil(b * BOARD_SIZE / 3);
                    if (yEdge >= BOARD_SIZE) continue;
                    const yy = padding + (yEdge - 0.5) * cellSize;
                    ctx.strokeStyle = 'rgba(84, 60, 30, 0.75)';
                    ctx.lineWidth = Math.max(2, cellSize * 0.12);
                    ctx.beginPath();
                    ctx.moveTo(padding - cellSize / 2, yy);
                    ctx.lineTo(padding + (BOARD_SIZE - 0.5) * cellSize, yy);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            段丘碁: 棚田状の3段盤。段差を挟む同色石は連にならない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は水平3段の棚田。段差を挟む同色石は連にならない。',
            '段を跨ぐ着手は「重い手」— 上の段の石が下の段を助けられない。',
            '各段で独立した死活が並行する。段ごとの地を意識せよ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const y0 = Math.ceil(BOARD_SIZE / 3) - 1;
        const y1 = y0 + 1;
        board[I(2, y0)] = 1; board[I(2, y1)] = 1;
        assert('段差を挟む石は連にならない', getLiberties(board, I(2, y0)) <= 3);
        board[I(1, y0)] = 1;
        assert('同じ段なら連になる', getLiberties(board, I(2, y0)) > 3);
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
