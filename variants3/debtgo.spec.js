// DEBTGO — 貸付碁: 「貸付」で相手色の石を盤上に置ける。20手後に返済され自石+利子1石に膨らむ
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
const ST_INIT = `{ armed: { 1: false, 2: false }, loans: [] }`;
module.exports = {
    file: 'debtgo.html',
    en: 'DEBTGO',
    jp: '貸付碁',
    prefix: 'debtgo',
    desc: '「貸付」で相手色の石を置く。20手後に返済され、自石+利子1石に膨らむ。',
    kind: 'stone',
    icon: 'debtgo',
    spec: [
        ...K.rb('DEBTGO', '貸付碁', 'debtgo'),
        ...ST(ST_INIT),
        // 貸付: 置いた石は相手色 (借用石) として記録される
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            const __borrow = st.armed[player] ? 3 - player : player;
            if (st.armed[player]) {
                st.armed[player] = false;
                st.loans.push({ by: player, due: history.length + 20, i: move.cells[0].y * BOARD_SIZE + move.cells[0].x });
            }
            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = __borrow; });`],
        [K.ONE, `                player: player,`,
`                player: __borrow,`],
        // 返済: 期限を過ぎた借用石は貸主の石に変わり、利子として隣に+1石
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 貸付の返済処理: 期限到達なら貸主色に変わり利子1石が付く
            st.loans = (st.loans || []).filter(ln => {
                const borrower = 3 - ln.by;
                if (board[ln.i] !== borrower) return false; // 取られた借用石は債務消滅
                if (history.length < ln.due) return true;
                board[ln.i] = ln.by;
                const pc2 = pieces.find(p2 => p2.cells.some(c => c.x === ln.i % BOARD_SIZE && c.y === Math.floor(ln.i / BOARD_SIZE)));
                if (pc2) pc2.player = ln.by;
                for (const nb of getNeighbors(ln.i)) {
                    if (board[nb] !== 0) continue;
                    board[nb] = ln.by;
                    if (getCapturedStones(board, ln.by).length === 0) {
                        pieces.push({ id: Date.now() + Math.random(), player: ln.by, type: move.type, rot: 0, cells: [{ x: nb % BOARD_SIZE, y: Math.floor(nb / BOARD_SIZE) }] });
                        break;
                    }
                    board[nb] = 0;
                }
                fxGlow(ln.i, '#10b981', 900);
                fxText(ln.i, '返済+利子', '#10b981', 1200);
                return false;
            });

            turn = opponent;`],
        // 「貸付」ボタン: 次の着手が借用石になる
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnLend" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-emerald-500/50 text-emerald-600 rounded-xl hover:bg-emerald-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                貸付
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnLend = document.getElementById('btnLend');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnLend.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.STONE_MARKS_SPEC(`            // 借用石: 借用中の石に契約リングを描く
            {
                ctx.save();
                (st.loans || []).forEach(ln => {
                    if (board[ln.i] !== 3 - ln.by) return;
                    const cx = padding + (ln.i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(ln.i / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = 'rgba(16,185,129,0.9)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                    ctx.setLineDash([cellSize * 0.12, cellSize * 0.08]);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.armed[turn] ? '貸付待機' : '借用 ' + (st.loans || []).length`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            貸付碁: 「貸付」で相手色の石を置く。20手後に返済され自石+利子1石に膨らむ<br>
            PC: クリックで配置 / 「貸付」ボタンで借用石モード<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「貸付」ボタンを押してから置くと、その石は相手色の「借用石」になる (1手消費)。',
            '20手後に返済: 借用石は自分の色に変わり、利子として隣の空点にもう1石置かれる。',
            '期限内に相手に取られると債務は消滅する。貸す場所と回収タイミングが勝負。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.armed = { 1: false, 2: false }; st.loans = [];
        st.armed[1] = true;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('貸付は相手色の石', board[0] === 2);
        assert('借用が記録される', st.loans.length === 1 && st.loans[0].by === 1);
        // 期限到来 → 貸主色に変わり利子が付く
        history.length = st.loans[0].due;
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('返済で自石に変わる', board[0] === 1);
        assert('利子の石が隣に付く', getNeighbors(0).some(n => board[n] === 1));
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
