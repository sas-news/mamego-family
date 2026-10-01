// DUNGO — 地下碁: 4つの潜行点に打った石は地下に潜り、以後取られない・連にもならない
const K = require('../gen_kit.js');
module.exports = {
    file: 'dungo.html',
    en: 'DUNGO',
    jp: '地下碁',
    prefix: 'dungo',
    desc: '4つの潜行点 (◎) に打った石は地下に潜って取られない・連にもならない。',
    kind: 'stone',
    icon: 'dungo',
    spec: [
        ...K.rb('DUNGO', '地下碁', 'dungo'),
        K.params([
            { key: 'burrow_f', label: '潜行点の位置', min: 1, max: 4, def: 1, hint: '隅からの距離' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 90, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 潜行点: 4隅の (f,f) 位置。ここに打った石は地下に潜って不滅になる
        let BURROW_F = Math.max(1, P('burrow_f') || Math.floor(BOARD_SIZE / 6));
        let BURROW_CELLS = new Set();
        function rebuildBurrow() {
            BURROW_F = Math.max(1, P('burrow_f') || Math.floor(BOARD_SIZE / 6));
            BURROW_CELLS = new Set([
                BURROW_F * BOARD_SIZE + BURROW_F,
                BURROW_F * BOARD_SIZE + (BOARD_SIZE - 1 - BURROW_F),
                (BOARD_SIZE - 1 - BURROW_F) * BOARD_SIZE + BURROW_F,
                (BOARD_SIZE - 1 - BURROW_F) * BOARD_SIZE + (BOARD_SIZE - 1 - BURROW_F),
            ]);
        }
        rebuildBurrow();
        function isBurrowCell(i) { return BURROW_CELLS.has(i); }
        // 設定変更で潜行点を即時再構成
        function onVariantParam(p) {
            if (p.key === 'burrow_f') rebuildBurrow();
        }`],
        // 潜行石は取られず連にもならない
        [K.ONE, `            if (boardState[i] === player && !visited[i]) {`,
`            if (boardState[i] === player && !visited[i] && !isBurrowCell(i)) {`],
        [K.ALL, `                        } else if (boardState[n] === player && !visited[n]) {`,
`                        } else if (boardState[n] === player && !visited[n] && !isBurrowCell(n)) {`],
        // 潜行点の描画: 穴のリング + 潜行石の半影
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                BURROW_CELLS.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(41,37,36,0.85)';
                    ctx.lineWidth = Math.max(2, cellSize * 0.08);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.26, 0, Math.PI * 2);
                    ctx.stroke();
                    if (board[i] === 0) {
                        ctx.fillStyle = 'rgba(41,37,36,0.30)';
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.18, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        // 潜行中: 石の周りに地下の影
                        ctx.fillStyle = 'rgba(41,37,36,0.35)';
                        ctx.beginPath();
                        ctx.arc(cx, cy + cellSize * 0.10, cellSize * 0.30, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            地下碁: 4つの潜行点 (◎) に打った石は地下に潜り、以後取られない・連にもならない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '4隅の潜行点 (◎) に打った石は地下に潜り、以後取られず呼吸も連結もしない。',
            '潜行石は不滅の楔。囲まれても死なないが、味方の呼吸の助けにもならない。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 90) / 100))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const bi = I(BURROW_F, BURROW_F);
        board.fill(0); pieces = [];
        assert('潜行点は存在する', BURROW_CELLS.has(bi) && BURROW_CELLS.size === 4);
        executeMove({ cells: [{ x: BURROW_F, y: BURROW_F }] }, 1);
        assert('潜行点に打てた', board[bi] === 1);
        board[bi - 1] = 2; board[bi + 1] = 2; board[bi - BOARD_SIZE] = 2; board[bi + BOARD_SIZE] = 2;
        assert('潜行石は取られない', getCapturedStones(board, 1).length === 0);
        assert('潜行石は連に合流しない', getCapturedStones(board, 1).every(i => i !== bi));
        assert('潜行点でもない場所は普通', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
