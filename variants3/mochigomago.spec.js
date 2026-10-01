// MOCHIGOMAGO — 持駒碁: 取った石は持駒になり、「持駒打ち」で手番を消費せず打てる
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
const ST_INIT = `{ mochi: { 1: 0, 2: 0 }, dropArm: 0, dropped: {} }`;
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
    file: 'mochigomago.html',
    en: 'MOCHIGOMAGO',
    jp: '持駒碁',
    prefix: 'mochigomago',
    desc: '取った石は持駒。「持駒打ち」で手番を消費せず空点に打てる (連続で打てる強い手)。',
    kind: 'stone',
    icon: 'mochigomago',
    spec: [
        ...K.rb('MOCHIGOMAGO', '持駒碁', 'mochigomago'),
        ...ST(ST_INIT),
        // 取り石は持駒ストックにも加算
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                st.mochi[player] = (st.mochi[player] || 0) + captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 持駒打ち: 武装中の着手は手番を消費しない (持駒を1枚消費)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 持駒碁: 持駒打ちモードの着手は持駒を消費して手番を渡さない
            if (st.dropArm === player) {
                st.mochi[player] = (st.mochi[player] || 0) - 1;
                st.dropArm = 0;
                const __di = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.dropped[__di] = 1;
                fxText(__di, '持駒打ち', '#fbbf24', 1000);
                fxGlow(__di, '#fbbf24', 700);
            } else {
                turn = opponent;
            }`],
        // 「持駒打ち」ボタン → 次のクリック着手が手番を消費しない
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnMochi" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-amber-500/50 text-amber-600 rounded-xl hover:bg-amber-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                持駒打ち
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnMochi = document.getElementById('btnMochi');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnMochi.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if ((st.mochi[turn] || 0) <= 0) return;
            st.dropArm = st.dropArm === turn ? 0 : turn;
            render();
            updateUI();
        });`],
        // 持駒で打った石には金色の小点
        ...K.STONE_MARKS_SPEC(`            for (const __k of Object.keys(st.dropped || {})) {
                const __i = Number(__k);
                if (board[__i] === 0) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                ctx.save();
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(__cx, __cy, cellSize * 0.09, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.dropArm ? '持駒打ちモード' : ((st.mochi[turn] || 0) > 0 ? '持駒' + st.mochi[turn] + '枚' : '')`),
        [K.ONE, K.INFO_ALGO, `            持駒碁: 取った石は持駒。「持駒打ち」ボタンで手番を消費せず打てる<br>
            PC: クリックで配置 / 「持駒打ち」→空点をクリック<br>
            スマホ: 同様にボタン→点をタップ`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵石を取ると持駒として手元に溜まる (アゲハマにもそのまま数える)。',
            '「持駒打ち」ボタンで持駒を1枚消費し、次の着手を手番消費なしで打てる — 連続で打てる強い手。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { mochi: { 1: 0, 2: 0 }, dropArm: 0, dropped: {} };
        // 白(4,4)を呼吸1にして黒が取る → 持駒+1
        board[4 * BOARD_SIZE + 4] = 2;
        board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1; board[5 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 白(4,4)の最後の呼吸点を塞いで取る
        assert('取り石が持駒になる', st.mochi[1] === 1);
        // 持駒打ち: 手番を消費しない (黒の手番で武装→着手→黒の手番のまま)
        turn = 1; st.dropArm = 1;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1);
        assert('持駒を消費する', st.mochi[1] === 0);
        assert('持駒打ちは手番を渡さない', turn === 1);
        assert('持駒打ちの石が盤面に置かれる', board[8 * BOARD_SIZE + 8] === 1);
    `,
};
