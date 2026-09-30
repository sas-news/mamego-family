// WATAGO — 綿石碁: 石はふわふわの綿。取っても潰れて半分しかアゲハマにならない
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
    file: 'watago.html',
    en: 'WATAGO',
    jp: '綿石碁',
    prefix: 'watago',
    desc: '石は綿。取られた連は潰れて半分しかアゲハマにならない (切り上げ)。',
    kind: 'stone',
    icon: 'watago',
    spec: [
        ...K.rb('WATAGO', '綿石碁', 'watago'),
        // 綿は潰れる: 取った連は半分しかアゲハマにならない (切り上げ・双方同じ)
        [K.ONE, `            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;`,
`            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += Math.ceil(captured.length / 2); // 綿は潰れて半分のアゲハマ
                fxText(captured[captured.length - 1], 'ふわっ', '#fbcfe8', 700);`],
        // 綿のふわふわハロー
        ...K.STONE_MARKS_SPEC(`            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const v = board[y * BOARD_SIZE + x];
                if (v !== 1 && v !== 2) continue;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = v === 1 ? 'rgba(255,255,255,0.30)' : 'rgba(120,90,60,0.28)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                for (let k = 0; k < 8; k++) {
                    const a = k * Math.PI / 4 + (x * 7 + y * 13) % 10 / 10;
                    ctx.beginPath();
                    ctx.arc(cx + Math.cos(a) * cellSize * 0.36, cy + Math.sin(a) * cellSize * 0.36, cellSize * 0.13, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            綿石碁: 石は綿。取った連は潰れて半分しかアゲハマにならない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石はふわふわの綿。呼吸・取り・コウのルールは通常通り。',
            '取った連は潰れて半分しかアゲハマにならない (切り上げ)。',
            '小さい連を潰すより、大きな塊を取るほうが効率がいい。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        // 2連を取るとアゲハマ1個 (綿で半分に潰れる)
        board[I(4, 4)] = 2; board[I(5, 4)] = 2;
        board[I(4, 3)] = 1; board[I(5, 3)] = 1; board[I(3, 4)] = 1;
        board[I(6, 4)] = 1; board[I(4, 5)] = 1;
        const before = captures[1];
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('綿の連は半分のアゲハマ', captures[1] === before + 1);
        assert('連は盤から消える', board[I(4, 4)] === 0 && board[I(5, 4)] === 0);
        board.fill(0); pieces = []; history.length = 0; captures[1] = 0;
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
