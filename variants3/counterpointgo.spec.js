// COUNTERPOINTGO — 対位碁: 同じ大きさの連が2つ並走すると輪唱 (カノン) になり得点
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
    file: 'counterpointgo.html',
    en: 'COUNTERPOINTGO',
    jp: '対位碁',
    prefix: 'counterpointgo',
    desc: '同じ大きさ (2石以上) の連が2つできると輪唱が響き+2目。',
    kind: 'stone',
    icon: 'counterpointgo',
    spec: [
        ...K.rb('COUNTERPOINTGO', '対位碁', 'counterpointgo'),
        K.params([
            { key: 'canon_min', label: '輪唱の最小連サイズ', min: 1, max: 6, def: 2, unit: '石' },
            { key: 'canon_pts', label: '輪唱の得点', min: 0, max: 8, def: 2, unit: '目', hint: '0=輪唱なし' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        // 対位ルール: 着手連と同じ大きさの自連がもう1つあれば輪唱成立 +2目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 対位: 着手した連と同じ大きさ (2石以上) の自連が他にあれば輪唱 +2目
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (board[mi] === player) {
                    const mg = getConnectedGroup(mi, player);
                    const s = mg.length;
                    if (s >= (P('canon_min') || 2)) {
                        const seenP = {};
                        let twins = 0;
                        for (let i = 0; i < board.length; i++) {
                            if (board[i] !== player || seenP[i]) continue;
                            const g = getConnectedGroup(i, player);
                            g.forEach(j => { seenP[j] = true; });
                            if (g.length === s) twins++;
                        }
                        if (twins >= 2) {
                            captures[player] += (P('canon_pts') ?? 2);
                            fxGlow(mi, '#c084fc', 700);
                            fxText(mi, '輪唱 +' + (P('canon_pts') ?? 2), '#c084fc', 1300);
                        }
                    }
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'同じ大きさの連が2つで輪唱+2'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            対位碁: 着手した連と同じ大きさ (2石以上) の自分の連が他にあれば輪唱成立で+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '対位法の輪唱: 着手した連と同じ大きさ (2石以上) の自分の連が盤上にもう1つあれば+2目。',
            '連を同じ形に育てると響き合う。崩されれば輪唱は途切れる。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[2 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 3] = 1; // 連A (2石)
        board[8 * BOARD_SIZE + 8] = 1;
        executeMove({ cells: [{ x: 9, y: 8 }] }, 1); // 連Bも2石に → 輪唱
        assert('同型の連が2つで輪唱+2', captures[1] === 2);
        captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 10, y: 8 }] }, 1); // 連Bが3石に → 同型なし
        assert('大きさが違うと輪唱しない', captures[1] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
