// ZUIHITSUGO — 随筆碁: 徒然に散った孤石が随筆の章。終局時に孤石1つ+1目
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
    file: 'zuihitsugo.html',
    en: 'ZUIHITSUGO',
    jp: '随筆碁',
    prefix: 'zuihitsugo',
    desc: '徒然の文は孤石。終局時に同色と隣接しない石1つ+1目。',
    kind: 'stone',
    icon: 'zuihitsugo',
    spec: [
        ...K.rb('ZUIHITSUGO', '随筆碁', 'zuihitsugo'),
        // 随筆集計: 同色と隣接しない石 (孤石) は+1目
        [K.ONE, `        function endGameByScore() {`, `        // 随筆: 孤石 (同色の隣接なし) を数える
        function zuihitsuBonus() {
            const b = { 1: 0, 2: 0 };
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                if (!getNeighbors(i).some(n => board[n] === v)) b[v]++;
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 随筆ルール: 孤石は+1目
            {
                const zb = zuihitsuBonus();
                territory.black += zb[1];
                territory.white += zb[2];
            }`],
        // 孤石に筆の点印
        ...K.STONE_MARKS_SPEC(`            // 徒然の章: 孤石に小さな墨点
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    if (getNeighbors(i).some(n => board[n] === v)) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = v === 1 ? 'rgba(253, 224, 71, 0.95)' : 'rgba(87, 83, 78, 0.9)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.09, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'徒然 ' + (() => { const b = typeof zuihitsuBonus === 'function' ? zuihitsuBonus() : { 1: 0, 2: 0 }; return '黒' + b[1] + ' 白' + b[2]; })()`),
        [K.ONE, K.INFO_ALGO, `            随筆碁: 同色と隣接しない石 (孤石) は終局時+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '徒然なるままに散らばった石が随筆の章 — 同色と隣接しない石は終局時+1目。',
            '連を組めば強いが章にならない。散らすか纏めるか、筆の捌きどころ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0;
        board[I(3, 3)] = 1; // 孤石
        assert('孤石は+1目', zuihitsuBonus()[1] === 1);
        board[I(4, 3)] = 1; // 同色が隣接
        assert('繋がれば章にならない', zuihitsuBonus()[1] === 0);
        board[I(4, 3)] = 2; // 敵色の隣接は孤石のまま
        assert('敵色の隣接は章を消さない', zuihitsuBonus()[1] === 1);
        assert('通常着手は合法', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
