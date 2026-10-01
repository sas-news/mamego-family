// THRONEGO — 昇殿碁: 殿上5箇所 (中央3x3の内側5点) に自石を3箇所以上置くと即位して勝ち
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
const WIN = `        // 昇殿勝利: 殿上5点 (中央3x3の十字形) の3点以上を自石で占める
        function checkThroneWin(player) {
            const m = Math.floor(BOARD_SIZE / 2);
            const spots = [
                [m, m], [m - 1, m], [m + 1, m], [m, m - 1], [m, m + 1],
            ];
            let n = 0;
            spots.forEach(([x, y]) => { if (board[y * BOARD_SIZE + x] === player) n++; });
            return n >= (P('need') || 3);
        }`;
module.exports = {
    file: 'thronego.html',
    en: 'THRONEGO',
    jp: '昇殿碁',
    prefix: 'thronego',
    desc: '殿上5箇所 (中央十字) に自石を3箇所以上置いた側が即位して勝利。',
    kind: 'stone',
    icon: 'thronego',
    spec: [
        ...K.rb('THRONEGO', '昇殿碁', 'thronego'),
        K.params([
            { key: 'need', label: '即位に必要な殿上箇所', min: 1, max: 5, def: 3, unit: '箇所' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.75, hint: '交点数比' },
        ]),
        // 殿上判定関数を挿入 (winByRule と共に)
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + WIN + `
        function endGameByScore() {`],
        // 着手後に昇殿判定
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 昇殿: 殿上5点の3点以上を占めれば即勝利
            if (checkThroneWin(player)) {
                winByRule(player, '昇殿', '殿上5箇所のうち3箇所を制圧した');
                return;
            }

            turn = opponent;`],
        // 殿上5点を金色で描く
        K.CUE_GRID(`            // 殿上: 中央十字の5点を金色の高座で描く
            {
                const m = Math.floor(BOARD_SIZE / 2);
                const spots = [
                    [m, m], [m - 1, m], [m + 1, m], [m, m - 1], [m, m + 1],
                ];
                ctx.save();
                ctx.strokeStyle = 'rgba(217,119,6,0.7)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                ctx.setLineDash([cellSize * 0.18, cellSize * 0.12]);
                spots.forEach(([x, y]) => {
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'殿上3箇所で即位勝利'`),
        [K.ONE, K.INFO_ALGO, `            昇殿碁: 中央十字の殿上5箇所に自石を3箇所以上置いた側が即位して勝利<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央の十字形「殿上」5箇所に自石を3箇所以上置けば即位 = 即勝利。',
            '普通の碁ルールもそのまま — 殿上攻略と地取りの二正面作戦。',
            '殿上は1箇所当たり置き逃げ防止に敵石の取り合いが激しくなる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const m = Math.floor(BOARD_SIZE / 2);
        board.fill(0); pieces = []; history.length = 0; turn = 1; gamePhase = 'playing';
        // 殿上2点では未勝利
        board[I(m, m)] = 1; board[I(m - 1, m)] = 1;
        assert('2点では未勝利', checkThroneWin(1) === false);
        board[I(m, m - 1)] = 1;
        assert('3点で即位', checkThroneWin(1) === true);
        // 実行時に勝利が出る
        board.fill(0); history.length = 0; gamePhase = 'playing';
        board[I(m, m)] = 1; board[I(m - 1, m)] = 1;
        executeMove({ cells: [{ x: m, y: m - 1 }] }, 1);
        assert('昇殿で勝利', gameOver === true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
