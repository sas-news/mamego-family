// HOSHITORIGO — 星取碁: 敵石を取るたび星が増え、自分の連続取り手番で連勝ボーナス — 星1個=1目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
const ST_INIT = `{ stars: { 1: 0, 2: 0 }, hot: { 1: false, 2: false } }`; // hot: 前の自分の手番も取った
module.exports = {
    file: 'hoshitorigo.html',
    en: 'HOSHITORIGO',
    jp: '星取碁',
    prefix: 'hoshitorigo',
    desc: '敵石を取るたび星+1。自分の手番が連続して取れば連勝ボーナス+1。星1個=終局時1目。',
    kind: 'stone',
    icon: 'hoshitorigo',
    spec: [
        ...K.rb('HOSHITORIGO', '星取碁', 'hoshitorigo'),
        K.params([
            { key: 'streak_bonus', label: '連勝ボーナス', min: 0, max: 3, def: 1, unit: '星' },
        ]),
        ...ST(ST_INIT),
        // 星取表: 取った分だけ星が増え、自分の手番で取り続ければ連勝ボーナス
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 星取碁: 取った数だけ星+、自分の前の手番も取っていれば連勝ボーナス+1
            if (captured.length > 0) {
                st.stars[player] += captured.length;
                if (st.hot[player]) {
                    st.stars[player] += (P('streak_bonus') ?? 1);
                    fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '連勝+' + (P('streak_bonus') ?? 1) + '星', '#fde047', 1200);
                }
                st.hot[player] = true;
            } else {
                st.hot[player] = false;
            }

            turn = opponent;`],
        [K.ONE, `        function endGameByScore() {`,
`        // 星取表: 集めた星は終局時1個1目
        function starBonus(player) {
            return st.stars[player];
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + starBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + starBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>星取表:</span> <strong>黒 \${st.stars[1]}星 / 白 \${st.stars[2]}星</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            星取碁: 敵石を取るたび星+1。自分の手番が連続して取れば連勝ボーナス+1。星1個=終局時1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '星取表: 敵石を取るたびその個数だけ星を得る (アゲハマ点に加えて星1個=+1目)。',
            '自分の手番ごとに取り続ければ連勝ボーナス+1星。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures[1] = 0; captures[2] = 0;
        st.stars = { 1: 0, 2: 0 }; st.hot = { 1: false, 2: false };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 4] = 2;
        board[3 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 白1個取り → 星+1
        assert('取ったら星+1', st.stars[1] === 1 && st.hot[1] === true);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2); // 白は取れず
        board[7 * BOARD_SIZE + 7] = 2;
        board[6 * BOARD_SIZE + 7] = 1; board[8 * BOARD_SIZE + 7] = 1; board[7 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 8, y: 7 }] }, 1); // 黒また取り → 1星+連勝1
        assert('連続取りで連勝ボーナス', st.stars[1] === 3);
        assert('星は終局時の点になる', starBonus(1) === 3);
    `,
};
