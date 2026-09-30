// CYLINDERGO — 中空碁: 盤は円筒の内側。左右の端が繋がる筒状
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
    file: 'cylindergo.html',
    en: 'CYLINDERGO',
    jp: '中空碁',
    prefix: 'cylindergo',
    desc: '円筒の内側の盤。左右の端が繋がり、右端の隣は左端。',
    kind: 'stone',
    icon: 'cylindergo',
    spec: [
        ...K.rb('CYLINDERGO', '中空碁', 'cylindergo'),
        // 円筒: 左右の端がループ (上下は通常の辺)
        [K.ONE, K.NBRS_GRID,
`        // 円筒: 左右の端がループする。右端の隣は左端 (上下の辺は通常通り)
        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const xm = (x - 1 + BOARD_SIZE) % BOARD_SIZE;
            const xp = (x + 1) % BOARD_SIZE;
            const neighbors = [y * BOARD_SIZE + xm, y * BOARD_SIZE + xp];
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            return neighbors;
        }`],
        [K.ONE, `                const cells = shape.map(([dx, dy]) => ({ x: tx + dx, y: ty + dy }));`,
`                const cells = shape.map(([dx, dy]) => ({
                    x: ((tx + dx) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE,
                    y: ty + dy
                }));`],
        ...K.WRAP_MARKS_SPEC(`chev(padding * 0.55, midC, -1, 0); chev(width - padding * 0.55, midC, 1, 0);`),
        // 円筒: 左右端の石は対側の端にも半透明で映る
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 円筒: 左右端の石は対側の端にも半透明で映る
            {
                ctx.save();
                ctx.globalAlpha = 0.30;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const v = board[y * BOARD_SIZE + x];
                    if (v !== 1 && v !== 2) continue;
                    ctx.fillStyle = v === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                    const ghost = (gx, gy) => {
                        ctx.beginPath();
                        ctx.arc(padding + gx * cellSize, padding + gy * cellSize, cellSize * 0.26, 0, Math.PI * 2);
                        ctx.fill();
                    };
                    if (x === 0) ghost(BOARD_SIZE - 1, y);
                    if (x === BOARD_SIZE - 1) ghost(0, y);
                }
                ctx.restore();
            }`],
        [K.ONE, K.INFO_ALGO, `            中空碁: 円筒の内側。左右の端が繋がる筒状の盤<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は円筒の内側 — 左端と右端が繋がっている (上下の辺は通常通り)。',
            '端を越えて連・呼吸点・取り・地の判定はそのまま続く。',
            '左右に「辺」がないので隅と辺の戦略が通常碁と大きく変わる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('右端の隣は左端', getNeighbors(I(0, 4)).includes(I(BOARD_SIZE - 1, 4)));
        assert('左端の隣は右端', getNeighbors(I(BOARD_SIZE - 1, 4)).includes(I(0, 4)));
        assert('上端は繋がらない', !getNeighbors(I(4, 0)).includes(I(4, BOARD_SIZE - 1)));
        // 筒を回った連: 右端と左端の石が繋がって呼吸を共有
        board.fill(0);
        board[I(0, 4)] = 1; board[I(BOARD_SIZE - 1, 4)] = 1;
        board[I(1, 4)] = 2; board[I(0, 3)] = 2; board[I(0, 5)] = 2;
        board[I(BOARD_SIZE - 2, 4)] = 2; board[I(BOARD_SIZE - 1, 3)] = 2; board[I(BOARD_SIZE - 1, 5)] = 2;
        assert('筒越しの連は一緒に取れる', getCapturedStones(board, 1).length === 2);
    `,
};
