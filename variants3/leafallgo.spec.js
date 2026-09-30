// LEAFALLGO — 落葉碁: 30手ごとに秋が来て、連なった石は幹の1個を残して葉が落ちる
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
const ST_INIT = `{ fall: 0 }`;
module.exports = {
    file: 'leafallgo.html',
    en: 'LEAFALLGO',
    jp: '落葉碁',
    prefix: 'leafallgo',
    desc: '30手ごとに秋。連なった石 (同じ色のグループ) は幹の1個を残して葉が落ちる。',
    kind: 'stone',
    icon: 'leafallgo',
    spec: [
        ...K.rb('LEAFALLGO', '落葉碁', 'leafallgo'),
        ...ST(ST_INIT),
        // 秋: 30手毎に各グループの最初の石だけ残して葉が落ちる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 秋: 30手毎に葉が落ちる (各連結グループの最初の石=幹だけ残る)
            if (history.length > 0 && history.length % 30 === 0) {
                const seen = Array(board.length).fill(false);
                let fell = 0;
                for (let i = 0; i < board.length; i++) {
                    const p = board[i];
                    if ((p !== 1 && p !== 2) || seen[i]) continue;
                    // グループを flood fill: 先頭 (幹) 以外を落とす
                    const stack = [i];
                    seen[i] = true;
                    let first = true;
                    while (stack.length) {
                        const c = stack.pop();
                        if (first) { first = false; }
                        else { board[c] = 0; fxBurst(c, '#d97706', 5, 1.0); fell++; }
                        getNeighbors(c).forEach(n => {
                            if (!seen[n] && board[n] === p) { seen[n] = true; stack.push(n); }
                        });
                    }
                }
                if (fell > 0) {
                    st.fall += fell;
                    fxText(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '落葉!', '#d97706', 1400);
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'落葉 ' + st.fall`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            落葉碁: 30手ごとに秋が来て、連なった石は1個 (幹) を残して落ちる<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_ALGO, K.rv([
            '30手ごとに秋が来る: 同じ色で連なったグループは、最初の1個 (幹) だけ残して全て落ちる。',
            '大きく繋げるほど秋の損失が大きい。小さな石を散らすか、秋までに取るか。',
            '落ちた石は取りにもならず、そのまま消える。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.fall = 0;
        // 黒の連結グループ 3個 + 孤立 1個
        [[5, 5], [6, 5], [7, 5], [10, 10]].forEach(([x, y]) => {
            board[y * BOARD_SIZE + x] = 1;
            pieces.push({ p: 1, cells: [{ x, y }] });
        });
        history.length = 29;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        const blackLeft = board.filter(v => v === 1).length;
        assert('連結3個は幹1個に', board[5 * BOARD_SIZE + 5] === 1);
        assert('幹+孤立+新規で石が残る', blackLeft === 2);
        assert('落葉数が記録される', st.fall === 2);
        assert('手番は交代', turn === 1);
    `,
};
