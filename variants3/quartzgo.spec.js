// QUARTZGO — 水晶碁: 味方2石以上に接して置いた石は水晶に育ち、光を屈折して輝く (終局時+1目)
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
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
module.exports = {
    file: 'quartzgo.html',
    en: 'QUARTZGO',
    jp: '水晶碁',
    prefix: 'quartzgo',
    desc: '味方2石以上に寄り添って置いた石は水晶に育つ。水晶は終局時+1目。',
    kind: 'stone',
    icon: 'quartzgo',
    spec: [
        ...K.rb('QUARTZGO', '水晶碁', 'quartzgo'),
        ...ST('{ qz: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 水晶碁: 味方2石以上に接して置いた石は水晶に成長する
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const adj = getNeighbors(mi).filter(n => board[n] === player).length;
                if (adj >= 2 && !st.qz[mi]) {
                    st.qz[mi] = 1;
                    fxGlow(mi, '#a5f3fc', 950);
                    fxText(mi, '結晶!', '#67e8f9', 1100);
                }
                for (const k in st.qz) if (board[k] === 0 || board[k] === 3) delete st.qz[k];
            }

            turn = opponent;`],
        // 水晶は水色の輝きと屈折光
        ...K.STONE_MARKS_SPEC(`            // 水晶: 水色の光輪と隣の空点への屈折のきらめき
            {
                const now = fxNow();
                ctx.save();
                for (const k in st.qz) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const ph = 0.5 + 0.5 * Math.sin(now / 500 + idx);
                    ctx.strokeStyle = 'rgba(103,232,249,' + (0.45 + 0.4 * ph) + ')';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
                    ctx.stroke();
                    getNeighbors(idx).forEach(n => {
                        if (board[n] !== 0) return;
                        const nx = n % BOARD_SIZE, ny = (n / BOARD_SIZE) | 0;
                        ctx.fillStyle = 'rgba(165,243,252,' + (0.2 + 0.25 * ph) + ')';
                        ctx.beginPath();
                        ctx.arc(padding + nx * cellSize, padding + ny * cellSize, cellSize * 0.06, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
                ctx.restore();
            }`),
        // 終局時: 盤上の水晶1個につき+1目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            for (const k in st.qz) {
                if (board[k] === 1) territory.black += 1;
                else if (board[k] === 2) territory.white += 1;
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            水晶碁: 味方2石以上に接して置いた石は水晶に育つ。水晶は終局時+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '味方の石2個以上に隣接する場所に置くと、その石は水晶に成長する。',
            '水晶は光を屈折させて周囲を輝かせ、終局時に盤上の水晶1個につき+1目。',
            '連を寄せ合って育てるほど得る。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.qz = {};
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 9, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1); // (4,4)と(3,3)に接する → 水晶
        assert('味方2石に接すると水晶', st.qz[I(3, 4)] === 1);
        assert('孤立石は水晶にならない', st.qz[I(9, 9)] !== 1);
        assert('隣1石では水晶にならない', st.qz[I(4, 4)] !== 1 && st.qz[I(3, 3)] !== 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
