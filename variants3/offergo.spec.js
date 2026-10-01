// OFFERGO — 捧剣碁: 祭壇 (天元) を含む自連が4石以上になれば剣を捧げて勝利
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'offergo.html',
    en: 'OFFERGO',
    jp: '捧剣碁',
    prefix: 'offergo',
    desc: '祭壇 (天元) を含む自連が4石以上に育てば剣を捧げて勝利。',
    kind: 'stone',
    icon: 'offergo',
    spec: [
        ...K.rb('OFFERGO', '捧剣碁', 'offergo'),
        K.params([
            { key: 'offer_len', label: '捧剣に必要な連の大きさ', min: 3, max: 8, def: 4, unit: '石' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        // 祭壇判定関数を挿入 (winByRule と共に)
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN +
`        // 捧剣勝利: 天元 (祭壇) を含む自連が4石以上
        function checkOfferWin(player) {
            const m = Math.floor(BOARD_SIZE / 2);
            const t = m * BOARD_SIZE + m;
            if (board[t] !== player) return false;
            const group = getConnectedGroup(t, player);
            return group.length >= (P('offer_len') || 4);
        }
        function endGameByScore() {`],
        // 着手後に捧剣判定
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 捧剣: 祭壇を含む自連が4石以上なら勝利
            if (checkOfferWin(player)) {
                winByRule(player, '捧剣', '祭壇に剣 (連4石) を捧げた');
                return;
            }

            turn = opponent;`],
        // 祭壇を描く (天元の鳥居印)
        K.CUE_GRID(`            // 祭壇: 天元に鳥居の印を描く
            {
                const m = Math.floor(BOARD_SIZE / 2);
                const cx = padding + m * cellSize, cy = padding + m * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(220,38,38,0.75)';
                ctx.lineWidth = Math.max(2, cellSize * 0.08);
                ctx.lineCap = 'round';
                const s = cellSize * 0.34;
                ctx.beginPath();
                ctx.moveTo(cx - s, cy - s * 0.6);
                ctx.lineTo(cx + s, cy - s * 0.6);
                ctx.moveTo(cx - s * 0.8, cy - s * 0.25);
                ctx.lineTo(cx + s * 0.8, cy - s * 0.25);
                ctx.moveTo(cx - s * 0.55, cy - s * 0.25);
                ctx.lineTo(cx - s * 0.55, cy + s * 0.6);
                ctx.moveTo(cx + s * 0.55, cy - s * 0.25);
                ctx.lineTo(cx + s * 0.55, cy + s * 0.6);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'祭壇連を4石に育てて捧剣勝利'`),
        [K.ONE, K.INFO_ALGO, `            捧剣碁: 祭壇 (天元) を含む自連が4石以上に育てば剣を捧げて勝利<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の天元は祭壇。祭壇を含む自連 (同一直立つ連) を4石以上に育てれば勝利。',
            '敵が祭祭壇に剣を捧げさせないよう追い回す守りの勝負でもある。',
            '普通の碁ルールも生きているので祭壇放置の地取りも有効。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const m = Math.floor(BOARD_SIZE / 2);
        board.fill(0); pieces = []; history.length = 0; turn = 1; gamePhase = 'playing';
        // 祭壇を含まない連は無効
        board[I(2, 2)] = 1; board[I(2, 3)] = 1; board[I(3, 2)] = 1; board[I(3, 3)] = 1;
        assert('祭壇を含まない連は無効', checkOfferWin(1) === false);
        // 祭壇連4石で勝利
        board.fill(0);
        board[I(m, m)] = 1; board[I(m - 1, m)] = 1; board[I(m + 1, m)] = 1;
        executeMove({ cells: [{ x: m, y: m - 1 }] }, 1);
        assert('祭壇連4石で捧剣勝利', gameOver === true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
