// TOKOGO — 床飾碁: 上下辺の床の間(1x3)に軸と花(石)を飾る。2つ以上飾った床の間ごとに+6目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tokogo.html',
    en: 'TOKOGO',
    jp: '床飾碁',
    prefix: 'tokogo',
    desc: '上下辺の床の間(1x3)に軸と花=石を飾る。2石以上飾った床の間ごとに+6目。',
    kind: 'stone',
    icon: 'tokogo',
    spec: [
        ...K.rb('TOKOGO', '床飾碁', 'tokogo'),
        // 床の間ボーナス: 上下辺中央の1x3に自石2つ以上で+6
        [K.ONE, `        function endGameByScore() {`,
`        function tokoZones() {
            const c = Math.floor(BOARD_SIZE / 2);
            return [[c - 1, 0], [c - 1, BOARD_SIZE - 1]]; // 各ゾーンの左上 (幅3 x 高さ1)
        }
        function tokoBonus(player) {
            let bonus = 0;
            tokoZones().forEach(([zx, zy]) => {
                let n = 0;
                for (let dx = 0; dx < 3; dx++)
                    if (board[zy * BOARD_SIZE + zx + dx] === player) n++;
                if (n >= 2) bonus += 6;
            });
            return bonus;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + tokoBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + tokoBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>床の間:</span> <strong>黒 \${tokoBonus(1)} / 白 \${tokoBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 床の間の描画: 上下辺に掛け軸と生け花
        K.CUE_GRID(`            // 床の間: 上下辺中央の薄い床枠
            {
                const c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                [[c - 1, 0], [c - 1, BOARD_SIZE - 1]].forEach(([zx, zy]) => {
                    const x0 = padding + zx * cellSize - cellSize / 2;
                    const y0 = padding + zy * cellSize - cellSize / 2;
                    ctx.fillStyle = 'rgba(150,110,70,0.15)';
                    ctx.fillRect(x0, y0, cellSize * 3, cellSize);
                    ctx.strokeStyle = 'rgba(120,80,40,0.6)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.strokeRect(x0, y0, cellSize * 3, cellSize);
                    // 掛け軸
                    ctx.strokeStyle = 'rgba(80,60,40,0.5)';
                    ctx.beginPath();
                    ctx.moveTo(x0 + cellSize * 1.5, y0 + cellSize * 0.1);
                    ctx.lineTo(x0 + cellSize * 1.5, y0 + cellSize * 0.9);
                    ctx.stroke();
                    // 生け花
                    ctx.fillStyle = 'rgba(190,60,80,0.55)';
                    ctx.beginPath();
                    ctx.arc(x0 + cellSize * 2.4, y0 + cellSize * 0.5, cellSize * 0.14, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'床飾 黒' + (tokoBonus(1) / 6) + '/白' + (tokoBonus(2) / 6)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            床飾碁: 上下辺の床の間(1x3)に石を飾る。2石以上飾った床の間ごとに+6目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '上下辺の中央1x3は「床の間」。終局時、自分の石を2つ以上飾った床の間ごとに+6目。',
            '辺の中央は取られやすい飾り所 — 守り切って飾りきるか、相手の床を荒らすか。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c - 1, y: 0 }] }, 1);
        assert('1石では飾らない', tokoBonus(1) === 0);
        executeMove({ cells: [{ x: c + 1, y: 0 }] }, 1);
        assert('2石で床の間完成+6', tokoBonus(1) === 6);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
