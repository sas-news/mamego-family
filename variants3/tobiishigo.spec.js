// TOBIISHIGO — 飛石碁: 自石に隣接する点には打てない。飛石を踏むように離れて進む
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tobiishigo.html',
    en: 'TOBIISHIGO',
    jp: '飛石碁',
    prefix: 'tobiishigo',
    desc: '自分の石に隣接する点には打てない — 全ての石は庭に散らばる飛石。',
    kind: 'stone',
    icon: 'tobiishigo',
    spec: [
        ...K.rb('TOBIISHIGO', '飛石碁', 'tobiishigo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.8, hint: '交点数比' },
        ]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 飛石ルール: 自分の石に隣接する点には置けない (飛石伝いに離れて置く)
            for (const p of cells) {
                const i0 = p.y * BOARD_SIZE + p.x;
                if (getNeighbors(i0).some(n => board[n] === player)) return false;
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            飛石碁: 自分の石に隣接する点には打てない。石は全て離れた飛石になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の石に上下左右で隣接する点には着手できない — あなたの石は全て孤立した「飛石」。',
            '連を組めないので呼吸の共有もない。相手の石の隣には打てる — 飛石を飛んで攻め合え。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('自石に隣接は打てない', isValidPlacement([{ x: 5, y: 4 }], 1) === false);
        assert('斜めならOK', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
        assert('離れた点はOK', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
        assert('相手の石の隣はOK', isValidPlacement([{ x: 5, y: 4 }], 2) === true);
    `,
};
