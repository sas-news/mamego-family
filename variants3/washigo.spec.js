// WASHIGO — 和紙碁: 石は和紙。水辺に近い石は濡れて、やがて破れて消える
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
    file: 'washigo.html',
    en: 'WASHIGO',
    jp: '和紙碁',
    prefix: 'washigo',
    desc: '和紙の石は水路に入ると濡れ、8手ごとの雨で破れて消える。',
    kind: 'stone',
    icon: 'washigo',
    spec: [
        ...K.rb('WASHIGO', '和紙碁', 'washigo'),
        K.params([
            { key: 'rain_interval', label: '雨の間隔', min: 2, max: 20, def: 8, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 水路: 中央の用水路1行。その上の石は濡れて破れやすい
        const WASHI_Y = Math.floor(BOARD_SIZE / 2);
        function isWashiWater(x, y) { return y === WASHI_Y; }
        // 水路の上の石だけが濡れる (隣は濡れない — 一掃を防ぐ)
        function washiWet(i) {
            const y = (i / BOARD_SIZE) | 0;
            return isWashiWater(i % BOARD_SIZE, y);
        }`],
        // 8手ごとの雨: 濡れた石は破れて消える (アゲハマにはならない)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 和紙碁: N手ごとに雨が降り、水路の濡れた石が破れて消える
            if (history.length > 0 && history.length % (P('rain_interval') || 8) === 0) {
                const torn = [];
                for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                    if ((board[i] === 1 || board[i] === 2) && washiWet(i)) torn.push(i);
                }
                if (torn.length) {
                    torn.forEach(i => { board[i] = 0; fxBurst(i, '#93c5fd', 8, 1.2); fxText(i, '破れ', '#60a5fa', 800); });
                    fxShake(5, 260);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 用水路と濡れた石の描画
        K.CUE_GRID(`            // 用水路: 中央の水路
            {
                ctx.save();
                const cy = padding + WASHI_Y * cellSize;
                ctx.fillStyle = 'rgba(56, 130, 200, 0.30)';
                ctx.fillRect(padding - cellSize * 0.5, cy - cellSize * 0.5, cellSize * BOARD_SIZE, cellSize);
                ctx.strokeStyle = 'rgba(150, 210, 255, 0.55)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.setLineDash([cellSize * 0.25, cellSize * 0.2]);
                ctx.beginPath();
                ctx.moveTo(padding - cellSize * 0.5, cy);
                ctx.lineTo(padding + cellSize * (BOARD_SIZE - 0.5), cy);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        ...K.STONE_MARKS_SPEC(`            // 濡れた和紙の石: 滲んだ墨の暈し
            for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                if ((board[i] === 1 || board[i] === 2) && washiWet(i)) {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(120, 170, 230, 0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`'雨まで ' + ((P('rain_interval') || 8) - history.length % (P('rain_interval') || 8)) + '手'`),
        [K.ONE, K.INFO_ALGO, `            和紙碁: 水路の石は濡れ、8手ごとの雨で破れて消える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '中央に用水路が走る。水路の上の石は濡れる (青い滲みが目印)。',
            '8手ごとに雨が降り、濡れた石は全て破れて消える — アゲハマにはならない。',
            '水路は一時の足場。雨が来る前に取るか捨てるか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const m = WASHI_Y;
        assert('水路に着手できる', isValidPlacement([{ x: m, y: m }], 1) === true);
        assert('水路の石は濡れる', washiWet(I(m, m)) && !washiWet(I(m, m - 1)) && !washiWet(I(m, 0)));
        // 雨で濡れた石が破れる
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[I(m, m)] = 1; board[I(0, 0)] = 2;
        for (let k = 0; k < 8; k++) executeMove({ cells: [{ x: k % BOARD_SIZE, y: BOARD_SIZE - 1 }] }, 1);
        assert('濡れた石は雨で破れる', board[I(m, m)] === 0);
        assert('乾いた石は残る', board[I(0, 0)] === 2);
    `,
};
