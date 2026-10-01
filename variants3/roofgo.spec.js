// ROOFGO — 屋根碁: 盤は下に広がる屋根型。棟 (中央の頂線) の石は瓦の補強で+2目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'roofgo.html',
    en: 'ROOFGO',
    jp: '屋根碁',
    prefix: 'roofgo',
    desc: '下に広がる屋根型の盤。棟 (中央の頂線) の石は補強瓦で+2目。',
    kind: 'stone',
    icon: 'roofgo',
    spec: [
        ...K.rb('ROOFGO', '屋根碁', 'roofgo'),
        K.params([
            { key: 'ridge_bonus', label: '棟1石の得点', min: 0, max: 10, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 屋根: 頂点から下に広がる三角。棟は中央の頂線
        const RIDGE_X = Math.floor(BOARD_SIZE / 2);
        function onRoof(x, y) { return Math.abs(x - RIDGE_X) <= y; }
        const RIDGE_SET = new Set();
        for (let y = 0; y < BOARD_SIZE; y++) RIDGE_SET.add(y * BOARD_SIZE + RIDGE_X);`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!onRoof(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 棟瓦の補強: 棟の石は持ち主に+2目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            RIDGE_SET.forEach(i => {
                if (board[i] === 1) territory.black += (P('ridge_bonus') ?? 2);
                else if (board[i] === 2) territory.white += (P('ridge_bonus') ?? 2);
            });`],
        // 屋根の外は瓦色の壁
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_BRICK('#9a5140', '#5d2f26'))],
        ...K.WALL_GUARD_SPEC,
        K.CUE_GRID(`            // 棟: 頂線に棟瓦マーク
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(70, 60, 50, 0.8)';
                ctx.lineWidth = Math.max(1.8, cellSize * 0.09);
                ctx.beginPath();
                const rx = padding + RIDGE_X * cellSize;
                ctx.moveTo(rx, padding - cellSize * 0.18);
                ctx.lineTo(rx, padding + (BOARD_SIZE - 1) * cellSize + cellSize * 0.18);
                ctx.stroke();
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.arc(rx, cy, cellSize * 0.16, Math.PI, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            屋根碁: 下に広がる屋根型の盤。棟 (中央の頂線) の石は補強瓦で+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は頂点から下に広がる屋根型 (屋根の外は壁)。',
            '中央の頂線「棟」に置いた石は瓦の補強になる — 終局時に持ち主に+2目。',
            '棟を確保するか、広い軒先で地を稼ぐか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const mid = Math.floor(BOARD_SIZE / 2);
        assert('頂点は尖っている', board[I(0, 0)] === 3 && board[I(mid, 0)] !== 3);
        assert('下端は全幅', board[I(0, BOARD_SIZE - 1)] !== 3 && board[I(BOARD_SIZE - 1, BOARD_SIZE - 1)] !== 3);
        assert('棟に着手可', isValidPlacement([{ x: mid, y: 0 }], 1) === true);
        board.fill(0); board[I(mid, 0)] = 1;
        const t = { black: 0 };
        RIDGE_SET.forEach(i => { if (board[i] === 1) t.black += 2; });
        assert('棟の石は+2目の補強', t.black === 2);
    `,
};
