// IGNITIONGO — 点火碁: 聖火台 (天元) の四方に火 (石) を灯せば勝利
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'ignitiongo.html',
    en: 'IGNITIONGO',
    jp: '点火碁',
    prefix: 'ignitiongo',
    desc: '聖火台 (天元) の四方を自石で囲んで火を灯せば勝利。',
    kind: 'stone',
    icon: 'ignitiongo',
    spec: [
        ...K.rb('IGNITIONGO', '点火碁', 'ignitiongo'),
        K.params([
            { key: 'ign_need', label: '点火に必要な方角', min: 2, max: 4, def: 4, hint: 'この数以上の方角が自石なら点火' },
        ]),
        // 点火判定関数を挿入 (winByRule と共に)
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN +
`        // 点火勝利: 聖火台 (天元) の四方4点が全て自石
        function checkIgnitionWin(player) {
            const m = Math.floor(BOARD_SIZE / 2);
            const flanks = [[m - 1, m], [m + 1, m], [m, m - 1], [m, m + 1]];
            return flanks.filter(([x, y]) => board[y * BOARD_SIZE + x] === player).length >= (P('ign_need') || 4);
        }
        function endGameByScore() {`],
        // 聖火台セル: 天元は中立障害で石を置けない (呼吸も通らない)
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            { const m = Math.floor(BOARD_SIZE / 2); board[m * BOARD_SIZE + m] = 4; } // 聖火台`],
        // 着手後に点火判定
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 点火: 聖火台の四方を自石で囲めば勝利
            if (checkIgnitionWin(player)) {
                winByRule(player, '点火', '聖火台の四方に火を灯した');
                return;
            }

            turn = opponent;`],
        // 聖火台を炎の柱で描く
        K.CUE_GRID(`            // 聖火台: 天元に炎の印を描く
            {
                const m = Math.floor(BOARD_SIZE / 2);
                const cx = padding + m * cellSize, cy = padding + m * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(249,115,22,0.8)';
                ctx.lineWidth = Math.max(2, cellSize * 0.07);
                ctx.lineCap = 'round';
                const s = cellSize * 0.30;
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.5, cy + s * 0.6);
                ctx.quadraticCurveTo(cx - s * 1.1, cy - s * 0.1, cx, cy - s * 0.9);
                ctx.quadraticCurveTo(cx + s * 1.1, cy - s * 0.1, cx + s * 0.5, cy + s * 0.6);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy + s * 0.6, s * 0.55, Math.PI * 0.15, Math.PI * 0.85);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'聖火台の四方に火を灯せ'`),
        [K.ONE, K.INFO_ALGO, `            点火碁: 聖火台 (天元) の四方を自石で囲んで火を灯せば勝利<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '天元は聖火台。四方 (上下左右の4点) を全て自石で囲めば点火 = 即勝利。',
            '火台セル自体は障害 — 誰も置けない。囲み合いの攻防が中央で起きる。',
            '普通の碁ルールもそのまま。点火を狙えない側は地取りに回ろう。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const m = Math.floor(BOARD_SIZE / 2);
        board.fill(0); pieces = []; history.length = 0; turn = 1; gamePhase = 'playing'; gameOver = false;
        // 3方では未点火
        board[I(m - 1, m)] = 1; board[I(m + 1, m)] = 1; board[I(m, m - 1)] = 1;
        assert('3方では未点火', checkIgnitionWin(1) === false);
        board[I(m, m + 1)] = 1;
        assert('四方で点火', checkIgnitionWin(1) === true);
        // 実行時に勝利が出る
        board.fill(0); history.length = 0; gameOver = false;
        board[I(m - 1, m)] = 1; board[I(m + 1, m)] = 1; board[I(m, m - 1)] = 1;
        executeMove({ cells: [{ x: m, y: m + 1 }] }, 1);
        assert('点火で勝利', gameOver === true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
