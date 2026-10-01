// KITAMAEGO — 北前碁: 盤の縁は日本海の航路。縁への着手は交易で+1目、港 (隅) への着手は+2目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kitamaego.html',
    en: 'KITAMAEGO',
    jp: '北前碁',
    prefix: 'kitamaego',
    desc: '盤縁は日本海の航路。縁への着手で交易+1目、隅の港は+2目。',
    kind: 'stone',
    icon: 'kitamaego',
    spec: [
        ...K.rb('KITAMAEGO', '北前碁', 'kitamaego'),
        K.params([
            { key: 'rim_pts', label: '縁の交易得点', min: 0, max: 4, def: 1, unit: '目' },
            { key: 'port_pts', label: '港の交易得点', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 交易: 外周 (縁) への着手は+1目、隅の港は+2目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            {
                const px = move.cells[0].x, py = move.cells[0].y;
                const rim = px === 0 || py === 0 || px === BOARD_SIZE - 1 || py === BOARD_SIZE - 1;
                const port = (px === 0 || px === BOARD_SIZE - 1) && (py === 0 || py === BOARD_SIZE - 1);
                if (port) { captures[player] += (P('port_pts') ?? 2); fxText(py * BOARD_SIZE + px, '港 +' + (P('port_pts') ?? 2), '#b45309', 1100); }
                else if (rim) { captures[player] += (P('rim_pts') ?? 1); fxText(py * BOARD_SIZE + px, '交易 +' + (P('rim_pts') ?? 1), '#0284c7', 1000); }
            }

            turn = opponent;`],
        // 航路と港の描画
        K.CUE_GRID(`            // 北前航路: 盤縁に波線、隅に港印
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(2,132,199,0.4)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.setLineDash([cellSize * 0.3, cellSize * 0.2]);
                ctx.strokeRect(padding - cellSize * 0.5, padding - cellSize * 0.5, BOARD_SIZE * cellSize, BOARD_SIZE * cellSize);
                ctx.setLineDash([]);
                ctx.fillStyle = 'rgba(180,83,9,0.55)';
                const cs = [[0,0],[BOARD_SIZE-1,0],[0,BOARD_SIZE-1],[BOARD_SIZE-1,BOARD_SIZE-1]];
                cs.forEach(([x,y]) => {
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.22, 0, Math.PI * 2); ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            北前碁: 盤縁は日本海の航路。縁への着手で交易+1目、隅の港は+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の外周は日本海の航路 (破線) — 縁への着手は交易で即+1目。',
            '四隅は港 (茶印) — 港への着手は+2目の大交易。',
            '縁取りと港押さえが得点源 — 北前船のごとく航路を往け。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 5, y: 0 }] }, 1); // 縁への着手
        assert('縁の交易で+1', captures[1] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2); // 隅の港
        assert('港の交易で+2', captures[2] === 2);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 内陸
        assert('内陸は交易なし', captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 7, y: 7 }], 2) === true);
    `,
};
