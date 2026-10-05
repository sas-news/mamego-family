// TRENCHGO — 海溝碁: 盤の中央を深い海溝が縦断。両側は直接近傍しない
const K = require('../gen_kit.js');
module.exports = {
    file: 'trenchgo.html',
    en: 'TRENCHGO',
    jp: '海溝碁',
    prefix: 'trenchgo',
    desc: '中央を深い海溝が縦断する分断盤。左右は直接近傍しない。',
    kind: 'stone',
    icon: 'trenchgo',
    spec: [
        ...K.rb('TRENCHGO', '海溝碁', 'trenchgo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.8, hint: '交点数比' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 海溝: 中央1列の深い裂け目 (着手不可・呼吸なし)
        const TRENCH_X = Math.floor(BOARD_SIZE / 2);`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) board[y * BOARD_SIZE + TRENCH_X] = 3;`],
        // 海溝の描画 (深淵テクスチャ)
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_RIFT('rgba(80,140,200,0.35)'))],
        // 海溝を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_BASE, `            海溝碁: 盤の中央を深い海溝が縦断。両側は直接近傍しない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の中央1列は深い「海溝」。着手もできず、呼吸点にもならない。',
            '海溝を挟んだ左右の石は直接近傍しない — 盤が東西に分断された戦いになる。',
        ])],
        // 打ち切り: 交点数の0.8倍の手数で即採点終局
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 連続パスで即採点終局 (死に石確認は簡略化)
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const T = Math.floor(BOARD_SIZE / 2);
        resetGame();
        assert('海溝列がある', board[I(T, 4)] === 3);
        assert('海溝には置けない', isValidPlacement([{ x: T, y: 5 }], 1) === false);
        assert('海溝の左は置ける', isValidPlacement([{ x: T - 1, y: 5 }], 1) === true);
        assert('海溝を挟んで近傍しない', !getNeighbors(I(T - 1, 5)).includes(I(T + 1, 5)));
    `,
};
