// STAIRSGO — 階段碁: 盤は右に向かって高くなる階段状。石は列の最下段まで落下する
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
    file: 'stairsgo.html',
    en: 'STAIRSGO',
    jp: '階段碁',
    prefix: 'stairsgo',
    desc: '階段状の盤。石は柱を落ちるように転がり、各列の踏み面に着地する。',
    kind: 'stone',
    icon: 'stairsgo',
    spec: [
        ...K.rb('STAIRSGO', '階段碁', 'stairsgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 階段: 列ごとの踏み面の高さ (これより上は盤外の壁)
        function stairTop(x) { return Math.max(0, Math.floor((BOARD_SIZE - 1 - x) / 2)); }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (y < stairTop(x)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 着手点は「どの列か」だけを意味する — 石はその列の最下段の空点に着地
        [K.ONE, K.VALID_BOUNDS, `            {
                const p0 = cells[0];
                if (p0.x < 0 || p0.x >= BOARD_SIZE || p0.y < 0 || p0.y >= BOARD_SIZE) return false;
                // 階段重力: クリック位置によらず列の最下段の空点が着地点になる
                let ly = stairTop(p0.x);
                while (ly + 1 <= BOARD_SIZE - 1 && board[(ly + 1) * BOARD_SIZE + p0.x] === 0) ly++;
                if (board[ly * BOARD_SIZE + p0.x] !== 0) return false;
                cells = [{ x: p0.x, y: ly }];
            }`],
        // 実行時も同じ落下解決を行い、スライド演出を出す
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            {
                const src = move.cells[0];
                let ly = stairTop(src.x);
                while (ly + 1 <= BOARD_SIZE - 1 && board[(ly + 1) * BOARD_SIZE + src.x] === 0) ly++;
                if (ly !== src.y) fxSlide(src.y * BOARD_SIZE + src.x, ly * BOARD_SIZE + src.x, 380);
                move.cells = [{ x: src.x, y: ly }];
            }
            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`],
        // 階段の壁は岩肌
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_ROCK('#7d6a55', '#3f332a'))],
        ...K.WALL_GUARD_SPEC,
        // 踏み面の縁線 (各列の最上段に白い縁)
        K.CUE_GRID(`            // 階段: 各踏み面の前縁を引く
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.75);
                ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                ctx.beginPath();
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const t = stairTop(x);
                    if (t <= 0) continue;
                    const cy = padding + t * cellSize;
                    ctx.moveTo(padding + (x - 0.5) * cellSize, cy - cellSize * 0.5);
                    ctx.lineTo(padding + (x - 0.5) * cellSize, cy + cellSize * 0.5);
                }
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            階段碁: 石は柱を伝って各列の最下段に落ちる (どこを打っても同じ着地点)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は右に向かって高くなる階段。各列の踏み面の上は盤外 (壁) になる。',
            '列を選んで打つと、石はその列の最下段の空点まで落下して着地する。',
            '打ち込む列だけが大事 — 低い段から順に積み上がっていく。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('列0の上段は壁', board[I(0, 0)] === 3);
        assert('最右列は全段使える', board[I(BOARD_SIZE - 1, 0)] !== 3);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 列0の壁に打っても…
        assert('列0の最下段に着地', board[I(0, BOARD_SIZE - 1)] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('2個目はその上に積まる', board[I(0, BOARD_SIZE - 2)] === 2);
        assert('通常着手の合法性', isValidPlacement([{ x: BOARD_SIZE - 1, y: 0 }], 1) === true);
    `,
};
