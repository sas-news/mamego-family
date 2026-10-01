// TSUNATORIGO — 綱取碁: 1手で5個以上取る大一番に勝つと横綱の称号 — 終局時+3目
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
const ST_INIT = `{ yoko: { 1: false, 2: false } }`;
module.exports = {
    file: 'tsunatorigo.html',
    en: 'TSUNATORIGO',
    jp: '綱取碁',
    prefix: 'tsunatorigo',
    desc: '1手で5個以上の敵石を取る大一番に勝てば横綱の称号 — 終局時+3目。',
    kind: 'stone',
    icon: 'tsunatorigo',
    spec: [
        ...K.rb('TSUNATORIGO', '綱取碁', 'tsunatorigo'),
        K.params([
            { key: 'oichii_min', label: '大一番に必要な取り数', min: 2, max: 12, def: 5, unit: '個' },
            { key: 'yoko_bonus', label: '横綱の終局ボーナス', min: 1, max: 10, def: 3, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        ...ST(ST_INIT),
        // 綱取り: 1手5個取りの大一番で横綱昇進
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 綱取碁: 大一番 (1手で5個以上取り) に勝つと横綱の称号
            if (!st.yoko[player] && captured.length >= (P('oichii_min') || 5)) {
                st.yoko[player] = true;
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '横綱!', '#fbbf24', 1600);
                fxBurst(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '#fbbf24', 18, 2.4);
            }

            turn = opponent;`],
        [K.ONE, `        function endGameByScore() {`,
`        // 綱取の称号: 横綱は終局時+3目
        function yokoBonus(player) {
            return st.yoko[player] ? (P('yoko_bonus') || 3) : 0;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + yokoBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + yokoBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>横綱の称号:</span> <strong>黒 \${st.yoko[1] ? '横綱(+3)' : '—'} / 白 \${st.yoko[2] ? '横綱(+3)' : '—'}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            綱取碁: 1手で5個以上の敵石を取る大一番に勝てば横綱の称号 — 終局時+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '綱取り: 1手で5個以上の敵石を取る大一番に勝つと横綱に昇進し、終局時+3目。',
            '大きな連を養って一気に取るか、バラけて逃がすかの駆け引き。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures[1] = 0; captures[2] = 0;
        st.yoko = { 1: false, 2: false };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 白の5連を取り囲む黒: 白石 (3..7,4) を黒で上下左右に囲み (4,3) で完成
        for (let x = 3; x <= 7; x++) board[4 * BOARD_SIZE + x] = 2;
        for (let x = 3; x <= 7; x++) { board[3 * BOARD_SIZE + x] = 1; board[5 * BOARD_SIZE + x] = 1; }
        board[4 * BOARD_SIZE + 2] = 1; board[4 * BOARD_SIZE + 8] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 既に呼吸0 — 大一番
        assert('5個取りで横綱昇進', st.yoko[1] === true && captures[1] === 5);
        assert('横綱は+3目', yokoBonus(1) === 3);
        assert('白はまだ平幕', st.yoko[2] === false && yokoBonus(2) === 0);
    `,
};
