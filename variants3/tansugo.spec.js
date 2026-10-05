// TANSUGO — 箪笥碁: 四隅の箪笥区域(3x3)に衣類(石)を4つ以上収めると引出しが完成し得点
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
    file: 'tansugo.html',
    en: 'TANSUGO',
    jp: '箪笥碁',
    prefix: 'tansugo',
    desc: '四隅の3x3は箪笥の引出し。自分の石を4つ以上収めた引出しごとに+7目。',
    kind: 'stone',
    icon: 'tansugo',
    spec: [
        ...K.rb('TANSUGO', '箪笥碁', 'tansugo'),
        K.params([
            { key: 'need', label: '引出し完成に必要な石数', min: 2, max: 9, def: 4, unit: '個' },
            { key: 'bonus', label: '引出しごとの得点', min: 1, max: 15, def: 7, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.8, hint: '交点数比' },
        ]),
        // 箪笥ボーナス: 各隅の3x3に自石4つ以上で+7
        [K.ONE, `        function endGameByScore() {`,
`        function tansuZones() {
            const n = BOARD_SIZE;
            return [[0, 0], [n - 3, 0], [0, n - 3], [n - 3, n - 3]];
        }
        function tansuBonus(player) {
            let bonus = 0;
            tansuZones().forEach(([zx, zy]) => {
                let n = 0;
                for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++)
                    if (board[(zy + dy) * BOARD_SIZE + zx + dx] === player) n++;
                if (n >= (P('need') || 4)) bonus += (P('bonus') || 7);
            });
            return bonus;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + tansuBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + tansuBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>箪笥:</span> <strong>黒 \${tansuBonus(1)} / 白 \${tansuBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 箪笥区域の描画: 四隅に引出しの枠
        K.CUE_STARS(`            // 箪笥区域: 四隅3x3に引出しの枠線と取っ手
            {
                tansuZones().forEach(([zx, zy]) => {
                    const x0 = padding + zx * cellSize - cellSize / 2;
                    const y0 = padding + zy * cellSize - cellSize / 2;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(120,72,20,0.55)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.strokeRect(x0, y0, cellSize * 3, cellSize * 3);
                    ctx.beginPath();
                    ctx.moveTo(x0, y0 + cellSize); ctx.lineTo(x0 + cellSize * 3, y0 + cellSize);
                    ctx.moveTo(x0, y0 + cellSize * 2); ctx.lineTo(x0 + cellSize * 3, y0 + cellSize * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(160,110,50,0.6)';
                    for (let r = 0; r < 3; r++)
                        ctx.fillRect(x0 + cellSize * 1.35, y0 + cellSize * (r + 0.42), cellSize * 0.3, cellSize * 0.14);
                    ctx.restore();
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`'箪笥 黒' + (tansuBonus(1) / (P('bonus') || 7)) + '/白' + (tansuBonus(2) / (P('bonus') || 7)) + '杯'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            箪笥碁: 四隅の3x3は箪笥。自分の石を4つ以上収めた引出しごとに+7目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の四隅3x3は「箪笥の引出し」。終局時、自分の石を4つ以上収めた引出しごとに+7目。',
            '両者が同じ引出しを争う — 入れ違いの収納合戦。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 1));
        assert('4石収納で+7', tansuBonus(1) === 7);
        [[0, 0], [1, 0], [2, 0]].forEach(([x, y]) => { board[(BOARD_SIZE - 1 - y) * BOARD_SIZE + x] = 2; });
        assert('3石では完成しない', tansuBonus(2) === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 2) === true);
    `,
};
