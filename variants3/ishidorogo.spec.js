// ISHIDOROGO — 灯籠碁: 星点の庭灯籠に火(石)を入れると夜の庭が照らされ得点になる
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
    file: 'ishidorogo.html',
    en: 'ISHIDOROGO',
    jp: '灯籠碁',
    prefix: 'ishidorogo',
    desc: '星点は庭灯籠。灯籠に火(石)を入れると夜の庭が照らされ、1基ごとに+6目。',
    kind: 'stone',
    icon: 'ishidorogo',
    spec: [
        ...K.rb('ISHIDOROGO', '灯籠碁', 'ishidorogo'),
        // 灯籠ボーナス: 星点(天元を除く)に自石があれば1基+6
        [K.ONE, `        function endGameByScore() {`,
`        function lanternIdxs() {
            const c = Math.floor(BOARD_SIZE / 2);
            return getStarPoints(BOARD_SIZE)
                .filter(p => !(p.x === c && p.y === c))
                .map(p => p.y * BOARD_SIZE + p.x);
        }
        function lanternBonus(player) {
            return lanternIdxs().filter(i => board[i] === player).length * 6;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + lanternBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + lanternBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>灯籠:</span> <strong>黒 \${lanternBonus(1)} / 白 \${lanternBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 灯籠の描画: 星点に石灯籠。点灯(占有)なら炎が灯る
        K.CUE_STARS(`            // 灯籠: 星点に小さな石灯籠、火入れ済みなら炎
            {
                lanternIdxs().forEach(i => {
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.save();
                    ctx.fillStyle = 'rgba(110,105,95,0.55)';
                    ctx.fillRect(cx - cellSize * 0.15, cy - cellSize * 0.30, cellSize * 0.30, cellSize * 0.44);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.26, cy - cellSize * 0.30);
                    ctx.lineTo(cx + cellSize * 0.26, cy - cellSize * 0.30);
                    ctx.lineTo(cx, cy - cellSize * 0.42);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillRect(cx - cellSize * 0.09, cy + cellSize * 0.14, cellSize * 0.18, cellSize * 0.14);
                    if (board[i] !== 0) {
                        ctx.fillStyle = '#fbbf24';
                        ctx.beginPath();
                        ctx.arc(cx, cy - cellSize * 0.06, cellSize * 0.08, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                });
            }`),
        // 夜の庭: 灯りがともるほど盤がほのかに明るく (雰囲気の薄い灯り)
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 灯籠の灯り: 占有灯籠の周りに柔らかい光
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            lanternIdxs().forEach(i => {
                if (board[i] === 0) return;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                const cx = pad + x * cs, cy = pad + y * cs;
                const g = ctx2.createRadialGradient(cx, cy, cs * 0.1, cx, cy, cs * 2.1);
                const a = 0.10 + Math.sin(now / 700 + i) * 0.03;
                g.addColorStop(0, 'rgba(251,191,36,' + a + ')');
                g.addColorStop(1, 'rgba(251,191,36,0)');
                ctx2.fillStyle = g;
                ctx2.beginPath(); ctx2.arc(cx, cy, cs * 2.1, 0, Math.PI * 2); ctx2.fill();
            });
            ctx2.restore();
        });`],
        ...K.EVENT_CHIP_SPEC(`'灯籠 黒' + (lanternBonus(1) / 6) + '/白' + (lanternBonus(2) / 6)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            灯籠碁: 星点は庭灯籠。灯籠に火(石)を入れると夜の庭が照らされ1基+6目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '天元以外の星点は「石灯籠」。そこに石を置くと灯籠に火が入り、終局時に1基ごと+6目。',
            '灯りは取られれば消える — 灯籠を守る形を作るか、終盤に一気に点火するか。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const ls = lanternIdxs();
        assert('灯籠は4基', ls.length === 4);
        const p0 = { x: ls[0] % BOARD_SIZE, y: Math.floor(ls[0] / BOARD_SIZE) };
        executeMove({ cells: [p0] }, 1);
        assert('灯籠に火を入れた', board[ls[0]] === 1);
        assert('灯籠ボーナス+6', lanternBonus(1) === 6 && lanternBonus(2) === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
