// BASALTGO — 玄武碁: 全隣接点を味方で固めた石は柱状節理の玄武岩 — 以後取れず終局時+1目
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
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
    file: 'basaltgo.html',
    en: 'BASALTGO',
    jp: '玄武碁',
    prefix: 'basaltgo',
    desc: '全隣接点 (3方向以上) を味方で固めた石は柱状節理に固まる — 取れず終局時+1目。',
    kind: 'stone',
    icon: 'basaltgo',
    spec: [
        ...K.rb('BASALTGO', '玄武碁', 'basaltgo'),
        ...ST('{ col: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 玄武碁: 全隣接点を味方で固めた石は柱状節理になる (不動・不敗)
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const tryColumn = idx => {
                    if (st.col[idx] || board[idx] !== player) return;
                    const nb = getNeighbors(idx);
                    if (nb.length >= 3 && nb.every(n => board[n] === player)) {
                        st.col[idx] = 1;
                        fxBurst(idx, '#78716c', 12);
                        fxText(idx, '節理', '#a8a29e', 1000);
                    }
                };
                tryColumn(mi);
                getNeighbors(mi).forEach(tryColumn);
                for (const k in st.col) if (board[k] === 0 || board[k] === 3) delete st.col[k];
            }

            turn = opponent;`],
        // 柱状節理は取れない (柱を含む連は常に呼吸あり)
        [K.ONE, `                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);`,
`                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);
                        // 柱状節理を含む連は常に呼吸あり (玄武岩は取れない)
                        if (st.col[curr]) hasLiberty = true;`],
        // 玄武岩の石は六角形の輪郭
        ...K.STONE_MARKS_SPEC(`            // 玄武: 柱状節理の石に石色の六角輪郭
            {
                ctx.save();
                for (const k in st.col) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = board[idx] === 1 ? 'rgba(214,211,209,0.9)' : 'rgba(68,64,60,0.9)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    for (let a = 0; a < 6; a++) {
                        const t = a / 6 * Math.PI * 2 - Math.PI / 2;
                        const vx = cx + Math.cos(t) * cellSize * 0.34, vy = cy + Math.sin(t) * cellSize * 0.34;
                        a ? ctx.lineTo(vx, vy) : ctx.moveTo(vx, vy);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        // 終局時: 盤上の柱状節理1個につき+1目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            for (const k in st.col) {
                if (board[k] === 1) territory.black += 1;
                else if (board[k] === 2) territory.white += 1;
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            玄武碁: 全隣接点 (3方向以上) を味方で固めた石は柱状節理 — 取れず終局時+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '味方の石で全方向 (3方向以上) を囲まれた石は柱状節理の玄武岩になる。',
            '玄武岩はどうやっても取られず、終局時に盤上に残っていれば+1目。',
            '十字に固めると確定の得点源 — 崩せないので先に断ち切ること。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.col = {};
        board[I(4, 4)] = 1; board[I(4, 3)] = 1; board[I(4, 5)] = 1; board[I(3, 4)] = 1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // (4,4)の4隣が黒に → 柱状節理
        assert('全隣を固めると柱状節理', st.col[I(4, 4)] === 1);
        assert('外側の石は節理でない', st.col[I(5, 4)] !== 1);
        // 柱状節理は取れない: 白で囲んでみる (テストのため直接取り検証)
        board.fill(0); pieces = []; st.col = {}; captures = { 1: 0, 2: 0 };
        board[I(1, 1)] = 2; st.col[I(1, 1)] = 1;
        board[I(0, 1)] = 1; board[I(1, 0)] = 1; board[I(1, 2)] = 1;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1);
        assert('柱状節理は囲まれても取れない', board[I(1, 1)] === 2 && captures[1] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
    `,
};
