// FUHYOGO — 歩兵碁: 敵陣2列に進んだ歩は「成」って +1目。成駒は取られても1手延命する
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 }, promo: {} }`;
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
    file: 'fuhyogo.html',
    en: 'FUHYOGO',
    jp: '歩兵碁',
    prefix: 'fuhyogo',
    desc: '敵陣2列に進んだ歩は成って +1目。成駒は取られても盤に残り、1手の猶予で助けられる。',
    kind: 'stone',
    icon: 'fuhyogo',
    spec: [
        ...K.rb('FUHYOGO', '歩兵碁', 'fuhyogo'),
        ...ST(ST_INIT),
        // 成駒は最初の取りで死なない (成りが剥がれて盤に残る)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent).filter(__i => {
                // 歩兵碁: 成駒は取り1回目は成りが剥がれて生き残る
                if (st.promo[__i]) { delete st.promo[__i]; return false; }
                return true;
            });
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 敵陣2列で成る: +1目 & 成駒印
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 歩兵碁: 敵陣2列 (黒は下2列・白は上2列) に打つと成駒 +1目
            {
                const __p = move.cells[0];
                const __pi = __p.y * BOARD_SIZE + __p.x;
                const __zone = player === 1 ? (__p.y >= BOARD_SIZE - 2) : (__p.y <= 1);
                if (__zone && !st.promo[__pi]) {
                    st.promo[__pi] = 1;
                    st.bonus[player] = (st.bonus[player] || 0) + 1;
                    fxText(__pi, '成 +1', '#fbbf24', 1000);
                    fxGlow(__pi, '#fbbf24', 700);
                }
            }

            turn = opponent;`],
        // 成駒マーク: 金色の小さな王冠ドット
        ...K.STONE_MARKS_SPEC(`            for (const __k of Object.keys(st.promo || {})) {
                const __i = Number(__k);
                if (board[__i] === 0) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                ctx.save();
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(__cx, __cy, cellSize * 0.11, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        [K.ONE, K.INFO_ALGO, `            歩兵碁: 敵陣2列で成駒 +1目。成駒は取られても1手延命<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵陣2列 (黒は下・白は上) に歩を進めると「成」って +1目。',
            '成駒は取られても成りが剥がれて盤に残る — 次の手で助ければ生き残る、金将のような粘り。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, promo: {} };
        executeMove({ cells: [{ x: 5, y: BOARD_SIZE - 1 }] }, 1); // 黒が最下段で成る
        assert('敵陣で成駒+1', st.bonus[1] === 1 && st.promo[5 + (BOARD_SIZE - 1) * BOARD_SIZE] === 1);
        executeMove({ cells: [{ x: 5, y: 0 }] }, 2); // 白が最上段で成る
        assert('白も敵陣で成る', st.bonus[2] === 1);
        // 成駒の延命: 白(5,0)を黒で囲み取りを試みる → 成りが剥がれて生き残る
        board[1 * BOARD_SIZE + 5] = 1; board[4 * BOARD_SIZE + 1] = 1; // (5,0)の残り呼吸点を塞ぐ盤面…(5,0)の呼吸は(4,0),(6,0),(5,1)
        board[4 * BOARD_SIZE + 0] = 1; board[6 * BOARD_SIZE + 0] = 1;
        executeMove({ cells: [{ x: 5, y: 1 }] }, 1); // これで白(5,0)は呼吸0だが成駒 → 延命
        assert('成駒は1度目の取りで延命', board[0 * BOARD_SIZE + 5] === 2 && captures[1] === 0);
    `,
};
