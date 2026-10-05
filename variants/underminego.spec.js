// UNDERMINEGO — 掘削碁: 「掘削」で自石を坑夫として消し、隣接する敵石を全て崩して獲る (各側4回)
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
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
const ST_INIT = `{ uses: { 1: P('dig_uses') || 4, 2: P('dig_uses') || 4 }, armed: { 1: false, 2: false } }`;
module.exports = {
    file: 'underminego.html',
    en: 'UNDERMINEGO',
    jp: '掘削碁',
    prefix: 'underminego',
    desc: '「掘削」→自石を選ぶと坑夫が消え、隣接する敵石を全て崩して獲る (各側4回)。',
    kind: 'stone',
    icon: 'underminego',
    spec: [
        ...K.rb('UNDERMINEGO', '掘削碁', 'underminego'),
        K.params([
            { key: 'dig_uses', label: '掘削の使用回数', min: 1, max: 10, def: 4, unit: '回' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 補助関数をページスコープへ注入
        [K.ONE, `        function executeMove(move, player) {`, `        const undermineDig = (idx, player) => {
    // 掘削: 自石を坑夫として消し、隣接する敵石を崩す (1手消費)
    if (board[idx] !== player) return false;
    history.push({
        board: [...board],
        pieces: pieces.map(pc => ({ ...pc, cells: pc.cells.map(p => ({ ...p })) })),
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
    prevBoard = [...board];
    lastMove = { player, cells: [{ x: idx % BOARD_SIZE, y: Math.floor(idx / BOARD_SIZE) }] };
    st.uses[player]--;
    const foe = player === 1 ? 2 : 1;
    const hit = getNeighbors(idx).filter(n => board[n] === foe);
    board[idx] = 0;
    hit.forEach(n => {
        board[n] = 0;
        captures[player]++;
        fxBurst(n, '#eab308', 10, 1.6);
    });
    fxText(idx, '坑道崩落!', '#eab308', 1200);
    fxShake(6, 320);
    cleanUpPieces();
    consecutivePasses = 0;
    holdUsed = false;
    turn = foe;
    if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) { endGameByScore(); return true; }
    updateUI();
    if (gameMode === 'online' && onlineRoomId) syncOnlineState();
    saveState();
    if (!gameOver && gameMode === 'ai' && turn === aiPlayer) triggerAiMove();
    return true;
};

        function executeMove(move, player) {`],

        // 「掘削」ボタン → 自石を選ぶと坑夫となる
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnDig" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-yellow-600/50 text-yellow-600 rounded-xl hover:bg-yellow-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                掘削
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnDig = document.getElementById('btnDig');`],
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 掘削モード: 自石をクリックして坑夫にする
            if (st.armed[turn]) {
                st.armed[turn] = false;
                const gi = Math.round(anchor.v) * BOARD_SIZE + Math.round(anchor.u);
                if (gi >= 0 && gi < board.length && board[gi] === turn) undermineDig(gi, turn);
                else { render(); updateUI(); }
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnDig.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.uses[turn] <= 0) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.armed[turn] ? '坑夫を選んで' : '掘削 ' + (st.uses[turn] || 0) + '回'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            掘削碁: 「掘削」→自石を選ぶと坑夫が消え、隣接する敵石を全て崩して獲る (各側4回)<br>
            PC: クリックで配置 / 「掘削」→自石クリック<br>
            スマホ: 同様にボタン→タップ`],
        [K.ONE, K.RV_BASE, K.rv([
            '「掘削」ボタン→自分の石を選ぶと、その石が坑夫として地中に潜り (消え)、上下左右に隣接する敵石を全て崩してアゲハマにする。',
            '坑夫の自爆なので敵の厚みに1石を犠牲投入する覚悟が要る。各側4回まで。',
            '連の要を崩せば大きな連もバラバラに砕ける。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.uses = { 1: 4, 2: 4 }; st.armed = { 1: false, 2: false };
        board[4 * BOARD_SIZE + 4] = 1; // 坑夫
        board[4 * BOARD_SIZE + 5] = 2; board[3 * BOARD_SIZE + 4] = 2; // 隣接敵石2個
        board[6 * BOARD_SIZE + 6] = 2; // 離れた敵石
        assert('掘削できる', undermineDig(4 * BOARD_SIZE + 4, 1) === true);
        assert('隣接敵石が崩れる', board[4 * BOARD_SIZE + 5] === 0 && board[3 * BOARD_SIZE + 4] === 0);
        assert('坑夫も消える', board[4 * BOARD_SIZE + 4] === 0);
        assert('崩した敵石はアゲハマ', captures[1] === 2 && board[6 * BOARD_SIZE + 6] === 2);
        assert('手番が回る', turn === 2 && st.uses[1] === 3);
    `,
};
