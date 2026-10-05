// CHABAKOGO — 茶箱碁: 中央の茶箱区域に道具(石)を5つ詰めると野点へ出発して即勝ち
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
    file: 'chabakogo.html',
    en: 'CHABAKOGO',
    jp: '茶箱碁',
    prefix: 'chabakogo',
    desc: '中央3x3の茶箱に道具(石)を5つ詰め込めば野点出発で即勝ち。詰めた石は+1目。',
    kind: 'stone',
    icon: 'chabakogo',
    spec: [
        ...K.rb('CHABAKOGO', '茶箱碁', 'chabakogo'),
        K.params([
            { key: 'chabako_need', label: '野点出発に必要な数', min: 3, max: 9, def: 5, unit: '個' },
            { key: 'chabako_pts', label: '箱の中の石の得点', min: 0, max: 3, def: 1, unit: '目/個' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 茶箱区域: 中央3x3
        function chabakoCells() {
            const c = Math.floor(BOARD_SIZE / 2);
            const cells = [];
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
                cells.push((c + dy) * BOARD_SIZE + c + dx);
            return cells;
        }
        function chabakoCount(player) {
            return chabakoCells().filter(i => board[i] === player).length;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + chabakoCount(1) * (P('chabako_pts') ?? 1);
            const whiteTotal = territory.white + captures[2] + komi + chabakoCount(2) * (P('chabako_pts') ?? 1);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>茶箱:</span> <strong>黒 \${chabakoCount(1)} / 白 \${chabakoCount(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 野点出発判定: 箱に5つ詰めた側が即勝ち
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 茶箱ルール: 茶箱区域に自石が規定数 → 荷造り完了で野点出発 (即勝ち)
            if (chabakoCount(player) >= (P('chabako_need') || 5)) {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxGlow(mi, '#f59e0b', 950);
                fxText(mi, '野点出発!', '#d97706', 1400);
                fxShake(5, 360);
                winByRule(player, '野点出発', '茶箱に道具を5つ詰めて野点へ旅立ちました'); return;
            }

            turn = opponent;`],
        // 茶箱区域の描画
        K.CUE_STARS(`            // 茶箱区域: 中央3x3に葛籠の枠と取っ手
            {
                const c0 = Math.floor(BOARD_SIZE / 2);
                const zx = padding + (c0 - 1) * cellSize - cellSize / 2;
                const zy = padding + (c0 - 1) * cellSize - cellSize / 2;
                ctx.save();
                ctx.fillStyle = 'rgba(160,110,50,0.14)';
                ctx.fillRect(zx, zy, cellSize * 3, cellSize * 3);
                ctx.strokeStyle = 'rgba(120,72,20,0.7)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.strokeRect(zx, zy, cellSize * 3, cellSize * 3);
                ctx.beginPath();
                ctx.arc(padding + c0 * cellSize, zy, cellSize * 0.5, Math.PI, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'茶箱 黒' + chabakoCount(1) + '/白' + chabakoCount(2) + ' (' + (P('chabako_need') || 5) + 'で野点)'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            茶箱碁: 中央3x3の茶箱に道具(石)を5つ詰めれば野点出発で即勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '中央3x3は「茶箱」。自分の石(道具)を5つ詰め込んだ側が、荷造り完了で野点へ出発し即勝ち。',
            '野点に届かなくても、終局時に箱の中の石は1つ+1目。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const c = Math.floor(BOARD_SIZE / 2);
        [[-1, -1], [0, -1], [1, -1], [-1, 0]].forEach(([dx, dy]) =>
            executeMove({ cells: [{ x: c + dx, y: c + dy }] }, 1));
        assert('4つではまだ続行', gameOver === false && chabakoCount(1) === 4);
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('5つ詰めで野点出発', gameOver === true);
        assert('結果に野点', !!gameResultData && gameResultData.title.indexOf('野点') >= 0);
    `,
};
