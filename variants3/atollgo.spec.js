// ATOLLGO — 環礁碁: 盤は環礁の形。中央の大潟は着手不可・呼吸もなし
const K = require('../gen_kit.js');
module.exports = {
    file: 'atollgo.html',
    en: 'ATOLLGO',
    jp: '環礁碁',
    prefix: 'atollgo',
    desc: '環礁型の盤。中央の潟と外洋は着手もできず呼吸点にもならない。',
    kind: 'stone',
    icon: 'atollgo',
    spec: [
        ...K.rb('ATOLLGO', '環礁碁', 'atollgo'),
        K.params([
            { key: 'lagoon_r', label: '潟の半径', min: 0.05, max: 0.4, def: 0.19, step: 0.01, hint: '盤サイズ×係数' },
            { key: 'ocean_r', label: '環礁の外径', min: 0.2, max: 0.55, def: 0.42, step: 0.01, hint: '盤サイズ×係数' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.6, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 環礁: 中心からの距離が [内径, 外径] の帯だけが陸地
        const ATOLL_C = (BOARD_SIZE - 1) / 2;
        const ATOLL_R1 = () => BOARD_SIZE * (P('lagoon_r') || 0.19); // 潟 (内側の海)
        const ATOLL_R2 = () => BOARD_SIZE * (P('ocean_r') || 0.42); // 外洋
        function isAtollLand(x, y) {
            const d = Math.hypot(x - ATOLL_C, y - ATOLL_C);
            return d >= ATOLL_R1() && d <= ATOLL_R2();
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!isAtollLand(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 海の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        // 海を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        [K.ONE, K.INFO_ALGO, `            環礁碁: 環礁型の盤。潟と外洋は着手不可・呼吸なし<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は環礁の形 — 中央の大きな潟と外洋は海。着手も呼吸点にもならない。',
            'サンゴ礁の帯だけが戦場。細いリング上での取り合いが勝負を分ける。',
        ])],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const c = Math.floor(BOARD_SIZE / 2);
        resetGame();
        assert('中央の潟は海', board[I(c, c)] === 3);
        assert('潟には置けない', isValidPlacement([{ x: c, y: c }], 1) === false);
        assert('外側の角も海', board[I(0, 0)] === 3 && isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        // 環礁の帯上の点は着手可
        const ry = c, rx = c + Math.round(BOARD_SIZE * 0.30);
        assert('環礁の帯には置ける', board[I(rx, ry)] === 0 && isValidPlacement([{ x: rx, y: ry }], 1) === true);
    `,
};
