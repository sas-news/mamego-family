// GOTEGO — 後手碁: 受けの碁。アタリの自軍連を救い出す「応手」で +2目 (後手の白は +3目)
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
    file: 'gotego.html',
    en: 'GOTEGO',
    jp: '後手碁',
    prefix: 'gotego',
    desc: '受けの碁: アタリにされた自軍連を繋いで救う「応手」で +2目 (後手の白は +3目)。',
    kind: 'stone',
    icon: 'gotego',
    spec: [
        ...K.rb('GOTEGO', '後手碁', 'gotego'),
        ...ST(ST_INIT),
        // 応手ボーナス: アタリだった自軍連を呼吸2以上に救出 → +2 (白は後手救済で +3)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 後手碁: アタリだった自軍連に繋いで救出すると応手ボーナス
            {
                const __pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const __pre = history.length > 0 ? history[history.length - 1].board : board;
                let __rescued = false;
                getNeighbors(__pi).forEach(__n => {
                    if (__pre[__n] === player && getLiberties(__pre, __n) <= 1) __rescued = true;
                });
                if (__rescued && getLiberties(board, __pi) >= 2) {
                    const __g = player === 2 ? 3 : 2; // 後手の白は+3目
                    st.bonus[player] = (st.bonus[player] || 0) + __g;
                    fxText(__pi, '応手 +' + __g, '#34d399', 1100);
                    fxGlow(__pi, '#34d399', 800);
                }
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        [K.ONE, K.INFO_ALGO, `            後手碁: アタリの連を救う応手で +2目 (白は+3目)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '受けに回った側が報われる碁。アタリ (呼吸点1) にされた自軍連へ繋いで救出すると +2目。',
            '常に後手の白は +3目 — 粘り強く受ければ逆転できる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 } };
        // 黒(4,4)を白3石で呼吸1に追い込む
        board[4 * BOARD_SIZE + 4] = 1;
        board[3 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 3] = 2; board[5 * BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 応手で救出
        assert('応手で+2目', st.bonus[1] === 2);
        // 白も同じ形で救出 → 後手救済で+3
        board.fill(0); st.bonus = { 1: 0, 2: 0 };
        board[7 * BOARD_SIZE + 7] = 2;
        board[6 * BOARD_SIZE + 7] = 1; board[7 * BOARD_SIZE + 6] = 1; board[8 * BOARD_SIZE + 7] = 1;
        executeMove({ cells: [{ x: 8, y: 7 }] }, 2);
        assert('白の応手は+3目', st.bonus[2] === 3);
    `,
};
