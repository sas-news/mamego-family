// PRESSGO — 圧延碁: 「圧延」ボタンで自石を薄く延ばし隣接2空点へ拡がる。薄板は残り呼吸1で割れる (各側3回)
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
const ST_INIT = `{ uses: { 1: (P('press_uses') || 3), 2: (P('press_uses') || 3) }, armed: { 1: false, 2: false }, plates: {} }`;
module.exports = {
    file: 'pressgo.html',
    en: 'PRESSGO',
    jp: '圧延碁',
    prefix: 'pressgo',
    desc: '「圧延」で自石を薄板に延ばす (隣接2空点へ拡大)。薄板の連は呼吸1でも割れる (各3回)。',
    kind: 'stone',
    icon: 'pressgo',
    spec: [
        ...K.rb('PRESSGO', '圧延碁', 'pressgo'),
        K.params([{ key: 'press_uses', label: '圧延の回数', min: 1, max: 10, def: 3, unit: '回' }, { key: 'press_len', label: '圧延で延びるマス数', min: 1, max: 4, def: 2, unit: 'マス' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' }]),
        ...ST(ST_INIT),
        // 補助関数をページスコープへ注入
        [K.ONE, `        function executeMove(move, player) {`, `        const pressApply = (idx, player) => {
    // 圧延: 自石を薄板に延ばす (1手消費)
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
    st.plates[idx] = 1;
    const free = getNeighbors(idx).filter(n => board[n] === 0).slice(0, Math.max(1, P('press_len') || 2));
    free.forEach(n => {
        board[n] = player;
        st.plates[n] = 1;
        pieces.push({ id: Date.now() + Math.random(), player, type: 'STONE', rot: 0, cells: [{ x: n % BOARD_SIZE, y: Math.floor(n / BOARD_SIZE) }] });
        fxSlide(idx, n, 320);
    });
    fxText(idx, '圧延!', '#fbbf24', 1100);
    fxGlow(idx, '#fbbf24', 700);
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

        // 薄板の脆弱性: 板を含む敵連は呼吸1でも割れる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 圧延碁: 薄板を含む敵連は残り呼吸1でも割れる
            {
                const seen = new Set();
                const broke = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== opponent || seen.has(i)) continue;
                    const g = getConnectedGroup(i, opponent);
                    g.forEach(j => seen.add(j));
                    if (!g.some(j => st.plates[j])) continue;
                    if (getLiberties(board, i) <= 1) {
                        g.forEach(j => { board[j] = 0; delete st.plates[j]; captures[player]++; });
                        broke.push(i);
                    }
                }
                if (broke.length) {
                    broke.forEach(i => fxBurst(i, '#f87171', 10, 1.6));
                    fxText(broke[0], 'パキッ!', '#f87171', 1200);
                    fxShake(5, 280);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 「圧延」ボタン → 自石を選んで延ばす
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnPress" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-amber-500/50 text-amber-600 rounded-xl hover:bg-amber-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                圧延
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnPress = document.getElementById('btnPress');`],
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 圧延モード: 自石をクリックして延ばす
            if (st.armed[turn]) {
                st.armed[turn] = false;
                const gi = Math.round(anchor.v) * BOARD_SIZE + Math.round(anchor.u);
                if (gi >= 0 && gi < board.length && board[gi] === turn) pressApply(gi, turn);
                else { render(); updateUI(); }
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnPress.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.uses[turn] <= 0) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        // 薄板は平たい楕円で描く
        ...K.STONE_MARKS_SPEC(`            // 薄板の印: 石の下に平たい延び影
            for (let i = 0; i < board.length; i++) {
                if (!st.plates[i] || (board[i] !== 1 && board[i] !== 2)) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(217,119,6,0.75)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.beginPath();
                ctx.ellipse(cx, cy + cellSize * 0.3, cellSize * 0.34, cellSize * 0.09, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.armed[turn] ? '圧延する石を選んで' : '圧延 ' + (st.uses[turn] || 0) + '回'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            圧延碁: 「圧延」ボタン→自石を選ぶと薄板に延びて隣接2空点を得る。薄板の連は呼吸1でも割れる (各側3回)<br>
            PC: クリックで配置 / 「圧延」→自石クリック<br>
            スマホ: 同様にボタン→タップ`],
        [K.ONE, K.RV_BASE, K.rv([
            '「圧延」ボタン→自分の石を選ぶと、その石が薄く延びて隣の空点2つまで拡がる (1手消費・各側3回)。',
            '薄板を含む連は「脆い」— 呼吸点が1になった時点で割れて取られる (通常より一手早い)。',
            '急拡大か脆さの代償か。延ばした先端は厚く守るか捨てるか。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.uses = { 1: 3, 2: 3 }; st.armed = { 1: false, 2: false }; st.plates = {};
        board[4 * BOARD_SIZE + 4] = 1;
        assert('圧延できる', pressApply(4 * BOARD_SIZE + 4, 1) === true);
        assert('薄板に延びる', board[4 * BOARD_SIZE + 3] === 1 || board[4 * BOARD_SIZE + 5] === 1 || board[3 * BOARD_SIZE + 4] === 1 || board[5 * BOARD_SIZE + 4] === 1);
        assert('圧延は手番を消費', turn === 2 && st.uses[1] === 2);
        // 薄板連は呼吸1で割れる
        board.fill(0); pieces = []; turn = 1; captures = { 1: 0, 2: 0 };
        st.plates = {}; board[3 * BOARD_SIZE + 3] = 2; st.plates[3 * BOARD_SIZE + 3] = 1;
        board[2 * BOARD_SIZE + 3] = 1; board[3 * BOARD_SIZE + 2] = 1; board[4 * BOARD_SIZE + 3] = 1; // 呼吸1の薄板
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 無関係の着手でも割れる
        assert('呼吸1の薄板が割れる', board[3 * BOARD_SIZE + 3] === 0 && captures[1] === 1);
    `,
};
