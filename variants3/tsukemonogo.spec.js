// TSUKEMONOGO — 漬物碁: 糠床 (中央3x3) に漬けた石は10手の間取られない (漬かると普通の石)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
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
const ST_INIT = `{ tsuke: {} }`;
module.exports = {
    file: 'tsukemonogo.html',
    en: 'TSUKEMONOGO',
    jp: '漬物碁',
    prefix: 'tsukemonogo',
    desc: '糠床 (中央) に漬けた石は10手の間だけ取られない。漬かれば普通の石。',
    kind: 'stone',
    icon: 'tsukemonogo',
    spec: [
        ...K.rb('TSUKEMONOGO', '漬物碁', 'tsukemonogo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 糠床: 中央3x3
        const NUKA_SET = new Set();
        {
            const nc = Math.floor(BOARD_SIZE / 2);
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                NUKA_SET.add((nc + dy) * BOARD_SIZE + (nc + dx));
            }
        }`],
        // 糠床に漬かったばかりの石 (10手未満) を含む連は取られない
        [K.ONE, `                    if (!hasLiberty) {
                        captured.push(...group);
                    }`,
`                    // 糠床: 床内で漬かって10手未満の石を含む連は取られない
                    const inNuka = group.some(g =>
                        NUKA_SET.has(g) && st.tsuke[g] !== undefined &&
                        history.length - st.tsuke[g] < 10);
                    if (!hasLiberty && !inNuka) {
                        captured.push(...group);
                    }`],
        // 漬け込み時刻を記録 (着手した石)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 漬け込み: 置いた石の時刻を記録、取られた/古い記録は掃除
            {
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.tsuke[ci] = history.length;
                Object.keys(st.tsuke).forEach(k => {
                    if (board[+k] !== 1 && board[+k] !== 2) delete st.tsuke[k];
                });
            }

            turn = opponent;`],
        // 糠床の描画: ベージュの糠区域
        K.CUE_GRID(`            // 糠床: 中央の糠区域
            {
                ctx.save();
                ctx.fillStyle = 'rgba(202, 178, 122, 0.28)';
                NUKA_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        ...K.STONE_MARKS_SPEC(`            // 漬かり中の石: 糠の粒ドット
            {
                ctx.save();
                Object.keys(st.tsuke || {}).forEach(k => {
                    const i = +k;
                    if (!NUKA_SET.has(i) || (board[i] !== 1 && board[i] !== 2)) return;
                    if (history.length - st.tsuke[i] >= 10) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = 'rgba(161, 130, 60, 0.8)';
                    for (let d = 0; d < 3; d++) {
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(d * 2.1 + i) * cellSize * 0.2, cy + Math.sin(d * 2.1 + i) * cellSize * 0.2, cellSize * 0.05, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'糠床 ' + [...NUKA_SET].filter(i => board[i] === 1 || board[i] === 2).length + '石'`),
        [K.ONE, K.INFO_ALGO, `            漬物碁: 糠床に漬けた石は10手の間取られない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央は「糠床」。床に漬けたばかりの石は10手の間、呼吸点が0でも取られない。',
            '10手を過ぎれば普通の石。床は両者共通 — 漬け込みで凌ぐか、熟れ頃を狙うか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('糠床は9点', NUKA_SET.size === 9);
        // 糠床に漬けたばかりの白石は囲まれても取れない
        board.fill(0); pieces = []; history.length = 0; turn = 2;
        const nc = Math.floor(BOARD_SIZE / 2);
        board[I(nc, nc)] = 2;
        st.tsuke[I(nc, nc)] = 0;
        getNeighbors(I(nc, nc)).forEach(n => { if (board[n] === 0) board[n] = 1; });
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('漬かり中は取られない', board[I(nc, nc)] === 2);
        // 10手経つと普通に取れる
        st.tsuke[I(nc, nc)] = 0;
        history.length = 20;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('漬かれば取れる', board[I(nc, nc)] === 0);
        board.fill(0); pieces = []; history.length = 0; st.tsuke = {};
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
