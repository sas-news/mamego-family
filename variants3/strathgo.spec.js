// STRATHGO — 段丘2碁: 河岸段丘の盤。古い段(上段)ほど高く硬い = 呼吸点ボーナス
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
    file: 'strathgo.html',
    en: 'STRATHGO',
    jp: '段丘2碁',
    prefix: 'strathgo',
    desc: '河岸段丘の盤。上の段ほど古く硬い — 段の高さ分だけ呼吸点が増える。',
    kind: 'stone',
    icon: 'strathgo',
    spec: [
        ...K.rb('STRATHGO', '段丘2碁', 'strathgo'),
        K.params([
            { key: 'terr_bonus', label: '段の高さボーナス', min: 0, max: 4, def: 1, hint: '呼吸点への倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 河岸段丘: 盤を横3帯に分割。上段(古い段)=Lv2、中段=Lv1、下段=Lv0
        function terrLevel(y) {
            const band = Math.ceil(BOARD_SIZE / 3);
            return Math.max(0, 2 - Math.floor(y / band));
        }`],
        // 呼吸判定に段レベルを反映 (捕獲側)
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        liberties += terrLevel(curr / BOARD_SIZE | 0) * (P('terr_bonus') ?? 1); // 段の高さ分だけ硬い
                    }

                    if (liberties <= 0) {`],
        // 呼吸判定に段レベルを反映 (呼吸数側)
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                liberties += terrLevel(curr / BOARD_SIZE | 0) * (P('terr_bonus') ?? 1); // 段の高さ分だけ硬い
            }
            return liberties;`],
        // 段丘の描画: 帯ごとの段差と崖線
        K.CUE_GRID(`            // 段丘: 横3帯の段差 — 上段ほど濃い地面
            {
                ctx.save();
                const band = Math.ceil(BOARD_SIZE / 3);
                const tints = ['rgba(150,120,70,0.10)', 'rgba(130,120,80,0.16)', 'rgba(105,110,70,0.24)'];
                for (let y = 0; y < BOARD_SIZE; y++) {
                    ctx.fillStyle = tints[terrLevel(y)];
                    ctx.fillRect(padding - cellSize * 0.5, padding + (y - 0.5) * cellSize, BOARD_SIZE * cellSize, cellSize);
                }
                ctx.strokeStyle = 'rgba(80,70,50,0.6)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                for (let b = 1; b < 3; b++) {
                    const ey = padding + b * band * cellSize - cellSize * 0.5;
                    ctx.beginPath();
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        const jx = padding + x * cellSize;
                        const jy = ey + Math.sin(x * 2.1 + b) * cellSize * 0.06;
                        if (x === 0) ctx.moveTo(jx, jy); else ctx.lineTo(jx, jy);
                    }
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            段丘2碁: 河岸段丘の盤。上の段ほど古く硬い — 段Lv分だけ連の呼吸点が増える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は横3帯の河岸段丘。上段 (暗い地色) は最も古く硬く、石1つにつき呼吸点+2。',
            '中段は+1、下段は+0。段が違うだけで同じ形でも生きやすさが変わる。',
            '高い段を押さえると守りに強い。低い段の敵は崩れやすい。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const band = Math.ceil(BOARD_SIZE / 3);
        assert('段レベル3区分', terrLevel(0) === 2 && terrLevel(band) === 1 && terrLevel(BOARD_SIZE - 1) === 0);
        board[0 * BOARD_SIZE + 4] = 1;
        assert('最古段の石は呼吸+2', getLiberties(board, 4) === 5);
        board[band * BOARD_SIZE + 4] = 2;
        assert('中段の石は呼吸+1', getLiberties(board, band * BOARD_SIZE + 4) === 5);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: BOARD_SIZE - 1 }], 1) === true);
    `,
};
