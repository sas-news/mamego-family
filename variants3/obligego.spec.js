// OBLIGEGO — 返礼碁: 石を取られると「返礼権」を得る。権利+1手で敵石1個を引き取れる
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
const ST_INIT = `{ gift: { 1: 0, 2: 0 }, armed: { 1: false, 2: false } }`;
module.exports = {
    file: 'obligego.html',
    en: 'OBLIGEGO',
    jp: '返礼碁',
    prefix: 'obligego',
    desc: '取られた側は返礼権を得る。権利+1手で敵石1個を引き取れる。',
    kind: 'stone',
    icon: 'obligego',
    spec: [
        ...K.rb('OBLIGEGO', '返礼碁', 'obligego'),
        ...ST(ST_INIT),
        // 取られた側に返礼権が発生 (捕獲イベントごとに1権)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                st.gift[opponent]++; // 返礼権: 取られた側に付与
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '返礼権+1', '#fb7185', 1100);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 「返礼」ボタン → 敵石クリックで引き取り (返礼権1個+1手を消費)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnGift" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-rose-500/50 text-rose-600 rounded-xl hover:bg-rose-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                返礼
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnGift = document.getElementById('btnGift');`],
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 返礼モード: 敵石をクリックして引き取る (返礼権1個+1手を消費)
            if (st.armed[turn]) {
                st.armed[turn] = false;
                const gi = Math.round(anchor.v) * BOARD_SIZE + Math.round(anchor.u);
                if (gi >= 0 && gi < board.length && board[gi] === (turn === 1 ? 2 : 1) && st.gift[turn] > 0) {
                    const p = turn;
                    history.push({
                        board: [...board],
                        pieces: pieces.map(pc => ({ ...pc, cells: pc.cells.map(q => ({ ...q })) })),
                        captures: { ...captures },
                        turn,
                        consecutivePasses,
                        prevBoard,
                        lastMove,
                        currentPieceType,
                        pieceQueue: [...pieceQueue],
                        heldPieces: { ...heldPieces },
                        st: JSON.parse(JSON.stringify(st)),
                        holdUsed
                    });
                    st.gift[p]--;
                    board[gi] = 0;
                    captures[p]++;
                    cleanUpPieces();
                    fxBurst(gi, '#fb7185', 10, 1.8);
                    fxText(gi, '返礼!', '#fb7185', 1200);
                    consecutivePasses = 0;
                    holdUsed = false;
                    turn = p === 1 ? 2 : 1;
                    render();
                    updateUI();
                    saveState();
                }
                render();
                updateUI();
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnGift.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.gift[turn] <= 0) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`'返礼権 ×' + st.gift[turn]`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            返礼碁: 石を取られると返礼権を獲得。「返礼」+権利1個で敵石を1個引き取れる<br>
            PC: クリックで配置 / 「返礼」→敵石をクリック<br>
            スマホ: 同様にボタン→石をタップ`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石が取られるたびに「返礼権」が1個貯まる。',
            '「返礼」ボタン→敵石をクリックで、その石を引き取って自分のアゲハマにできる。',
            '返礼には返礼権1個と1手を消費。取られた側の救済措置として働く。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.gift = { 1: 0, 2: 0 }; st.armed = { 1: false, 2: false };
        // 白石を囲んで黒が取る → 白に返礼権
        board[2 * BOARD_SIZE + 2] = 2;
        board[2 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 2] = 1; board[3 * BOARD_SIZE + 2] = 1;
        executeMove({ cells: [{ x: 3, y: 2 }] }, 1); // (2,2) の白を取る
        assert('黒が白を捕獲', board[2 * BOARD_SIZE + 2] === 0 && captures[1] === 1);
        assert('白に返礼権が付く', st.gift[2] === 1);
        assert('黒には付かない', st.gift[1] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
