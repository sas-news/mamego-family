// RECALLGO — 回想碁: 各1回、自分の直近の着手まで盤面を巻き戻せる (その手以降は全て消える)
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
const ST_INIT = `{ used: { 1: false, 2: false } }`;
module.exports = {
    file: 'recallgo.html',
    en: 'RECALLGO',
    jp: '回想碁',
    prefix: 'recallgo',
    desc: '各1回「回想」で自分の直近の着手まで盤面を巻き戻し、その後の全ての手を消す。',
    kind: 'stone',
    icon: 'recallgo',
    spec: [
        ...K.rb('RECALLGO', '回想碁', 'recallgo'),
        ...ST(ST_INIT),
        // 「回想」ボタン
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnRecall" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-violet-500/50 text-violet-600 rounded-xl hover:bg-violet-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                回想
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnRecall = document.getElementById('btnRecall');`],
        // 回想: 自分の直近の着手のスナップショットまで盤面を巻き戻す (各1回)
        [K.ONE, '        function updateUI() {',
`        // 回想: 自分の直近の着手まで時を戻す (その手以降の着手は全て消える)
        function recallLast() {
            if (gameOver || gamePhase !== 'playing' || st.used[turn]) return;
            let i = history.length - 1;
            while (i >= 0 && (!history[i] || history[i].turn !== turn)) i--;
            if (i < 0) return;
            const snap = history[i];
            history.length = i;
            board = [...snap.board];
            pieces = snap.pieces.map(pc => ({ ...pc, cells: pc.cells.map(p => ({ ...p })) }));
            captures = { ...snap.captures };
            turn = snap.turn;
            consecutivePasses = snap.consecutivePasses;
            prevBoard = snap.prevBoard;
            lastMove = snap.lastMove;
            if (snap.currentPieceType) currentPieceType = snap.currentPieceType;
            if (snap.pieceQueue) pieceQueue = [...snap.pieceQueue];
            if (snap.heldPieces) heldPieces = { ...snap.heldPieces };
            holdUsed = !!snap.holdUsed;
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : st;
            st.used[turn] = true;
            previewPos = null;
            const cc = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
            fxText(cc, '回想!', '#a78bfa', 1300);
            fxShake(4, 320);
            updateUI();
            if (gameMode === 'online' && onlineRoomId) syncOnlineState();
            saveState();
            if (!gameOver && gameMode === 'ai' && turn === aiPlayer) triggerAiMove();
        }

        function updateUI() {`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnRecall.addEventListener('click', () => {
            soundManager.playClick();
            recallLast();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.used[turn] ? '回想済' : '回想可'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            回想碁: 各1回「回想」で自分の直近の着手まで盤面を巻き戻せる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「回想」ボタン (各1回): 自分の直近の着手まで盤面が巻き戻る。',
            'その手以降に打たれた手は相手の分も全て消え、再び自分の手番になる。',
            '読み違えた大悪手を1回だけなかったことにできる。切りどころが勝負。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        captures = { 1: 0, 2: 0 }; st.used = { 1: false, 2: false };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        assert('2手置かれている', (board[2 * BOARD_SIZE + 2] === 1) && (board[5 * BOARD_SIZE + 5] === 2));
        // 白の回想: 白の着手 (5,5) まで巻き戻る → 白石が消え白の手番に戻る
        turn = 2; // 白の手番として回想を使う
        recallLast();
        assert('白石が消える', board[5 * BOARD_SIZE + 5] === 0);
        assert('黒石は残る', board[2 * BOARD_SIZE + 2] === 1);
        assert('白の手番に戻る', turn === 2);
        assert('回想済みになる', st.used[2] === true);
        const before = history.length;
        recallLast(); // 2回目は効かない
        assert('回想は1回のみ', history.length === before);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
