// JUDOGO — 柔道碁: 単石を取られた側は巴投げ — 隣の取り手の石を1個投げ飛ばして取り返す
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
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
module.exports = {
    file: 'judogo.html',
    en: 'JUDOGO',
    jp: '柔道碁',
    prefix: 'judogo',
    desc: '単石を取られた側は巴投げ — 取った側の隣の石を1個投げ飛ばして取り返す。',
    kind: 'stone',
    icon: 'judogo',
    spec: [
        ...K.rb('JUDOGO', '柔道碁', 'judogo'),
        ...ST('{ thrown: 0 }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 柔道碁: 単石を取られた側は巴投げで隣の取り手石を1個投げて取り返す
            {
                if (captured.length === 1) {
                    const spot = captured[0];
                    const grab = getNeighbors(spot).find(n => board[n] === player && n !== (move.cells[0].y * BOARD_SIZE + move.cells[0].x));
                    const grabTarget = grab !== undefined ? grab : getNeighbors(spot).find(n => board[n] === player);
                    if (grabTarget !== undefined) {
                        board[grabTarget] = 0;
                        captures[opponent]++;
                        st.thrown++;
                        fxBurst(grabTarget, '#60a5fa', 14);
                        fxText(grabTarget, '巴投げ', '#3b82f6', 1200);
                        fxShake();
                    }
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC('"巴投げ " + (st.thrown || 0) + "本"'),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            柔道碁: 単石を取られた側は巴投げ — 取った側の隣の石を1個投げて取り返す<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '単石の連を取ると、取られた側は巴投げ — 取った側の隣の石を1個投げ飛ばして自分のアゲハマにする。',
            '単石取りは1対1交換になりやすい — 大連を取るほうが得。',
            '投げられない場所から取るのが上手い組み合い。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st = { thrown: 0 };
        board[I(1, 1)] = 2;
        board[I(0, 1)] = 1; board[I(1, 0)] = 1; board[I(1, 2)] = 1;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1); // 単石を取る → 巴投げ
        assert('単石は取られる', board[I(1, 1)] === 0);
        assert('巴投げで取り手が飛ぶ', captures[2] === 1);
        assert('取りも1個は残る', captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 2) === true);
    `,
};
