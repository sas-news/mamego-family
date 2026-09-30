// STANCEGO — 駆引碁: 「強気/弱気」を宣言。取りの瞬間の両者の構えの組合せでアゲハマが変わる
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
const ST_INIT = `{ stance: { 1: 0, 2: 0 } }`; // 0:弱気 1:強気
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
module.exports = {
    file: 'stancego.html',
    en: 'STANCEGO',
    jp: '駆引碁',
    prefix: 'stancego',
    desc: '強気/弱気を宣言。取りの瞬間の構えの組合せでアゲハマが変わる駆引の碁。',
    kind: 'stone',
    icon: 'stancego',
    spec: [
        ...K.rb('STANCEGO', '駆引碁', 'stancego'),
        ...ST(ST_INIT),
        // 構えの組合せ: 強vs弱=突き(2倍) / 強vs強=相討ち(2倍+自石1つ代償) / 弱vs強=受け流し(+1) / 弱vs弱=通常
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                const mine = st.stance[player], theirs = st.stance[opponent];
                let gain = captured.length;
                let note = '';
                if (mine === 1 && theirs === 0) { gain += captured.length; note = '突き!'; }
                else if (mine === 1 && theirs === 1) {
                    gain += captured.length; note = '相討ち!';
                    // 無謀な突進の代償: 自分の石も1つ取られる
                    const own = [];
                    board.forEach((v, i) => { if (v === player) own.push(i); });
                    if (own.length > 0) {
                        const ri = own[(history.length + own.length) % own.length];
                        board[ri] = 0;
                        captures[opponent]++;
                    }
                }
                else if (mine === 0 && theirs === 1) { gain += 1; note = '受け流し!'; }
                captures[player] += gain;
                if (note) fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, note, '#f43f5e', 1200);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 「強気」「弱気」ボタン: 構えを宣言 (次の着手まで持続)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnBold" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-rose-500/50 text-rose-600 rounded-xl hover:bg-rose-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                強気
            </button>
            <button id="btnMeek" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-teal-500/50 text-teal-600 rounded-xl hover:bg-teal-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                弱気
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnBold = document.getElementById('btnBold');
        const btnMeek = document.getElementById('btnMeek');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnBold.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.stance[turn] = 1;
            updateUI();
        });
        btnMeek.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.stance[turn] = 0;
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`'構え: ' + (st.stance[turn] ? '強気' : '弱気')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            駆引碁: 「強気」「弱気」ボタンで構えを宣言。取りの瞬間の両者の構えでアゲハマが変わる<br>
            PC: クリックで配置 / 構えはボタンで切替<br>
            スマホ: 同様にボタン操作`],
        [K.ONE, K.RV_ALGO, K.rv([
            '強気/弱気を宣言しておくと、取りの瞬間の構えの組合せで効果が変わる。',
            '強vs弱 = 突き: アゲハマ2倍。強vs強 = 相討ち: 2倍だが自分も1石失う。',
            '弱vs強 = 受け流し: +1ボーナス。弱vs弱 = 通常。構えは宣言するまで持続。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.stance = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        const mk = () => { board.fill(0); board[4 * B + 4] = 2; board[4 * B + 3] = 1; board[5 * B + 4] = 1; board[3 * B + 4] = 1; };
        mk(); st.stance = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        assert('弱vs弱は通常の取り', captures[1] === 1 && board[4 * B + 4] === 0);
        captures = { 1: 0, 2: 0 }; mk(); st.stance = { 1: 1, 2: 0 };
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        assert('強vs弱は突きで2倍', captures[1] === 2);
        captures = { 1: 0, 2: 0 }; mk(); st.stance = { 1: 0, 2: 1 };
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        assert('弱vs強は受け流し+1', captures[1] === 2);
        captures = { 1: 0, 2: 0 }; mk(); st.stance = { 1: 1, 2: 1 };
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        assert('強vs強は2倍+代償1石', captures[1] === 2 && captures[2] === 1);
    `,
};
