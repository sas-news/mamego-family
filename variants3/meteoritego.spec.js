// METEORITEGO — 隕鉄碁: 5手ごとの着手は隕鉄。堅く取れず、磁力で両隣の敵石の呼吸を削る
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
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
    file: 'meteoritego.html',
    en: 'METEORITEGO',
    jp: '隕鉄碁',
    prefix: 'meteoritego',
    desc: '5回目ごとの着手は隕鉄 — 硬くて取れず、隣の敵石に磁気の圧をかける。',
    kind: 'stone',
    icon: 'meteoritego',
    spec: [
        ...K.rb('METEORITEGO', '隕鉄碁', 'meteoritego'),
        K.params([
            { key: 'iron_interval', label: '隕鉄になる手の間隔', min: 2, max: 15, def: 5, unit: '手' },
            { key: 'iron_pts', label: '隕鉄1個の終局得点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST('{ iron: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 隕鉄碁: N手ごと (historyの倍数) に置いた石は隕鉄になる (間隔は設定で調整)
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (history.length % Math.max(1, P('iron_interval') || 5) === 0) {
                    st.iron[mi] = 1;
                    fxBurst(mi, '#94a3b8', 12);
                    fxText(mi, '隕鉄', '#cbd5e1', 1000);
                }
                for (const k in st.iron) if (board[k] === 0 || board[k] === 3) delete st.iron[k];
            }

            turn = opponent;`],
        // 隕鉄は取れない (鉄を含む連は常に呼吸ありとみなす)
        [K.ONE, `                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);`,
`                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);
                        // 隕鉄を含む連は常に呼吸あり (鉄は取れない)
                        if (st.iron[curr]) hasLiberty = true;`],
        // 隕鉄は鈍い光の金属印
        ...K.STONE_MARKS_SPEC(`            // 隕鉄: 銀灰の四角い金属印と磁力の細線
            {
                ctx.save();
                for (const k in st.iron) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, r = cellSize * 0.16;
                    ctx.fillStyle = 'rgba(203,213,225,0.95)';
                    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
                    ctx.strokeStyle = 'rgba(148,163,184,0.7)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.03);
                    getNeighbors(idx).forEach(n => {
                        if (board[n] !== 3 - board[idx]) return;
                        const nx = padding + (n % BOARD_SIZE) * cellSize, ny = padding + ((n / BOARD_SIZE) | 0) * cellSize;
                        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();
                    });
                }
                ctx.restore();
            }`),
        // 終局時: 盤上の隕鉄1個につき+1目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            for (const k in st.iron) {
                if (board[k] === 1) territory.black += (P('iron_pts') ?? 1);
                else if (board[k] === 2) territory.white += (P('iron_pts') ?? 1);
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            隕鉄碁: 5手ごとの着手は隕鉄 — 硬くて取れない。盤上の隕鉄は終局時+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '全局で5の倍数の手 (5手目・10手目…) に置かれた石は隕鉄になる。両者交互に訪れる。',
            '隕鉄はいくら囲まれても取られず、盤上に残ると終局時+1目。',
            '隕鉄手を良い場所に打てるよう布石する。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.iron = {};
        // 5手目の着手は隕鉄になる
        executeMove({ cells: [{ x: 1, y: 8 }] }, 1); // history=1
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        executeMove({ cells: [{ x: 1, y: 9 }] }, 1);
        executeMove({ cells: [{ x: 9, y: 8 }] }, 2);
        history.length = 4;
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1); // history=5 → 隕鉄
        assert('5手目は隕鉄', st.iron[I(7, 7)] === 1);
        assert('他の手は隕鉄でない', st.iron[I(1, 8)] !== 1 && st.iron[I(9, 9)] !== 1);
        // 隕鉄は囲まれても取れない
        board.fill(0); pieces = []; history.length = 0; st.iron = {}; captures = { 1: 0, 2: 0 };
        board[I(1, 1)] = 2; st.iron[I(1, 1)] = 1;
        board[I(0, 1)] = 1; board[I(1, 0)] = 1; board[I(1, 2)] = 1;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1);
        assert('隕鉄は囲まれても取れない', board[I(1, 1)] === 2 && captures[1] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
