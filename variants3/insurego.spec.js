// INSUREGO — 保険碁: 自石に保険をかけると、取られた時に保険金で最寄りの空点に復活する
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
const ST_INIT = `{ insured: { 1: [], 2: [] }, armed: { 1: false, 2: false } }`;
module.exports = {
    file: 'insurego.html',
    en: 'INSUREGO',
    jp: '保険碁',
    prefix: 'insurego',
    desc: '自石に保険をかけると、取られた時に保険金で近くの空点に復活する (最大2件)。',
    kind: 'stone',
    icon: 'insurego',
    spec: [
        ...K.rb('INSUREGO', '保険碁', 'insurego'),
        K.params([
            { key: 'ins_max', label: '付保の上限', min: 1, max: 5, def: 2, unit: '件' },
        ]),
        ...ST(ST_INIT),
        // 保険: 被保険石は取られず最寄りの空点に復活する (アゲハマにもならない)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    board[idx] = 0;
                    const list = st.insured[opponent] || [];
                    if (list.includes(idx)) {
                        st.insured[opponent] = list.filter(i => i !== idx);
                        // 復活先: 自分の石に隣接する最寄りの空点
                        let spot = -1, bestD = 1e9;
                        for (let j = 0; j < board.length; j++) {
                            if (board[j] !== 0) continue;
                            if (!getNeighbors(j).some(nb => board[nb] === opponent)) continue;
                            const d = Math.abs(j % BOARD_SIZE - idx % BOARD_SIZE) + Math.abs(Math.floor(j / BOARD_SIZE) - Math.floor(idx / BOARD_SIZE));
                            if (d < bestD) { bestD = d; spot = j; }
                        }
                        if (spot >= 0) {
                            board[spot] = opponent;
                            fxGlow(spot, '#38bdf8', 900);
                            fxText(spot, '保険!', '#38bdf8', 1100);
                        } else {
                            captures[player]++;
                        }
                    } else {
                        captures[player]++;
                    }
                });
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 「保険」ボタン → 自石クリックで付保 (最大2件)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnInsure" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-sky-500/50 text-sky-600 rounded-xl hover:bg-sky-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                保険
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnInsure = document.getElementById('btnInsure');`],
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 保険モード: 自石をクリックして付保する (手番は消費しない)
            if (st.armed[turn]) {
                const gi = Math.round(anchor.v) * BOARD_SIZE + Math.round(anchor.u);
                if (gi >= 0 && gi < board.length && board[gi] === turn && !(st.insured[turn] || []).includes(gi) && (st.insured[turn] || []).length < (P('ins_max') || 2)) {
                    (st.insured[turn] = st.insured[turn] || []).push(gi);
                    st.armed[turn] = false;
                    fxText(gi, '付保', '#38bdf8', 900);
                    render();
                    updateUI();
                } else {
                    st.armed[turn] = false;
                    render();
                }
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnInsure.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.STONE_MARKS_SPEC(`            // 被保険石: 盾マーク
            {
                ctx.save();
                [1, 2].forEach(pl => {
                    (st.insured[pl] || []).forEach(i => {
                        if (board[i] !== pl) return;
                        const cx = padding + (i % BOARD_SIZE) * cellSize;
                        const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                        ctx.fillStyle = 'rgba(56,189,248,0.85)';
                        ctx.beginPath();
                        ctx.moveTo(cx, cy - cellSize * 0.34);
                        ctx.lineTo(cx + cellSize * 0.22, cy - cellSize * 0.22);
                        ctx.lineTo(cx + cellSize * 0.22, cy + cellSize * 0.05);
                        ctx.lineTo(cx, cy + cellSize * 0.30);
                        ctx.lineTo(cx - cellSize * 0.22, cy + cellSize * 0.05);
                        ctx.lineTo(cx - cellSize * 0.22, cy - cellSize * 0.22);
                        ctx.closePath();
                        ctx.fill();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'被保険 ' + ((st.insured[turn] || []).length) + '/' + (P('ins_max') || 2)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            保険碁: 自石に保険をかけると取られた時に近くの空点へ復活 (最大2件)<br>
            PC: 「保険」ボタン→自石をクリックして付保<br>
            スマホ: 同様にボタン→石をタップ`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「保険」ボタン→自石をクリックで付保 (同時に2件まで・手番は消費しない)。',
            '被保険石が取られると、アゲハマにならず自分の石に隣接した最寄りの空点に復活する。',
            '急所の石に保険をかけておくと相手の取りが実質無効になる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.insured = { 1: [], 2: [] }; st.armed = { 1: false, 2: false };
        // 白の被保険石を黒で囲んで取る → アゲハマにならず白の石の隣に復活
        board[4 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 8] = 2; // 復活アンカー用にもう1石
        st.insured[2] = [4 * BOARD_SIZE + 4];
        board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('被保険石はアゲハマにならない', captures[1] === 0);
        assert('白のどこかに復活している', board.some((v, i) => v === 2 && getNeighbors(i).some(n => board[n] === 2)));
        assert('保険は消費される', st.insured[2].length === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
