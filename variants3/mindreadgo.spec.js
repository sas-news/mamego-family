// MINDREADGO — 読心碁: 相手の次の着手点を予想して宣言。当たれば相手の手は無効化される
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.75))) {
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
const ST_INIT = `{ predict: { 1: -1, 2: -1 }, armed: { 1: false, 2: false } }`;
module.exports = {
    file: 'mindreadgo.html',
    en: 'MINDREADGO',
    jp: '読心碁',
    prefix: 'mindreadgo',
    desc: '相手の次の着手点を予想して宣言。的中すれば相手の手は無効化される。',
    kind: 'stone',
    icon: 'mindreadgo',
    spec: [
        ...K.rb('MINDREADGO', '読心碁', 'mindreadgo'),
        K.params([
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 読み的中: 予想された点への着手は無効化される (石は置かれず手番だけ進む)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            let __voided = false;
            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if ((st.predict[3 - player] || -1) === pi) {
                    st.predict[3 - player] = -1;
                    __voided = true;
                    fxText(pi, '読み的中!', '#f472b6', 1300);
                    fxShake(4, 300);
                } else {
                    move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
                }
            }`],
        // 無効化された手はピースも捕獲も起こさない
        [K.ONE, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });`,
`            if (!__voided) {
                pieces.push({
                    id: Date.now() + Math.random(),
                    player: player,
                    type: move.type,
                    rot: move.rot,
                    cells: move.cells
                });
            }`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = __voided ? [] : getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 「読み」ボタン → 空点クリックで予想宣言
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnRead" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-pink-500/50 text-pink-600 rounded-xl hover:bg-pink-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                読み
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnRead = document.getElementById('btnRead');`],
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 読みモード: 空点をクリックして相手の次の着手点を予想 (手番は消費しない)
            if (st.armed[turn]) {
                const gi = Math.round(anchor.v) * BOARD_SIZE + Math.round(anchor.u);
                st.armed[turn] = false;
                if (gi >= 0 && gi < board.length && board[gi] === 0) {
                    st.predict[turn] = gi;
                    fxText(gi, '読み!', '#f472b6', 1100);
                }
                render();
                updateUI();
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnRead.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.predict[turn] >= 0 ? '読み宣言中' : (st.armed[turn] ? '読み待機' : '')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            読心碁: 「読み」で相手の次の着手点を予想。的中すればその手は無効化<br>
            PC: クリックで配置 / 「読み」ボタン→空点をクリックで宣言<br>
            スマホ: 同様にボタン→点をタップ`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「読み」ボタン→空点をクリックで、相手の次の着手点を予想して宣言できる。',
            '相手がその点に打てば、手が無効化され石は置かれず手番だけ進む (罠)。',
            '予想は相手にも見えない。次の相手番で外れたら予想は残る。読み合いの碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.predict = { 1: -1, 2: -1 }; st.armed = { 1: false, 2: false };
        // 黒が白の次の着手点 (3,3) を予想
        st.predict[1] = 3 * BOARD_SIZE + 3;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 2); // 読まれた → 無効化
        assert('読まれた手は無効化される', board[3 * BOARD_SIZE + 3] === 0);
        assert('手番だけは進む', turn === 1);
        assert('予想は消費される', st.predict[1] === -1);
        // 別の点は普通に置ける
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2);
        assert('外れれば通常着手', board[4 * BOARD_SIZE + 4] === 2);
    `,
};
