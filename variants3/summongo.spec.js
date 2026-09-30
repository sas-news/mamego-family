// SUMMONGO — 召喚碁: 2石以上を一括で取られると「生贄」が溜まる。
// 「召喚」ボタンで次の着手を召喚獣に変え、一定手数の間その連は取られない。
const K = require('../gen_kit.js');

const PERSIST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];

const PASS_END = [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`];

const CAP = `
            // 打ち切り: 交点数x1.1を超えた長期戦は採点終局 (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                return;
            }
`;

const GETCAP = `        function getCapturedStones(boardState, player) {
            const deadMask = computeDeadMask(boardState);
            const visited = Array(boardState.length).fill(false);
            const captured = [];

            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {
                    const group = [];
                    let hasLiberty = false;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);

                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });
                    }

                    if (!hasLiberty) {
                        captured.push(...group);
                    }
                }
            }
            return captured;
        }`;

module.exports = {
    file: 'summongo.html',
    en: 'SUMMONGO',
    jp: '召喚碁',
    prefix: 'summongo',
    desc: '2石以上を一括で取られると生贄が溜まる。召喚獣を呼び出せ。',
    kind: 'stone',
    icon: 'summongo',
    spec: [
        ...K.rb('SUMMONGO', '召喚碁', 'summongo'),
        ...PERSIST('{ summon: { 1: 0, 2: 0 }, arm: { 1: false, 2: false }, beast: null }'),
        // 召喚獣を含む連は生きている (無敵)
        [K.ONE, GETCAP, `        function getCapturedStones(boardState, player) {
            const deadMask = computeDeadMask(boardState);
            const visited = Array(boardState.length).fill(false);
            const captured = [];
            // 召喚獣: 存命中はその石を含む連が必ず呼吸する
            const beastAlive = (i) => st.beast && history.length <= st.beast.until
                && boardState[st.beast.idx] === st.beast.player && i === st.beast.idx;

            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {
                    const group = [];
                    let hasLiberty = false;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);

                        if (beastAlive(curr)) hasLiberty = true;
                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });
                    }

                    if (!hasLiberty) {
                        captured.push(...group);
                    }
                }
            }
            return captured;
        }`],
        // 生贄: 一度に2石以上取られた側に召喚権が溜まる (劣勢救済)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                if (captured.length >= 2) {
                    st.summon[opponent]++;
                    const c0 = captured[0];
                    fxText(c0, '生贄+1', '#a78bfa', 1100);
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 召喚ボタン
        [K.ONE, `            <button id="btnResign" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-red-500/50 text-red-600 rounded-xl hover:bg-red-500/10 active:scale-95 transition-all shadow-sm">
                投了
            </button>`,
`            <button id="btnResign" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-red-500/50 text-red-600 rounded-xl hover:bg-red-500/10 active:scale-95 transition-all shadow-sm">
                投了
            </button>
            <button id="btnSummon" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-violet-500/60 text-violet-600 rounded-xl hover:bg-violet-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                召喚
            </button>`],
        [K.ONE, `        btnResign.addEventListener('click', handleResign);`,
`        btnResign.addEventListener('click', handleResign);
        const btnSummon = document.getElementById('btnSummon');
        if (btnSummon) btnSummon.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.summon[turn] <= 0 || st.beast || st.arm[turn]) return;
            st.arm[turn] = true;
            const ci = lastMove ? lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x : 0;
            fxText(ci, '召喚準備!', '#a78bfa', 1000);
            updateUI();
            saveState();
        });`],
        [K.ONE, K.UI_TAIL, `            const btnSummonEl = document.getElementById('btnSummon');
            if (btnSummonEl) {
                const can = !gameOver && gamePhase === 'playing' && isMyTurn()
                    && st.summon[turn] > 0 && !st.beast && !st.arm[turn];
                btnSummonEl.disabled = !can;
                btnSummonEl.title = st.summon[turn] > 0 ? '次の着手を召喚獣に変える (その連はしばらく取られない)' : '生贄 (2石以上を一括で取られる) が必要';
            }
            btnUndo.disabled = !canUndo();
            updatePieceTrayUI();
            render();
        }`],
        // 召喚実行: 武装中の着手は召喚獣になる (16手間無敵)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 召喚獣の寿命管理
            if (st.beast && history.length > st.beast.until) {
                fxText(st.beast.idx, '召喚獣は力尽きた', '#94a3b8', 900);
                st.beast = null;
            }

            // 召喚: 武装中の着手は召喚獣になる
            if (st.arm[player]) {
                st.arm[player] = false;
                st.summon[player]--;
                const bi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.beast = { idx: bi, until: history.length + 16, player: player };
                fxGlow(bi, '#8b5cf6', 1100);
                fxText(bi, '召喚獣!', '#a78bfa', 1400);
                fxShake(5, 300);
            }
${CAP}
            turn = opponent;`],
        // 召喚獣の角と残り寿命を描く
        ...K.STONE_MARKS_SPEC(`            {
                if (st.beast && history.length <= st.beast.until && board[st.beast.idx] === st.beast.player) {
                    const bx = st.beast.idx % BOARD_SIZE, by = (st.beast.idx / BOARD_SIZE) | 0;
                    const cx = padding + bx * cellSize, cy = padding + by * cellSize;
                    const now = fxNow();
                    ctx.save();
                    ctx.strokeStyle = 'rgba(139,92,246,' + (0.6 + 0.3 * Math.sin(now / 400)) + ')';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.46, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = '#8b5cf6';
                    [[-1, 0], [1, 0]].forEach(([sx]) => {
                        ctx.beginPath();
                        ctx.moveTo(cx + sx * cellSize * 0.16, cy - cellSize * 0.34);
                        ctx.lineTo(cx + sx * cellSize * 0.30, cy - cellSize * 0.56);
                        ctx.lineTo(cx + sx * cellSize * 0.04, cy - cellSize * 0.44);
                        ctx.closePath();
                        ctx.fill();
                    });
                    ctx.fillStyle = '#c4b5fd';
                    ctx.font = 'bold ' + Math.round(cellSize * 0.28) + 'px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(String(st.beast.until - history.length), cx, cy);
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`st.beast ? '召喚獣 残' + Math.max(0, st.beast.until - history.length) + '手' : (st.arm[turn] ? '召喚準備中' : '生贄 黒' + st.summon[1] + ' / 白' + st.summon[2])`),
        [K.ONE, K.INFO_ALGO, `            召喚碁: 2石以上を一括で取られると「生贄」が溜まる。召喚ボタンで次の着手を無敵の召喚獣に変える<br>
            PC: クリックで配置 / 召喚=ボタン<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石が1度に2個以上取られると「生贄」が1つ溜まる (失った側への救済)。',
            '「召喚」ボタンを押すと次の着手が召喚獣になる: 16手の間、その石を含む連は取られない。',
            '召喚獣の残り寿命は石の上の数字。寿命が尽きれば普通の石に戻る。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.summon = { 1: 0, 2: 0 }; st.arm = { 1: false, 2: false }; st.beast = null; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[0] = 2; board[1] = 2; board[2] = 1; board[BOARD_SIZE] = 1; board[BOARD_SIZE + 1] = 1;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('2石以上の生贄で召喚権', st.summon[2] === 1 && captures[1] === 2);
        st.arm[2] = true;
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2);
        assert('召喚獣が出現', st.beast && st.beast.idx === 7 * BOARD_SIZE + 7 && st.summon[2] === 0);
        board.fill(0);
        board[7 * BOARD_SIZE + 7] = 2; st.beast = { idx: 7 * BOARD_SIZE + 7, until: history.length + 10, player: 2 };
        board[7 * BOARD_SIZE + 6] = 1; board[7 * BOARD_SIZE + 8] = 1;
        board[6 * BOARD_SIZE + 7] = 1; board[8 * BOARD_SIZE + 7] = 1;
        assert('召喚獣を含む連は取られない', getCapturedStones(board, 2).length === 0);
        history.length = st.beast.until + 1;
        assert('寿命切れで取られる', getCapturedStones(board, 2).length === 1);
    `,
};
