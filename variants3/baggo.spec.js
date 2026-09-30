// BAGGO — 袋碁: 取った敵石は袋に詰める。袋は5個まで、溢れると重荷でマイナス点
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'baggo.html',
    en: 'BAGGO',
    jp: '袋碁',
    prefix: 'baggo',
    desc: '取った敵石は袋に詰める。5個まで得点、溢れた分は重荷で-1目ずつ。',
    kind: 'stone',
    icon: 'baggo',
    spec: [
        ...K.rb('BAGGO', '袋碁', 'baggo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 袋: アゲハマは袋に詰められる。5個まで価値あり、溢れは重荷
        const BAG_CAP = 5;
        function bagScore(c) { return Math.min(c, BAG_CAP) - Math.max(0, c - BAG_CAP); }`],
        // 得点計算: 袋の重さでアゲハマの価値が変わる
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + bagScore(captures[1]);
            const whiteTotal = territory.white + bagScore(captures[2]) + komi;`],
        // 袋の残量表示
        ...K.EVENT_CHIP_SPEC(`'黒袋 ' + captures[1] + '/5 白袋 ' + captures[2] + '/5'`),
        // 袋の描画: アゲハマ表示は石に巾着マーク
        ...K.STONE_MARKS_SPEC(`            // 袋に詰まり気味の石は薄い袋紋
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const v = board[y * BOARD_SIZE + x];
                if (v !== 1 && v !== 2) continue;
                const heavy = captures[v] > BAG_CAP;
                if (!heavy) continue;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(190, 120, 40, 0.5)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.strokeRect(cx - cellSize * 0.32, cy - cellSize * 0.32, cellSize * 0.64, cellSize * 0.64);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            袋碁: 取った敵石は袋に。5個まで得点、溢れた分は重荷で-1目ずつ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '取った敵石は袋に詰める。袋の容量は5個まで。',
            '5個までのアゲハマは通常得点。溢れた分は1つ-1目の重荷になる。',
            '取りすぎると袋が破れる — 大きな連だけ狙い、小石は放置も手。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        assert('袋は5個まで価値', bagScore(5) === 5);
        assert('溢れは重荷', bagScore(7) === 3);
        assert('たくさん溢れるとマイナス', bagScore(11) === -1);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
