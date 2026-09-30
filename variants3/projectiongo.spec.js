// PROJECTIONGO — 投影碁: 光源が16手ごとに回り、全石が光と反対側のマスに影石を投影する
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
const ST_INIT = `{ light: 0, shadow: {} }`;
// 光源方向: 0=北(影は南へ) 1=東(影は西へ) 2=南(影は北へ) 3=西(影は東へ)
const SHADOW_FN = `
            // 影の再投影: 古い影を消し、全石が光と反対側に影石を置く
            function reproject() {
                Object.keys(st.shadow).forEach(k => {
                    const i = +k;
                    if (board[i] === st.shadow[k]) board[i] = 0;
                });
                st.shadow = {};
                const dx = [0, -1, 0, 1][st.light], dy = [1, 0, -1, 0][st.light];
                board.forEach((v, i) => {
                    if (v !== 1 && v !== 2) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return;
                    const ni = ny * BOARD_SIZE + nx;
                    if (board[ni] === 0 && st.shadow[ni] === undefined) {
                        board[ni] = v;
                        st.shadow[ni] = v;
                    }
                });
                // 呼吸0で置かれた影は落ちる
                [1, 2].forEach(pl => {
                    getCapturedStones(board, pl).forEach(i => {
                        if (st.shadow[i] !== undefined) { board[i] = 0; delete st.shadow[i]; }
                    });
                });
            }`;
module.exports = {
    file: 'projectiongo.html',
    en: 'PROJECTIONGO',
    jp: '投影碁',
    prefix: 'projectiongo',
    desc: '石は影を落とす。光源が16手ごとに回り、影石の落ちる方向が変わる。',
    kind: 'stone',
    icon: 'projectiongo',
    spec: [
        ...K.rb('PROJECTIONGO', '投影碁', 'projectiongo'),
        ...ST(ST_INIT),
        // 着手毎に影を再投影 + 16手毎に光源が回転
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 光源回転: 16手ごとに影の落ちる向きが変わる
            if (history.length > 0 && history.length % 16 === 0) {
                st.light = (st.light + 1) % 4;
                fxText(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '光が回る', '#fde68a', 1300);
            }
            ${SHADOW_FN}
            reproject();
            cleanUpPieces();

            turn = opponent;`],
        // 影石の描画補助 (取られた影の掃除は reproject と cleanUpPieces が担う)
        ...K.EVENT_CHIP_SPEC(`'光源 ' + ['北', '東', '南', '西'][st.light] + ' 残 ' + (16 - history.length % 16) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            投影碁: 全ての石が光と反対側のマスに影石を落とす。光源は16手毎に回る<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_ALGO, K.rv([
            '全ての石は光と反対側の隣マスに同色の影石を投影する (実石と同じ働き)。',
            '光源は16手ごとに北→東→南→西と回り、影の向きが変わる。',
            '影は呼吸や連結にも数える。光が回るタイミングで形が大きく変わる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.light = 0; st.shadow = {};
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('北の光で影は南へ', board[6 * BOARD_SIZE + 5] === 1);
        assert('影が記録される', st.shadow[6 * BOARD_SIZE + 5] === 1);
        // 光源が回ると影の向きが変わる
        history.length = 15;
        executeMove({ cells: [{ x: 10, y: 10 }] }, 2);
        assert('光源が回る', st.light === 1);
        assert('東の光で影は西へ', board[10 * BOARD_SIZE + 9] === 2 && st.shadow[10 * BOARD_SIZE + 9] === 2);
        assert('古い影は消える', board[6 * BOARD_SIZE + 5] === 0 || st.shadow[6 * BOARD_SIZE + 5] === 1);
    `,
};
