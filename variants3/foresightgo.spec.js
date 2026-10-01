// FORESIGHTGO — 読合碁: 相手の次の着手点を先読み宣言。的中すればその石は自分のものになる
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
const ST_INIT = `{ predict: { 1: -1, 2: -1 }, armed: { 1: false, 2: false } }`;
module.exports = {
    file: 'foresightgo.html',
    en: 'FORESIGHTGO',
    jp: '読合碁',
    prefix: 'foresightgo',
    desc: '相手の次の着手点を先読み宣言。的中すればその石は自分の色になる。',
    kind: 'stone',
    icon: 'foresightgo',
    spec: [
        ...K.rb('FORESIGHTGO', '読合碁', 'foresightgo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 先読み的中: 予想された点への着手は「横取り」され読んだ側の色になる
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            let __stolen = false;
            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if ((st.predict[3 - player] || -1) === pi) {
                    st.predict[3 - player] = -1;
                    __stolen = true;
                    move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = 3 - player; }); // 読んだ側の石になる
                    fxBurst(pi, '#a78bfa', 12, 2.0);
                    fxText(pi, '横取り!', '#a78bfa', 1300);
                    fxShake(4, 300);
                } else {
                    move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
                }
            }`],
        // 横取りされた石は着手者の色ではないのでピース記録は読んだ側で扱う
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: __stolen ? 3 - player : player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });`],
        // 横取り時: 落ちた石は「読んだ側」の石なので、着手者の石が取られる可能性がある
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = __stolen ? getCapturedStones(board, player) : getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[__stolen ? 3 - player : player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 「読み」ボタン → 空点クリックで先読み宣言 (宣言には1手を消費)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnFore" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-violet-500/50 text-violet-600 rounded-xl hover:bg-violet-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                読み
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnFore = document.getElementById('btnFore');`],
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 読みモード: 空点をクリックして相手の次の着手点を宣言 (1手を消費)
            if (st.armed[turn]) {
                st.armed[turn] = false;
                const gi = Math.round(anchor.v) * BOARD_SIZE + Math.round(anchor.u);
                if (gi >= 0 && gi < board.length && board[gi] === 0) {
                    st.predict[turn] = gi;
                    fxGlow(gi, '#a78bfa', 800);
                    handlePass(); // 宣言は1手を消費
                }
                render();
                updateUI();
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnFore.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.predict[turn] >= 0 ? '先読み宣言中' : (st.armed[turn] ? '予想点を選んで' : '')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            読合碁: 「読み」→空点をクリックで相手の次の着手点を宣言 (1手を消費)。的中で石を横取り<br>
            PC: クリックで配置 / 「読み」→点をクリック<br>
            スマホ: 同様にボタン→点をタップ`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「読み」ボタン→空点をクリックで、相手の次の着手点を予想して宣言する (1手を消費)。',
            '相手がその点に着手すると、石は自分の色で置かれる (着手を横取り)。宣言は消費される。',
            '宣言は相手に見えない。外れれば宣言が残る。1手賭けた大勝負の読み合い。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.predict = { 1: -1, 2: -1 }; st.armed = { 1: false, 2: false };
        // 黒が白の次の着手点 (6,6) を先読み
        st.predict[1] = 6 * BOARD_SIZE + 6;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2); // 読まれた → 黒の石として置かれる
        assert('読まれた石は黒になる', board[6 * BOARD_SIZE + 6] === 1);
        assert('宣言は消費される', st.predict[1] === -1);
        assert('手番は通常通り進む', turn === 1);
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2);
        assert('読まれない点は通常着手', board[4 * BOARD_SIZE + 4] === 2);
    `,
};
