// SALTGO — 塩碁: 石は塩の結晶。湿気区域 (潮溜まり) の石は8手ごとに溶けて消える
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
    file: 'saltgo.html',
    en: 'SALTGO',
    jp: '塩碁',
    prefix: 'saltgo',
    desc: '石は塩の結晶。潮溜まり (湿気区域) の石は8手ごとに溶けて消える。',
    kind: 'stone',
    icon: 'saltgo',
    spec: [
        ...K.rb('SALTGO', '塩碁', 'saltgo'),
        K.params([
            { key: 'melt_interval', label: '潮解の間隔', min: 2, max: 20, def: 8, unit: '手' },
            { key: 'sea_rows', label: '潮溜まりの行数', min: 1, max: 5, def: 2, unit: '行' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 潮溜まり: 下N行と海岸沿いの散在する湿気区域 (行数は設定で調整)
        let WET_SET = new Set();
        function rebuildWetSet() {
            WET_SET = new Set();
            const seaY = BOARD_SIZE - Math.max(1, P('sea_rows') || 2);
            for (let y = seaY; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                WET_SET.add(y * BOARD_SIZE + x);
            }
            for (let x = 1; x < BOARD_SIZE - 1; x += 4) {
                const py = seaY - 1 - ((x * 7) % 3);
                if (py >= 0) WET_SET.add(py * BOARD_SIZE + x);
            }
        }
        rebuildWetSet();
        // 設定変更で区域を即時再構成
        function onVariantParam(p) {
            if (p.key === 'sea_rows') rebuildWetSet();
        }`],
        // 溶解: 8手ごとに湿気区域の塩石が溶ける (双方同じ周期・取りにはならない)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 塩の溶解: 8手ごとに湿気区域の石が溶ける
            if (history.length % Math.max(1, P('melt_interval') || 8) === 0) {
                let melt = 0;
                WET_SET.forEach(i => {
                    if (board[i] === 1 || board[i] === 2) {
                        board[i] = 0;
                        fxSplash(i, '#a5c9ff');
                        melt++;
                    }
                });
                if (melt) {
                    cleanUpPieces();
                    fxShake(3, 260);
                    fxText((BOARD_SIZE * BOARD_SIZE / 2) | 0, '潮解!', '#a5c9ff', 1000);
                }
            }

            turn = opponent;`],
        // 潮溜まりは薄い水面
        K.CUE_GRID(`            // 潮溜まり: 湿気区域を薄い水面色に
            {
                ctx.save();
                ctx.fillStyle = 'rgba(96, 165, 250, 0.22)';
                WET_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_MIST('rgba(150, 195, 255, 0.06)')],
        ...K.EVENT_CHIP_SPEC(`'潮解まで ' + ((P('melt_interval') || 8) - (history.length % (P('melt_interval') || 8))) + ' 手'`),
        [K.ONE, K.INFO_ALGO, `            塩碁: 潮溜まりの石は8手ごとに溶けて消える (アゲハマにもならない)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は塩の結晶。下2行と潮溜まりの湿気区域の石は8手ごとに溶けて消える。',
            '溶けた石はアゲハマにもならない — 海に還るだけ。',
            '湿気区域は捨て石の宝庫。固めるなら乾いた内陸へ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('潮溜まりがある', WET_SET.size > 10);
        board[I(0, BOARD_SIZE - 1)] = 1;
        history.push({}, {}, {}, {}, {}, {}, {});
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('8手で湿気区域の石は溶ける', board[I(0, BOARD_SIZE - 1)] === 0);
        assert('溶けてもアゲハマにならない', captures[2] === 0);
        board.fill(0); pieces = []; history.length = 0;
        assert('起動して通常着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
