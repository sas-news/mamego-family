// LAVAFLOWGO — 溶岩碁: 置いた石は3手の間「灼熱」で取れず、その後冷えて岩盤 (通常石) に固まる
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
    file: 'lavaflowgo.html',
    en: 'LAVAFLOWGO',
    jp: '溶岩碁',
    prefix: 'lavaflowgo',
    desc: '打ったばかりの石は灼熱の溶岩 — 3手の間は取れない。冷えると岩盤に固まる。',
    kind: 'stone',
    icon: 'lavaflowgo',
    spec: [
        ...K.rb('LAVAFLOWGO', '溶岩碁', 'lavaflowgo'),
        ...ST('{ born: {} }'),
        // 着手時に石の生成手を記録する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 溶岩碁: 石の生成手を記録 (配置から3手の間は灼熱)
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.born[mi] = history.length;
                for (const k in st.born) if (board[k] === 0 || board[k] === 3) delete st.born[k];
            }

            turn = opponent;`],
        // 灼熱の溶岩は冷えるまで取れない (生後3手未満の石を含む連は呼吸あり)
        [K.ONE, `                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);`,
`                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);
                        // 灼熱 (生後3手未満) の石を含む連は呼吸あり
                        if (history.length - (st.born[curr] || 0) < 3) hasLiberty = true;`],
        // 灼熱の石は橙に脈動する光輪
        ...K.STONE_MARKS_SPEC(`            // 灼熱溶岩: 新しい石は橙に脈動して光る
            {
                const now = fxNow();
                ctx.save();
                for (const k in st.born) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const age = history.length - st.born[k];
                    if (age >= 3) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const ph = 0.5 + 0.5 * Math.sin(now / 240 + idx);
                    ctx.strokeStyle = 'rgba(249,115,22,' + (0.5 + 0.4 * ph) + ')';
                    ctx.lineWidth = Math.max(1.6, cellSize * 0.08);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * (0.3 + 0.06 * ph), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            溶岩碁: 打ったばかりの石は灼熱 — 3手の間は取れない。冷えたら岩盤に固まる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いたばかりの石は流動する溶岩 — 配置から3手の間は取られない (灼熱)。',
            '3手経つと冷えて岩盤に固まり、通常の石として取られるようになる。',
            '迫撃のタイミングが変わる。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.born = {};
        board[I(1, 1)] = 2; st.born[I(1, 1)] = 1;
        board[I(0, 1)] = 1; board[I(1, 0)] = 1; board[I(1, 2)] = 1;
        history.length = 2;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1); // 白(1,1)は生後1手 — 灼熱
        assert('灼熱の石は取れない', board[I(1, 1)] === 2 && captures[1] === 0);
        board[I(2, 1)] = 0; history.length = 10; // 冷えた状態で再び囲む
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1);
        assert('冷えたら取れる', board[I(1, 1)] === 0 && captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
