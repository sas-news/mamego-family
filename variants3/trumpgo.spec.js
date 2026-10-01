// TRUMPGO — 切札碁2: 各1回「切り札」を使うと、その着手で隣接する敵の連を全て取れる
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
const ST_INIT = `{ armed: { 1: false, 2: false }, used: { 1: false, 2: false } }`;
module.exports = {
    file: 'trumpgo.html',
    en: 'TRUMPGO',
    jp: '切札碁2',
    prefix: 'trumpgo',
    desc: '各1回「切り札」: その着手に隣接する敵の連を呼吸に関係なく全て取れる。',
    kind: 'stone',
    icon: 'trumpgo',
    spec: [
        ...K.rb('TRUMPGO', '切札碁2', 'trumpgo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 切り札: 着地点に隣接する敵の連を全て取る (通常の捕獲の後に発動)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }
            // 切り札: 着地点に隣接する敵の連を呼吸に関係なく全て取る
            if (st.armed[player]) {
                st.armed[player] = false;
                st.used[player] = true;
                const ti = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const killed = new Set();
                getNeighbors(ti).forEach(nb => {
                    if (board[nb] !== opponent) return;
                    const q = [nb];
                    while (q.length) {
                        const c2 = q.pop();
                        if (killed.has(c2) || board[c2] !== opponent) continue;
                        killed.add(c2);
                        getNeighbors(c2).forEach(n2 => { if (board[n2] === opponent) q.push(n2); });
                    }
                });
                if (killed.size > 0) {
                    killed.forEach(i2 => { board[i2] = 0; });
                    captures[player] += killed.size;
                    fxText(ti, '切り札!', '#dc2626', 1300);
                    fxShake(6, 400);
                    cleanUpPieces();
                }
            }`],
        // 「切り札」ボタン (各1回)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnTrump" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-red-500/50 text-red-600 rounded-xl hover:bg-red-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                切り札
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnTrump = document.getElementById('btnTrump');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnTrump.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.used[turn]) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.used[turn] ? '切札済' : (st.armed[turn] ? '切札待機' : '切札可')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            切札碁2: 各1回「切り札」で着地点に隣接する敵の連を全て取れる<br>
            PC: クリックで配置 / 「切り札」ボタンで切札モード<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「切り札」ボタンを押してから置くと、その着手が切り札になる (各1回)。',
            '着地点に隣接する敵の連は、呼吸が残っていても全て取り上げられる。',
            '大きな連のど真ん中に切り札を刺すと壊滅する。切り札の切り時が勝負。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.armed = { 1: false, 2: false }; st.used = { 1: false, 2: false };
        // 白の2石連 (呼吸あり) に隣接して切り札
        board[4 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 5] = 2;
        st.armed[1] = true;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('隣接する敵の連を全て取れる', board[4 * BOARD_SIZE + 4] === 0 && board[4 * BOARD_SIZE + 5] === 0);
        assert('取った数はアゲハマに', captures[1] === 2);
        assert('切り札は消費される', st.used[1] === true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
