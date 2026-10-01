// TSUMEGO — 詰碁: 相手連へのアタリを3連続でかけ続ける「詰み」で即勝ち
const K = require('../gen_kit.js');
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
const ST_INIT = `{ chain: { 1: 0, 2: 0 } }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tsumego.html',
    en: 'TSUMEGO',
    jp: '詰碁',
    prefix: 'tsumego',
    desc: 'アタリを3連続でかけ続ける「詰み」の連鎖を完成させると即勝ち。',
    kind: 'stone',
    icon: 'tsumego',
    spec: [
        ...K.rb('TSUMEGO', '詰碁', 'tsumego'),
        K.params([
            { key: 'tsume_len', label: '詰みに必要な連続アタリ', min: 2, max: 6, def: 3, unit: '連' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        ...ST(ST_INIT),
        // 詰み判定: 自分の着手でアタリを3連続かける → 即勝ち
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 詰碁: 着手で相手連をアタリ (呼吸1) にする手を3連続でかけると詰み勝ち
            {
                const __pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                let __atari = false;
                const __seenG = new Set();
                getNeighbors(__pi).forEach(__n => {
                    if (board[__n] !== opponent) return;
                    const __q = [__n]; const __seen = new Set([__n]); let __root = __n;
                    while (__q.length > 0) {
                        const __c = __q.shift();
                        if (__c < __root) __root = __c;
                        getNeighbors(__c).forEach(__m => {
                            if (board[__m] === opponent && !__seen.has(__m)) { __seen.add(__m); __q.push(__m); }
                        });
                    }
                    if (!__seenG.has(__root)) {
                        __seenG.add(__root);
                        if (getLiberties(board, __root) <= 1) __atari = true;
                    }
                });
                if (__atari) {
                    st.chain[player] = (st.chain[player] || 0) + 1;
                    fxText(__pi, '詰み ×' + st.chain[player], '#f87171', 1000);
                    if (st.chain[player] >= (P('tsume_len') || 3)) {
                        fxBurst(__pi, '#ef4444', 20, 2.0);
                        winByRule(player, '詰み勝ち', 'アタリの3連連鎖で詰みました');
                        return;
                    }
                } else {
                    st.chain[player] = 0;
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`(st.chain[turn] || 0) > 0 ? '詰み ×' + st.chain[turn] : ''`),
        [K.ONE, K.INFO_ALGO, `            詰碁: アタリを3連続でかけると詰み勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の着手で相手の連をアタリにする手を3連続でかけると「詰み」で即勝ち。',
            '追い回しが途切れたら連鎖は切れる — 詰めろをかけ続ける碁。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; gameOver = false;
        st = { chain: { 1: 0, 2: 0 } };
        // 白(4,4)と白(9,9)をそれぞれ呼吸2にしておく
        board[4 * BOARD_SIZE + 4] = 2; board[9 * BOARD_SIZE + 9] = 2;
        board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1;
        board[8 * BOARD_SIZE + 9] = 1; board[9 * BOARD_SIZE + 8] = 1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // アタリ1連目
        assert('アタリで連鎖1', st.chain[1] === 1);
        executeMove({ cells: [{ x: 10, y: 9 }] }, 1); // 別の白連へアタリ2連目
        assert('連続アタリで連鎖2', st.chain[1] === 2);
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1); // (4,4)を取る → 隣接敵連なしで連鎖切れ
        assert('取る手はアタリでないので連鎖リセット', st.chain[1] === 0);
    `,
};
