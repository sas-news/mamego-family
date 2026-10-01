// TESUJIGO — 手筋碁: 手筋 (アタリ作成・自軍連の連結) で効果ボーナス
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 } }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tesujigo.html',
    en: 'TESUJIGO',
    jp: '手筋碁',
    prefix: 'tesujigo',
    desc: '手筋が効く碁: 相手連をアタリにする手は +2目、自軍連同士を繋ぐ手は +1目。',
    kind: 'stone',
    icon: 'tesujigo',
    spec: [
        ...K.rb('TESUJIGO', '手筋碁', 'tesujigo'),
        ...ST(ST_INIT),
        // 手筋判定: アタリ手筋 +2 / 連結手筋 +1
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 手筋碁: 相手連をアタリ (呼吸1) にする手は +2目、自軍の2連以上を繋ぐ手は +1目
            {
                const __pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const __oppGroups = new Set();
                const __ownGroups = new Set();
                getNeighbors(__pi).forEach(__n => {
                    if (board[__n] === opponent) __oppGroups.add(__n);
                    else if (board[__n] === player) __ownGroups.add(__n);
                });
                let __atari = 0;
                const __seenG = new Set();
                __oppGroups.forEach(__n => {
                    // 連の代表 (最小idx) で重複を避ける
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
                        if (getLiberties(board, __root) <= 1) __atari++;
                    }
                });
                if (__atari > 0) {
                    st.bonus[player] = (st.bonus[player] || 0) + 2;
                    fxText(__pi, 'アタリ手筋 +2', '#f87171', 1100);
                    fxGlow(__pi, '#f87171', 800);
                } else if (__ownGroups.size >= 2) {
                    st.bonus[player] = (st.bonus[player] || 0) + 1;
                    fxText(__pi, '連結手筋 +1', '#38bdf8', 1000);
                }
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        [K.ONE, K.INFO_ALGO, `            手筋碁: アタリにする手 +2目、自軍連を繋ぐ手 +1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '筋の良い置き方が報われる碁。',
            '着手で相手の連をアタリ (呼吸点1) にすると +2目。自軍の2つ以上の連を繋ぐと +1目。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 } };
        // 白石(4,4)の呼吸点を2つに絞り、黒が着手 → アタリ手筋
        board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1;
        board[4 * BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 白連の呼吸点を1つに削る → アタリ
        assert('アタリ手筋で+2目', st.bonus[1] === 2);
        // 連結手筋: 離れた黒2連を橋渡し
        board.fill(0); st.bonus = { 1: 0, 2: 0 };
        board[2 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 3, y: 2 }] }, 1); // 2つの黒石を接続
        assert('連結手筋で+1目', st.bonus[1] === 1);
    `,
};
