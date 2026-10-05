// CORRIDORGO — 渡廊碁: 二つの庭園を1列の渡り廊下が結ぶ
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'corridorgo.html',
    en: 'CORRIDORGO',
    jp: '渡廊碁',
    prefix: 'corridorgo',
    desc: '東西の庭園を1列の渡り廊下が結ぶ。廊下を制する者が両岸を制す。',
    kind: 'stone',
    icon: 'corridorgo',
    spec: [
        ...K.rb('CORRIDORGO', '渡廊碁', 'corridorgo'),
        K.params([
            { key: 'garden_w', label: '庭園の幅', min: 0, max: 0.45, step: 0.05, def: 0, hint: '0=自動 (盤の30%)' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 渡廊: 左右の庭園 (各3割の幅) を中央1列の廊下が結ぶ
        const COR_G = Math.ceil(BOARD_SIZE * (P('garden_w') || 0.30));
        const COR_Y = Math.floor(BOARD_SIZE / 2);
        function isGardenOrCorridor(x, y) {
            return x < COR_G || x >= BOARD_SIZE - COR_G || y === COR_Y;
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!isGardenOrCorridor(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 園外は生け垣の闇
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(`                    // 生け垣の闇: 深い緑の植込み
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.8);
                    g.addColorStop(0, 'rgba(20, 60, 30, 0.75)');
                    g.addColorStop(1, 'rgba(10, 35, 18, 0.85)');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const ph = Math.sin(now / 1500 + x * 1.7 + y * 2.3);
                    if (ph > 0.3) {
                        ctx.fillStyle = 'rgba(60, 130, 70, 0.35)';
                        ctx.beginPath();
                        ctx.arc(cx + Math.sin(x * 5) * cellSize * 0.15, cy + Math.cos(y * 7) * cellSize * 0.15, cellSize * 0.14, 0, Math.PI * 2);
                        ctx.fill();
                    }`)],
        ...K.WALL_GUARD_SPEC,
        K.CUE_GRID(`            // 渡廊: 木板の廊下床と庭園の芝
            {
                ctx.save();
                for (let x = COR_G; x < BOARD_SIZE - COR_G; x++) {
                    const cx = padding + x * cellSize, cy = padding + COR_Y * cellSize;
                    ctx.fillStyle = 'rgba(150, 110, 60, 0.35)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(90, 60, 30, 0.6)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.5, cy);
                    ctx.lineTo(cx + cellSize * 0.5, cy);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            渡廊碁: 東西の庭園を1列の渡り廊下が結ぶ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は東と西の二つの庭園。その間を通るのは1列の渡り廊下だけ。',
            '庭園の外は生け垣 (着手不可・呼吸なし)。両岸を結ぶ廊下が唯一の通路。',
            '廊下を押さえれば敵の往来を断てる — 連も呼吸も廊下経由。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const m = Math.floor(BOARD_SIZE / 2);
        assert('廊下行は全通', board[I(m, m)] !== 3 && isValidPlacement([{ x: m, y: m }], 1) === true);
        assert('庭園の外は生け垣', board[I(m, 0)] === 3 && isValidPlacement([{ x: m, y: 0 }], 1) === false);
        assert('両庭園は着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true && isValidPlacement([{ x: BOARD_SIZE - 1, y: 0 }], 1) === true);
        // 廊下を通って両岸が繋がる
        board.fill(0);
        for (let x = 0; x < BOARD_SIZE; x++) board[I(x, m)] = 1;
        assert('廊下の連は両岸に渡る', getLiberties(board, I(m, m)) > 0);
    `,
};
