// SPIREGO — 塔頂碁: 盤は塔の断面。上層ほど点が少なく、頂上は1点だけ
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'spirego.html',
    en: 'SPIREGO',
    jp: '塔頂碁',
    prefix: 'spirego',
    desc: '塔の断面の盤。上に行くほど狭くなり、頂上は1点の争奪戦。',
    kind: 'stone',
    icon: 'spirego',
    spec: [
        ...K.rb('SPIREGO', '塔頂碁', 'spirego'),
        K.params([
            { key: 'spire_slope', label: '塔の広がり (何行ごとに+1マス)', min: 1, max: 4, def: 2, unit: '行' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 塔: 底辺が最も広く、頂上 (y=0) は1点だけの尖塔断面
        const SPIRE_MID = Math.floor(BOARD_SIZE / 2);
        function isSpire(x, y) {
            return Math.abs(x - SPIRE_MID) <= Math.floor((y + 1) / (P('spire_slope') || 2));
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!isSpire(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 塔の外は空
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(`                    // 空: 塔の外は朝焼けの空色
                    const g = ctx.createLinearGradient(cx, cy - hh, cx, cy + hh);
                    g.addColorStop(0, 'rgba(140, 180, 225, 0.55)');
                    g.addColorStop(1, 'rgba(200, 220, 240, 0.45)');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const ph = Math.sin(now / 2400 + x * 0.5 + y * 0.3);
                    if (ph > 0.6) {
                        ctx.fillStyle = 'rgba(255,255,255,0.25)';
                        ctx.beginPath();
                        ctx.arc(cx + ph * cellSize * 0.2, cy, cellSize * 0.18, 0, Math.PI * 2);
                        ctx.fill();
                    }`)],
        ...K.WALL_GUARD_SPEC,
        K.CUE_GRID(`            // 塔: 最頂点に金色の光
            {
                ctx.save();
                const cx = padding + SPIRE_MID * cellSize;
                const cy = padding + 0 * cellSize;
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.9);
                g.addColorStop(0, 'rgba(250, 204, 21, 0.55)');
                g.addColorStop(1, 'rgba(250, 204, 21, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.9, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            塔頂碁: 塔の断面の盤。上層ほど狭く頂上は1点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は塔の断面 — 底辺が最も広く、上層ほど点が少なくなる尖塔型。',
            '頂上はたった1点。上に行くほど狭い空間での押し合いが熱い。',
            '塔の外は空 (着手不可・呼吸なし)。麓を制してから頂を目指せ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const m = Math.floor(BOARD_SIZE / 2);
        assert('頂上は1点だけ', isSpire(m, 0) === true && isSpire(m - 1, 0) === false && isSpire(m + 1, 0) === false);
        assert('底辺は全幅', isSpire(0, BOARD_SIZE - 1) === true && isSpire(BOARD_SIZE - 1, BOARD_SIZE - 1) === true);
        assert('塔の外は空', board[I(0, 0)] === 3 && isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('頂上に着手できる', isValidPlacement([{ x: m, y: 0 }], 1) === true);
    `,
};
