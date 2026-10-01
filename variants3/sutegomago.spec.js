// SUTEGOMAGO — 捨駒碁: 「捨駒」ボタンで印を付けた石は、取られたとき隣の弱い敵連を道連れにする
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
const ST_INIT = `{ sute: {}, suteArm: 0 }`;
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
    file: 'sutegomago.html',
    en: 'SUTEGOMAGO',
    jp: '捨駒碁',
    prefix: 'sutegomago',
    desc: '「捨駒」ボタンで次の石に印 — 取られたとき隣の呼吸1以下の敵連を道連れにする。',
    kind: 'stone',
    icon: 'sutegomago',
    spec: [
        ...K.rb('SUTEGOMAGO', '捨駒碁', 'sutegomago'),
        K.params([
            { key: 'sute_lib', label: '捨駒の呼吸点上限', min: 0, max: 3, def: 1, hint: 'この呼吸点数以下の連が根付く' },
        ]),
        ...ST(ST_INIT),
        // 捨駒が取られたら道連れ: 隣接する呼吸1以下の敵連も取り除く
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            const suteList = st.sute ? captured.filter(__i => st.sute[__i]) : [];
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 捨駒効果: 取られた捨駒に隣接する呼吸1以下の敵連を道連れにする
                suteList.forEach(__i => {
                    delete st.sute[__i];
                    const __dead = new Set();
                    getNeighbors(__i).forEach(__n => {
                        if (board[__n] !== player) return;
                        const __q = [__n]; const __seen = new Set([__n]); let __root = __n;
                        while (__q.length > 0) {
                            const __c = __q.shift();
                            if (__c < __root) __root = __c;
                            getNeighbors(__c).forEach(__m => {
                                if (board[__m] === player && !__seen.has(__m)) { __seen.add(__m); __q.push(__m); }
                            });
                        }
                        if (getLiberties(board, __root) <= (P('sute_lib') ?? 1)) __seen.forEach(__c => __dead.add(__c));
                    });
                    if (__dead.size > 0) {
                        __dead.forEach(__c => { if (board[__c] === player) { board[__c] = 0; captures[opponent]++; } });
                        fxBurst(__i, '#f87171', 14, 1.8);
                        fxText(__i, '捨駒!', '#f87171', 1200);
                    }
                });
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 捨駒印を付ける (武装中の着手)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 捨駒碁: 捨駒モードの着手は石に「捨」印を付ける
            if (st.suteArm === player) {
                st.suteArm = 0;
                const __si = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.sute[__si] = 1;
                fxText(__si, '捨', '#f87171', 1000);
            }

            turn = opponent;`],
        // 「捨駒」ボタン → 次の着手に道連れ印を付ける
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnSute" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-red-500/50 text-red-600 rounded-xl hover:bg-red-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                捨駒
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnSute = document.getElementById('btnSute');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnSute.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.suteArm = st.suteArm === turn ? 0 : turn;
            render();
            updateUI();
        });`],
        // 捨駒印: 石の上に赤い小さな×印
        ...K.STONE_MARKS_SPEC(`            for (const __k of Object.keys(st.sute || {})) {
                const __i = Number(__k);
                if (board[__i] === 0) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                const __r = cellSize * 0.12;
                ctx.save();
                ctx.strokeStyle = '#f87171';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                ctx.beginPath();
                ctx.moveTo(__cx - __r, __cy - __r); ctx.lineTo(__cx + __r, __cy + __r);
                ctx.moveTo(__cx + __r, __cy - __r); ctx.lineTo(__cx - __r, __cy + __r);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.suteArm ? '捨駒モード' : ''`),
        [K.ONE, K.INFO_ALGO, `            捨駒碁: 「捨駒」ボタンで次の石に道連れ印。取られると隣の弱い敵連も死ぬ<br>
            PC: クリックで配置 / 「捨駒」→着手<br>
            スマホ: 同様にボタン→着手`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「捨駒」ボタンで次の着手に印を付ける。印の石は取られてもよい覚悟の捨て石。',
            '印の石が取られたとき、その隣にいる呼吸1以下の敵連も道連れで取り返す。',
            'わざと取らせて大筋を取る — 捨駒戦術の碁。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { sute: {}, suteArm: 0 };
        // 黒の捨駒(4,4)を白が囲んで取る。隣の白(4,3)は黒に包まれて捨駒の死後に呼吸1になる
        board[4 * BOARD_SIZE + 4] = 1; st.sute[4 * BOARD_SIZE + 4] = 1;
        board[4 * BOARD_SIZE + 3] = 2; board[5 * BOARD_SIZE + 4] = 2; // (3,4)(5,4)の白
        board[3 * BOARD_SIZE + 4] = 2; // (4,3)の白…周囲は黒で固める
        board[2 * BOARD_SIZE + 4] = 1; board[3 * BOARD_SIZE + 3] = 1; board[3 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 2); // 白が捨駒の最後の呼吸点を塞いで取る
        assert('捨駒が取られる', board[4 * BOARD_SIZE + 4] === 0 && captures[2] === 1);
        assert('道連れで呼吸1の敵連も死ぬ', board[3 * BOARD_SIZE + 4] === 0 && captures[1] === 1);
        assert('他の白連は生き残る', board[4 * BOARD_SIZE + 3] === 2 && board[5 * BOARD_SIZE + 4] === 2);
        // 捨駒モードで着手すると印が付く
        st.suteArm = 1;
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1);
        assert('捨駒印が付く', st.sute[9 * BOARD_SIZE + 9] === 1);
    `,
};
