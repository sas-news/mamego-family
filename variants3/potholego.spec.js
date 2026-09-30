// POTHOLEGO — 甌穴碁: 盤に深い甌穴がある。隣の石が落ち込み、落ちた石は二度と抜け出せない
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
    file: 'potholego.html',
    en: 'POTHOLEGO',
    jp: '甌穴碁',
    prefix: 'potholego',
    desc: '深い甌穴が盤に点在。隣に立つと落ち込み、落ちた石は不動の障害物になる。',
    kind: 'stone',
    icon: 'potholego',
    spec: [
        ...K.rb('POTHOLEGO', '甌穴碁', 'potholego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 甌穴: 盤に点在する5つの深い穴。空いている穴に隣接する石は落ち込む
        const HOLE_SET = new Set();
        {
            const m = Math.floor(BOARD_SIZE / 2);
            const a = Math.max(2, Math.round(BOARD_SIZE * 0.30));
            [[m, 1], [1, m], [BOARD_SIZE - 2, m], [m, BOARD_SIZE - 2], [m, m]]
                .forEach(([x, y]) => HOLE_SET.add(y * BOARD_SIZE + x));
        }`],
        // 穴に落ちた石は取られず連にも加わらない (捕獲走査から除外)
        [K.ONE, `                if (boardState[i] === player && !visited[i]) {`,
`                if (boardState[i] === player && !visited[i] && !HOLE_SET.has(i)) {`],
        [K.ALL, `} else if (boardState[n] === player && !visited[n]) {`,
`} else if (boardState[n] === player && !visited[n] && !HOLE_SET.has(n)) {`],
        // 毎手、空いている穴に隣接した石が落ち込む (先に見つかった1個だけ)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 甌穴: 空いている穴の隣の石が落ち込む — 落ちた石は不動
            HOLE_SET.forEach(h => {
                if (board[h] !== 0) return;
                const nbs = getNeighbors(h).filter(n => board[n] === 1 || board[n] === 2);
                if (!nbs.length) return;
                const v = board[nbs[0]];
                board[nbs[0]] = 0;
                board[h] = v;
                pieces.forEach(pc => pc.cells.forEach(q => {
                    if (q.y * BOARD_SIZE + q.x === nbs[0]) { q.x = h % BOARD_SIZE; q.y = (h / BOARD_SIZE) | 0; }
                }));
                fxSlide(nbs[0], h, 380);
                fxText(h, '落下!', '#92400e', 900);
                cleanUpPieces();
            });

            turn = opponent;`],
        // 甌穴の描画: 深い暗い穴
        K.CUE_GRID(`            // 甌穴: 底の見えない暗い穴
            {
                ctx.save();
                HOLE_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.5);
                    g.addColorStop(0, 'rgba(10, 8, 6, 0.95)');
                    g.addColorStop(0.7, 'rgba(40, 32, 24, 0.75)');
                    g.addColorStop(1, 'rgba(80, 64, 46, 0.25)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.46, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(60, 48, 34, 0.9)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.46, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            甌穴碁: 深い穴が盤に点在。隣の石が落ち込み、落ちた石は抜け出せない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤に5つの深い甌穴が空いている。空いている穴の隣にいる石は落ち込む (毎手1個)。',
            '穴に落ちた石は二度と抜け出せない — 取れないが連にも加わらない不動の障害物。',
            '穴を敵の追い落としに使うか、自分が落ちないよう距離を取るか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('甌穴が5つある', HOLE_SET.size === 5);
        const h = [...HOLE_SET][0];
        const hx = h % BOARD_SIZE, hy = (h / BOARD_SIZE) | 0;
        assert('穴自体にも着手できる', isValidPlacement([{ x: hx, y: hy }], 1) === true);
        // 隣の石が穴に落ちる
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const nb = getNeighbors(h).find(n => !HOLE_SET.has(n));
        board[nb] = 1;
        executeMove({ cells: [{ x: 0, y: BOARD_SIZE - 1 }] }, 2);
        assert('隣の石は穴に落ちる', board[h] === 1 && board[nb] === 0);
        // 落ちた石は取られない
        getNeighbors(h).forEach(n => { if (board[n] !== 1) board[n] = 2; });
        assert('穴の石は不動', !getCapturedStones(board, 1).includes(h));
    `,
};
