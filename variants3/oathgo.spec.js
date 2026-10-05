// OATHGO — 宣誓碁: 中央の刻文 (縦1列) に自石を3箇所以上刻んだ側が誓いを守り勝利
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
    file: 'oathgo.html',
    en: 'OATHGO',
    jp: '宣誓碁',
    prefix: 'oathgo',
    desc: '中央列の刻文に自石を3箇所以上刻んだ側が誓いを守って勝利。',
    kind: 'stone',
    icon: 'oathgo',
    spec: [
        ...K.rb('OATHGO', '宣誓碁', 'oathgo'),
        K.params([
            { key: 'oath_count', label: '宣誓に必要な刻み数', min: 2, max: 7, def: 3, unit: '箇所' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        // 刻文判定関数を挿入 (winByRule と共に)
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN +
`        // 宣誓勝利: 中央列 (刻文) に自石が3箇所以上
        function checkOathWin(player) {
            const m = Math.floor(BOARD_SIZE / 2);
            let n = 0;
            for (let y = 0; y < BOARD_SIZE; y++) if (board[y * BOARD_SIZE + m] === player) n++;
            return n >= (P('oath_count') || 3);
        }
        function endGameByScore() {`],
        // 着手後に宣誓判定
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 宣誓: 中央列の刻文に自石3箇所以上で勝利
            if (checkOathWin(player)) {
                winByRule(player, '宣誓', '刻文に誓いを刻み守った');
                return;
            }

            turn = opponent;`],
        // 刻文: 中央列に縦の誓約線と楔印
        K.CUE_GRID(`            // 刻文: 中央列に誓約線と楔印を描く
            {
                const m = Math.floor(BOARD_SIZE / 2);
                const cx = padding + m * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(146,64,14,0.45)';
                ctx.lineWidth = Math.max(1.8, cellSize * 0.07);
                ctx.setLineDash([cellSize * 0.22, cellSize * 0.14]);
                ctx.beginPath();
                ctx.moveTo(cx, padding - cellSize * 0.5);
                ctx.lineTo(cx, padding + (BOARD_SIZE - 1) * cellSize + cellSize * 0.5);
                ctx.stroke();
                ctx.setLineDash([]);
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.22, cy);
                    ctx.lineTo(cx + cellSize * 0.22, cy);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'刻文: 中央列に自石3箇所で勝利'`),
        [K.ONE, K.INFO_BASE, `            宣誓碁: 中央列の刻文に自石を3箇所以上刻んだ側が勝利<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の中央列は誓約の刻文。そこに自石を3箇所以上刻めば宣誓成立 = 即勝利。',
            '刻文は双方に開かれている — 刻み合いのレースと刻ませない守りの攻防。',
            '普通の碁ルールもそのまま。刻文を捨てて地取りに回るのも手。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const m = Math.floor(BOARD_SIZE / 2);
        board.fill(0); pieces = []; history.length = 0; turn = 1; gamePhase = 'playing'; gameOver = false;
        // 2箇所では未成立
        board[I(m, 2)] = 1; board[I(m, 5)] = 1;
        assert('2箇所では未成立', checkOathWin(1) === false);
        board[I(m, 8)] = 1;
        assert('3箇所で宣誓成立', checkOathWin(1) === true);
        // 実行時に勝利が出る
        board.fill(0); history.length = 0; gameOver = false;
        board[I(m, 2)] = 1; board[I(m, 5)] = 1;
        executeMove({ cells: [{ x: m, y: 8 }] }, 1);
        assert('刻文で勝利', gameOver === true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
