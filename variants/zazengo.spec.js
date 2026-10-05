// ZAZENGO — 座禅碁: 中央の座禅区域で敵に接されず静置した石は心が安定し+3目
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
    file: 'zazengo.html',
    en: 'ZAZENGO',
    jp: '座禅碁',
    prefix: 'zazengo',
    desc: '中央5x5の座禅区域。敵に隣接されず静かに坐った石は心が安定して+3目。',
    kind: 'stone',
    icon: 'zazengo',
    spec: [
        ...K.rb('ZAZENGO', '座禅碁', 'zazengo'),
        K.params([
            { key: 'zone_rad', label: '座禅区域の半径', min: 1, max: 4, def: 2, hint: '中央からの距離 (2=5x5)' },
            { key: 'zen_pts', label: '坐り切った石の点', min: 0, max: 9, def: 3, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        // 座禅ボーナス: 座禅区域内で敵に隣接しない自石ごとに+3
        [K.ONE, `        function endGameByScore() {`,
`        function zazenCells() {
            const c = Math.floor(BOARD_SIZE / 2);
            const zr = P('zone_rad') || 2;
            const cells = [];
            for (let dy = -zr; dy <= zr; dy++) for (let dx = -zr; dx <= zr; dx++)
                cells.push((c + dy) * BOARD_SIZE + c + dx);
            return cells;
        }
        function zazenBonus(player) {
            return zazenCells().filter(i =>
                board[i] === player && !getNeighbors(i).some(n => board[n] === (3 - player))
            ).length * (P('zen_pts') ?? 3);
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + zazenBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + zazenBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>座禅:</span> <strong>黒 \${zazenBonus(1)} / 白 \${zazenBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 座禅区域の描画: 中央5x5に薄い座布団色
        K.CUE_STARS(`            // 座禅区域: 中央5x5に座布団の淡い円相
            {
                const c0 = Math.floor(BOARD_SIZE / 2);
                const zr = P('zone_rad') || 2;
                const zx = padding + (c0 - zr) * cellSize - cellSize / 2;
                const zy = padding + (c0 - zr) * cellSize - cellSize / 2;
                const zs = cellSize * (zr * 2 + 1);
                ctx.save();
                ctx.fillStyle = 'rgba(140,120,80,0.10)';
                ctx.fillRect(zx, zy, zs, zs);
                ctx.strokeStyle = 'rgba(120,100,60,0.5)';
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                ctx.setLineDash([cellSize * 0.3, cellSize * 0.18]);
                ctx.strokeRect(zx, zy, zs, zs);
                ctx.setLineDash([]);
                // 円相
                ctx.strokeStyle = 'rgba(100,85,50,0.55)';
                ctx.beginPath();
                ctx.arc(padding + c0 * cellSize, padding + c0 * cellSize, cellSize * 0.32,
                    Math.PI * 0.15, Math.PI * 1.75);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'坐禅 黒' + (zazenBonus(1) / Math.max(1, P('zen_pts') ?? 3)) + '/白' + (zazenBonus(2) / Math.max(1, P('zen_pts') ?? 3))`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            座禅碁: 中央5x5の座禅区域で敵に接されない石は心が安定して終局時+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '中央5x5は「座禅区域」。終局時、区域内で敵石に隣接していない自分の石は坐り切った証として+3目。',
            '敵に触れられた石は心が乱れる — 接点を増やすか、離れて坐り切るか。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const c = Math.floor(BOARD_SIZE / 2);
        board[c * BOARD_SIZE + c] = 1;             // 中央 — 敵なしで+3
        board[(c - 1) * BOARD_SIZE + c] = 1;       // 接された石
        board[(c - 1) * BOARD_SIZE + c + 1] = 2;   // その敵
        assert('坐り切った石のみ+3', zazenBonus(1) === 3);
        board[(c + 2) * BOARD_SIZE + c] = 2;       // 白の静置石
        assert('白も対称に+3', zazenBonus(2) === 3);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
