// TAKUHATSUGO — 托鉢碁: 味方と離れて独りで巡る石は托鉢僧 — 終局時1個につき+1目の徳
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
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'takuhatsugo.html',
    en: 'TAKUHATSUGO',
    jp: '托鉢碁',
    prefix: 'takuhatsugo',
    desc: '味方の石に隣接しない孤高の石は托鉢僧 — 終局時1個につき+1目の徳を積む。',
    kind: 'stone',
    icon: 'takuhatsugo',
    spec: [
        ...K.rb('TAKUHATSUGO', '托鉢碁', 'takuhatsugo'),
        K.params([
            { key: 'bonus', label: '托鉢の徳', min: 0, max: 5, def: 1, unit: '目', hint: '孤高の石1個あたり' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.8, hint: '交点数比' },
        ]),
        [K.ONE, `        function endGameByScore() {`,
`        // 托鉢: 味方に隣接しない石は独りで施しを受ける — 1個+1目
        function takuhatsuBonus(player) {
            let b = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player) continue;
                if (!getNeighbors(i).some(n => board[n] === player)) b += (P('bonus') ?? 1);
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + takuhatsuBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + takuhatsuBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>托鉢の徳:</span> <strong>黒 \${takuhatsuBonus(1)} / 白 \${takuhatsuBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...K.STONE_MARKS_SPEC(`            // 托鉢僧: 孤高の石に托鉢鉢の印
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    if (getNeighbors(i).some(n => board[n] === board[i])) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = 'rgba(217,119,6,0.9)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.16, 0, Math.PI);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            托鉢碁: 味方の石に隣接しない石は托鉢僧 — 終局時1個につき+1目の徳<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '托鉢: 終局時、味方の石に1つも隣接しない自石は独りで施しを受ける托鉢僧として+1目。',
            '孤石を残すか連にまとめるかの駆け引き。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 4] = 1;
        assert('独りの石は托鉢僧+1', takuhatsuBonus(1) === 1);
        board[4 * BOARD_SIZE + 5] = 1; // 味方が隣に来る
        assert('味方があれば徳は0', takuhatsuBonus(1) === 0);
        board[9 * BOARD_SIZE + 9] = 2;
        assert('白の独りも+1', takuhatsuBonus(2) === 1);
    `,
};
