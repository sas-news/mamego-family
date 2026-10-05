// KAPPAGO — 河童碁: 水辺 (盤の外周) にいる河童は元気 (+0.5目)。四方を埋められて頭の水が干きた石は弱る (-0.5目)
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kappago.html',
    en: 'KAPPAGO',
    jp: '河童碁',
    prefix: 'kappago',
    desc: '外周の水辺にいる河童は元気 (+0.5目)。頭の水が干きた石 (四方が埋まる) は弱る (-0.5目)。',
    kind: 'stone',
    icon: 'kappago',
    spec: [
        ...K.rb('KAPPAGO', '河童碁', 'kappago'),
        K.params([
            { key: 'water_pts', label: '水辺の元気ボーナス', min: 0, max: 2, def: 0.5, step: 0.5, unit: '目' },
            { key: 'dry_pts', label: '干きた石のペナルティ', min: 0, max: 2, def: 0.5, step: 0.5, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, `        function endGameByScore() {`,
`        // 河童: 外周(水辺)の自石は+0.5目。四方に空点が無い干きた石は-0.5目
        function kappaBonus(player) {
            let b = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                if (x === 0 || y === 0 || x === BOARD_SIZE - 1 || y === BOARD_SIZE - 1) b += (P('water_pts') ?? 0.5);
                if (!getNeighbors(i).some(n => board[n] === 0)) b -= (P('dry_pts') ?? 0.5);
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + kappaBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + kappaBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>河童の元気:</span> <strong>黒 \${kappaBonus(1)} / 白 \${kappaBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 水辺の帯: 盤の外周に薄い水色を描く
        K.CUE_GRID(`            // 水辺: 盤の外周1目に薄い水面を描く
            {
                ctx.save();
                ctx.fillStyle = 'rgba(125,211,252,0.16)';
                const x0 = padding - cellSize * 0.5, y0 = padding - cellSize * 0.5;
                const w = cellSize * BOARD_SIZE;
                ctx.fillRect(x0, y0, w, cellSize);
                ctx.fillRect(x0, y0 + w - cellSize, w, cellSize);
                ctx.fillRect(x0, y0, cellSize, w);
                ctx.fillRect(x0 + w - cellSize, y0, cellSize, w);
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            河童碁: 外周(水辺)の自石は+0.5目。四方が埋まって頭の水が干きた石は-0.5目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '河童は水辺で元気になる: 盤の外周にある自分の石は1個につき+0.5目。',
            'ただし四方に空点のない石は頭の水が干きて弱る: 1個につき-0.5目。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4] = 1; // 外周の水辺
        assert('水辺の河童は+0.5', kappaBonus(1) === 0.5);
        board[4 * BOARD_SIZE + 4] = 1;
        board[3 * BOARD_SIZE + 4] = 2; board[5 * BOARD_SIZE + 4] = 2;
        board[4 * BOARD_SIZE + 3] = 2; board[4 * BOARD_SIZE + 5] = 2;
        assert('頭の水が干きた石は-0.5 (計0)', kappaBonus(1) === 0);
        board[9 * BOARD_SIZE + 9] = 2;
        assert('内陸の普通の石は0', kappaBonus(2) === 0);
    `,
};
