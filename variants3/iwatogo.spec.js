// IWATOGO — 天岩戸碁: 盤中央の太陽を自石で隠すと盤は闇に包まれる — 終局時、太陽を占める側+4目
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
    file: 'iwatogo.html',
    en: 'IWATOGO',
    jp: '天岩戸碁',
    prefix: 'iwatogo',
    desc: '盤中央の太陽。自石で隠せば盤は闇に包まれ、終局時に占める側は+4目の御光を得る。',
    kind: 'stone',
    icon: 'iwatogo',
    spec: [
        ...K.rb('IWATOGO', '天岩戸碁', 'iwatogo'),
        // 太陽: 盤中央の天元に輝く日輪
        K.CUE_STARS(`            // 天岩戸の太陽: 盤中央に日輪を描く (石が隠せば光は失せる)
            {
                const ci = ((BOARD_SIZE - 1) / 2) * (BOARD_SIZE + 1);
                if (board[ci] === 0) {
                    const cx = padding + (BOARD_SIZE - 1) / 2 * cellSize;
                    const cy = cx;
                    ctx.save();
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.5);
                    g.addColorStop(0, 'rgba(253,224,71,0.95)');
                    g.addColorStop(0.5, 'rgba(251,146,60,0.55)');
                    g.addColorStop(1, 'rgba(251,146,60,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }`),
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 天岩戸: 太陽が隠れると盤全体が薄暗くなる
        fxAmbient((ctx2, now, pad, cs) => {
            const ci = ((BOARD_SIZE - 1) / 2) * (BOARD_SIZE + 1);
            if (board[ci] === 0) return; // 太陽が出ていれば明るい
            ctx2.save();
            ctx2.fillStyle = 'rgba(15,23,42,0.30)';
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.fillRect(0, 0, w, w);
            ctx2.restore();
        });`],
        [K.ONE, `        function endGameByScore() {`,
`        // 天岩戸: 終局時に盤中央の太陽を占める側は+4目の御光
        function iwatoBonus(player) {
            const ci = ((BOARD_SIZE - 1) / 2) * (BOARD_SIZE + 1);
            return board[ci] === player ? 4 : 0;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + iwatoBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + iwatoBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>天岩戸の御光:</span> <strong>黒 \${iwatoBonus(1)} / 白 \${iwatoBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            天岩戸碁: 盤中央の太陽を自石で隠すと盤は闇に包まれる — 終局時に占める側+4目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '天岩戸: 盤中央 (天元) に光る太陽。終局時にその点を自石で占める側は+4目の御光を得る。',
            '太陽が隠れると盤は薄暗くなる。中央の取り合いが勝敗を分ける。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const ci = ((BOARD_SIZE - 1) / 2) * (BOARD_SIZE + 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('太陽が出ていれば御光なし', iwatoBonus(1) === 0 && iwatoBonus(2) === 0);
        board[ci] = 1; // 黒が太陽を隠す
        assert('黒が太陽を占めれば+4', iwatoBonus(1) === 4);
        assert('白は闇のまま', iwatoBonus(2) === 0);
        board[ci] = 2;
        assert('白が占めれば白に+4', iwatoBonus(2) === 4 && iwatoBonus(1) === 0);
    `,
};
