// PRUNEGO — 剪定碁: 「剪定」で自石を1個切り落とせる。5石以上で全員が繋がり2本以内の樹形連は+2目
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
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
const ST_INIT = `{ uses: { 1: (P('prune_uses') || 5), 2: (P('prune_uses') || 5) }, armed: { 1: false, 2: false }, paid: {} }`;
module.exports = {
    file: 'prunego.html',
    en: 'PRUNEGO',
    jp: '剪定碁',
    prefix: 'prunego',
    desc: '「剪定」→自石を選ぶと切り落とす (1手消費・各5回)。5石以上の樹形連は+2目。',
    kind: 'stone',
    icon: 'prunego',
    spec: [
        ...K.rb('PRUNEGO', '剪定碁', 'prunego'),
        K.params([{ key: 'prune_uses', label: '剪定の回数', min: 1, max: 15, def: 5, unit: '回' }, { key: 'tree_min', label: '樹形ボーナスの連サイズ', min: 3, max: 12, def: 5, unit: '石' }, { key: 'tree_pts', label: '樹形ボーナス', min: 1, max: 8, def: 2, unit: '目' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' }]),
        ...ST(ST_INIT),
        // 補助関数をページスコープへ注入
        [K.ONE, `        function executeMove(move, player) {`, `        const pruneCut = (idx, player) => {
    // 剪定: 自石を1個切り落とす (1手消費)
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
    board[idx] = 0;
    fxBurst(idx, '#4ade80', 9, 1.4);
    fxText(idx, '剪定!', '#22c55e', 1100);
    cleanUpPieces();
    consecutivePasses = 0;
    holdUsed = false;
    turn = player === 1 ? 2 : 1;
    if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) { endGameByScore(); return true; }
    updateUI();
    if (gameMode === 'online' && onlineRoomId) syncOnlineState();
    saveState();
    if (!gameOver && gameMode === 'ai' && turn === aiPlayer) triggerAiMove();
    return true;
};

        function executeMove(move, player) {`],

        // 樹形ボーナス: 5石以上の連で全員の同色隣接が2本以内 → +2目 (構成ごと1回)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 剪定碁: 美しい樹形 (5石以上・全石が繋がり2本以内) の自連に+2目
            {
                const seen = new Set();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player || seen.has(i)) continue;
                    const g = getConnectedGroup(i, player);
                    g.forEach(j => seen.add(j));
                    if (g.length < (P('tree_min') || 5)) continue;
                    const tree = g.every(j => getNeighbors(j).filter(n => board[n] === player).length <= 2);
                    if (!tree) continue;
                    const key = g.slice().sort((a, b) => a - b).join(',');
                    if (st.paid[key]) continue;
                    st.paid[key] = 1;
                    captures[player] += (P('tree_pts') || 2);
                    fxText(i, '見事な樹形 +2', '#22c55e', 1300);
                    fxGlow(i, '#4ade80', 850);
                }
            }

            turn = opponent;`],
        // 「剪定」ボタン → 自石を選んで切る
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnPrune" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-green-600/50 text-green-600 rounded-xl hover:bg-green-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                剪定
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnPrune = document.getElementById('btnPrune');`],
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 剪定モード: 自石をクリックして切り落とす
            if (st.armed[turn]) {
                st.armed[turn] = false;
                const gi = Math.round(anchor.v) * BOARD_SIZE + Math.round(anchor.u);
                if (gi >= 0 && gi < board.length && board[gi] === turn) pruneCut(gi, turn);
                else { render(); updateUI(); }
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnPrune.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.uses[turn] <= 0) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.armed[turn] ? '剪定する枝を選んで' : '剪定 ' + (st.uses[turn] || 0) + '回'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            剪定碁: 「剪定」→自石を1個切り落とす (1手消費・各5回)。5石以上の樹形連 (全石が繋がり2本以内) は+2目<br>
            PC: クリックで配置 / 「剪定」→自石クリック<br>
            スマホ: 同様にボタン→タップ`],
        [K.ONE, K.RV_BASE, K.rv([
            '「剪定」ボタン→自分の石を1個切り落とせる (1手消費・各側5回)。詰んだ枝・誤植の芽を整える。',
            '5石以上の自分の連で、全ての石が同色との繋がり2本以内 (環のない枝状) なら「見事な樹形」で+2目。',
            '膨らみすぎた連は剪定で樹形に。整えるほど美しく、美しいほど点になる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.uses = { 1: 5, 2: 5 }; st.armed = { 1: false, 2: false }; st.paid = {};
        // 直線5石の樹形
        for (let k = 0; k < 5; k++) board[5 * BOARD_SIZE + 3 + k] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('樹形で+2目', captures[1] === 2);
        // 剪定で自石を切る
        board[2 * BOARD_SIZE + 2] = 1;
        turn = 1;
        assert('剪定できる', pruneCut(2 * BOARD_SIZE + 2, 1) === true);
        assert('枝が切り落とされる', board[2 * BOARD_SIZE + 2] === 0 && st.uses[1] === 4 && turn === 2);
        // 塊(2x3)は樹形ではない
        board.fill(0); st.paid = {}; captures = { 1: 0, 2: 0 }; turn = 1;
        for (let k = 0; k < 3; k++) { board[8 * BOARD_SIZE + 2 + k] = 1; board[9 * BOARD_SIZE + 2 + k] = 1; }
        executeMove({ cells: [{ x: 0, y: 12 }] }, 1);
        assert('塊は樹形にならない', captures[1] === 0);
    `,
};
