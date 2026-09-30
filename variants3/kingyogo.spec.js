// KINGYOGO — 金魚碁: 石は金魚。掬い網の強さを超える大きさの連は獲りきれず、余った金魚は逃げ出す
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
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
const ST_INIT = `{ net: { 1: 4, 2: 4 }, pcnt: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'kingyogo.html',
    en: 'KINGYOGO',
    jp: '金魚碁',
    prefix: 'kingyogo',
    desc: '石は金魚。網の強さを超える連は獲りきれず、余った分は逃げ出す。網は5手ごとに強化。',
    kind: 'stone',
    icon: 'kingyogo',
    spec: [
        ...K.rb('KINGYOGO', '金魚碁', 'kingyogo'),
        ...ST(ST_INIT),

        // 掬い: 網の強さ分だけしか獲れない — 余った金魚は逃げて盤に残る
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                const cap = Math.min(captured.length, st.net[player]);
                captured.slice(0, cap).forEach(idx => { board[idx] = 0; captures[player]++; });
                const escaped = captured.length - cap;
                if (escaped > 0) {
                    const pi0 = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxSplash(pi0, '#38bdf8', 10);
                    fxText(pi0, escaped + '匹逃げた!', '#38bdf8', 1200);
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 金魚碁: 5手ごとに自分の網が強化される (最大12)
            st.pcnt[player]++;
            if (st.pcnt[player] % 5 === 0 && st.net[player] < 12) {
                st.net[player]++;
                const pi1 = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxGlow(pi1, '#38bdf8', 800);
                fxText(pi1, '網強化!', '#38bdf8', 1100);
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'網強度 ' + (st.net[turn] || 0)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            金魚碁: 石は金魚。自分の網の強さを超える連は獲りきれず、余った金魚は逃げて盤に残る。網は5手ごとに強化<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は金魚。敵の連を囲んでも、自分の「網の強さ」までの数しか掬えない。余った金魚は逃げて盤に残る。',
            '網は最初の強さ4。自分の着手5回ごとに+1強化される (最大12)。',
            '大きな連を獲るには網を育ててから。逃げた金魚は相手の石として残る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.net = { 1: 2, 2: 4 }; st.pcnt = { 1: 0, 2: 0 };
        // 白3連を囲む → 網2なら2匹だけ掬えて1匹逃げる
        board[4 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 5] = 2; board[3 * BOARD_SIZE + 4] = 2;
        board[3 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 5] = 1;
        board[2 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // 最後の呼吸点を塞ぐ
        assert('網の強さ分だけ獲れる', captures[1] === 2);
        assert('余った金魚は逃げて1匹残る', [3 * BOARD_SIZE + 4, 4 * BOARD_SIZE + 4, 4 * BOARD_SIZE + 5].filter(i => board[i] === 2).length === 1);
        // 5手で網強化
        st.pcnt[1] = 4;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('5手目で網が強化', st.net[1] === 3);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
