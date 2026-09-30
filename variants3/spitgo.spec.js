// SPITGO — 砂州碁: 中央の海を分断する砂州(連結部)が唯一の通路。砂州の石は呼吸+1
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
    file: 'spitgo.html',
    en: 'SPITGO',
    jp: '砂州碁',
    prefix: 'spitgo',
    desc: '中央の海を分断する砂州(連結部)。唯一の通路を巡る陸繋の争い。',
    kind: 'stone',
    icon: 'spitgo',
    spec: [
        ...K.rb('SPITGO', '砂州碁', 'spitgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 海と砂州: 中央3行は海、中央列だけが砂州として南北を繋ぐ
        let SPIT_SEA = new Set();
        let SPIT_LAND = new Set();
        function rebuildSpit() {
            SPIT_SEA = new Set(); SPIT_LAND = new Set();
            const m = Math.floor(BOARD_SIZE / 2), c = Math.floor(BOARD_SIZE / 2);
            for (let y = m - 1; y <= m + 1; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (x === c) SPIT_LAND.add(y * BOARD_SIZE + x);
                else SPIT_SEA.add(y * BOARD_SIZE + x);
            }
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            rebuildSpit();
            SPIT_SEA.forEach(i => { board[i] = 3; });`],
        // 砂州の石は呼吸+1
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        if (SPIT_LAND.has(curr)) liberties++; // 砂州の石は根が張れる
                    }

                    if (liberties <= 0) {`],
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                if (SPIT_LAND.has(curr)) liberties++; // 砂州の石は根が張れる
            }
            return liberties;`],
        // 海の描画 + 砂州の砂筋
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        K.CUE_GRID(`            // 砂州: 中央列の砂筋ハイライト
            {
                ctx.save();
                SPIT_LAND.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(217,178,92,0.30)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            砂州碁: 中央3行は海。中央列の砂州だけが南北を繋ぐ通路 — 砂州の石は呼吸+1<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の中央3行は海 (着手不可・呼吸なし)。中央列の砂州だけが南北を繋ぐ陸橋。',
            '砂州に置いた石は根が深く呼吸点+1。通路を押さえる者が地を制する。',
            '海は両者共通の境界 — 陸繋の一点が攻防の要。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const m = Math.floor(BOARD_SIZE / 2), c = Math.floor(BOARD_SIZE / 2);
        assert('海がある', SPIT_SEA.size > 0 && board[I(1, m)] === 3);
        assert('海は打てない', isValidPlacement([{ x: 1, y: m }], 1) === false);
        assert('砂州は打てる', isValidPlacement([{ x: c, y: m }], 1) === true);
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        SPIT_SEA.forEach(i => { board[i] = 3; }); // 消した海を戻す
        board[I(c, m)] = 1;
        assert('砂州の石は呼吸+1', getLiberties(board, I(c, m)) === 3);
    `,
};
