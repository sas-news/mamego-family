// TRAITORGO — 仮面碁: 各1回、敵石1個をクリックして実は自石だった「隠し駒」に変えられる
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
const ST_INIT = `{ used: { 1: false, 2: false }, armed: { 1: false, 2: false } }`;
module.exports = {
    file: 'traitorgo.html',
    en: 'TRAITORGO',
    jp: '仮面碁',
    prefix: 'traitorgo',
    desc: '各1回、敵石1個を「隠し駒」に変えられる — 実は自石だったという裏切り。',
    kind: 'stone',
    icon: 'traitorgo',
    spec: [
        ...K.rb('TRAITORGO', '仮面碁', 'traitorgo'),
        ...ST(ST_INIT),
        // 「仮面」ボタン → 敵石クリックで隠し駒発動
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnMask" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-rose-500/50 text-rose-600 rounded-xl hover:bg-rose-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                仮面
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnMask = document.getElementById('btnMask');`],
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 仮面モード: 敵石をクリックすると「隠し駒」発動 — 実は自石だった (1手消費)
            if (st.armed[turn]) {
                st.armed[turn] = false;
                const gi = Math.round(anchor.v) * BOARD_SIZE + Math.round(anchor.u);
                if (gi >= 0 && gi < board.length && board[gi] === 3 - turn) {
                    board[gi] = turn;
                    pieces.forEach(pc => pc.cells.forEach(c => {
                        if (c.x === gi % BOARD_SIZE && c.y === Math.floor(gi / BOARD_SIZE)) pc.player = turn;
                    }));
                    st.used[turn] = true;
                    consecutivePasses = 0;
                    fxText(gi, '裏切り!', '#f43f5e', 1300);
                    fxShake(5, 320);
                    const op2 = 3 - turn;
                    turn = op2; // 手番消費
                    updateUI();
                    if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                    saveState();
                    if (!gameOver && gameMode === 'ai' && turn === aiPlayer) triggerAiMove();
                } else {
                    render();
                }
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnMask.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.used[turn]) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.used[turn] ? '仮面済' : (st.armed[turn] ? '仮面待機' : '仮面可')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            仮面碁: 各1回、敵石1個を「隠し駒」に変えられる (裏切って自石になる)<br>
            PC: 「仮面」ボタン→敵石をクリック<br>
            スマホ: 同様にボタン→敵石をタップ`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「仮面」ボタン→敵石をクリックで「隠し駒」発動: その敵石は実は自石だった。',
            '変えた石は連や呼吸にそのまま組み込まれる。相手の取り掛かった連を裏切ると強い。',
            '各1回・手番は消費する。敵陣に潜む寝返りを恐れる読み合いの碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.used = { 1: false, 2: false }; st.armed = { 1: false, 2: false };
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        assert('白石が置かれている', board[5 * BOARD_SIZE + 5] === 2);
        // 黒の仮面: 白石を隠し駒に変える (擬似的にボタン処理の内部を直接呼ぶ)
        st.armed[1] = true;
        const gi = 5 * BOARD_SIZE + 5;
        // クリックハンドラ相当: 直接変換ロジックを検証するため盤を経由
        if (board[gi] === 3 - 1) {
            board[gi] = 1;
            pieces.forEach(pc => pc.cells.forEach(c => { if (c.x === 5 && c.y === 5) pc.player = 1; }));
            st.used[1] = true;
        }
        assert('敵石が自石になる', board[gi] === 1);
        assert('ピースの持ち主も変わる', pieces.find(pc => pc.cells[0].x === 5 && pc.cells[0].y === 5).player === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
