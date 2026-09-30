// INLETGO — 入江碁: 各辺に海の凹部(入り江)。港内の好地は安全な停泊地 (+1呼吸・入港+1点)
const K = require('../gen_kit.js');
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
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false }`;
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
module.exports = {
    file: 'inletgo.html',
    en: 'INLETGO',
    jp: '入江碁',
    prefix: 'inletgo',
    desc: '各辺に海の入り江。港内の好地は安全な停泊地 (+1呼吸・入港+1点)。',
    kind: 'stone',
    icon: 'inletgo',
    spec: [
        ...K.rb('INLETGO', '入江碁', 'inletgo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 入り江: 四辺の中央に海の凹部。凹部に面した陸地は安全な港 (+1呼吸・入港点)
        let INLET_SEA = new Set();
        let INLET_PORT = new Set();
        function rebuildInlet() {
            INLET_SEA = new Set(); INLET_PORT = new Set();
            const n = BOARD_SIZE, c = Math.floor(n / 2), e = n - 1;
            const add = (x, y) => { if (x >= 0 && y >= 0 && x < n && y < n) INLET_SEA.add(y * n + x); };
            // 上辺の凹部
            [ [c - 1, 0], [c, 0], [c + 1, 0], [c, 1] ].forEach(([x, y]) => add(x, y));
            // 下辺の凹部
            [ [c - 1, e], [c, e], [c + 1, e], [c, e - 1] ].forEach(([x, y]) => add(x, y));
            // 左辺の凹部
            [ [0, c - 1], [0, c], [0, c + 1], [1, c] ].forEach(([x, y]) => add(x, y));
            // 右辺の凹部
            [ [e, c - 1], [e, c], [e, c + 1], [e - 1, c] ].forEach(([x, y]) => add(x, y));
            // 港 = 凹部に隣接する陸地
            INLET_SEA.forEach(i => {
                const x = i % n, y = (i / n) | 0;
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= n || ny >= n) return;
                    const j = ny * n + nx;
                    if (!INLET_SEA.has(j)) INLET_PORT.add(j);
                });
            });
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            rebuildInlet();
            INLET_SEA.forEach(i => { board[i] = 3; });`],
        // 港内の石は呼吸+1
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        if (INLET_PORT.has(curr)) liberties++; // 港内の石は停泊して安全
                    }

                    if (liberties <= 0) {`],
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                if (INLET_PORT.has(curr)) liberties++; // 港内の石は停泊して安全
            }
            return liberties;`],
        // 入港: 港に置くと+1点
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => {
                const pi = p.y * BOARD_SIZE + p.x;
                if (INLET_PORT.has(pi)) {
                    st.score[player]++;
                    fxGlow(pi, '#67e8f9', 800);
                    fxText(pi, '入港+1', '#67e8f9', 1100);
                }
            });`],
        // 海の描画 + 港のブイ
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        ...K.STONE_MARKS_SPEC(`            // 港: 係留ブイの小さなリング
            {
                ctx.save();
                INLET_PORT.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(103,232,249,0.5)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy + cellSize * 0.30, cellSize * 0.16, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        // 入港点を終局時にアゲハマ相当として加算
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._end) {
                st._end = true;
                captures[1] += st.score[1] || 0;
                captures[2] += st.score[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'入港 黒' + st.score[1] + ' / 白' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `            入江碁: 各辺の凹部は海。入り江に面した港 (水色○) は+1呼吸・入港+1点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '四辺に海の入り江 (凹部) が開く。凹部に面した陸地は安全な港 — 石の呼吸点+1。',
            '港に石を入港させると+1点 (終局時にアゲハマ相当で加算)。',
            '港は守りの要地。凹部の水は着手不可・呼吸なし。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = Math.floor(BOARD_SIZE / 2);
        assert('入り江がある', INLET_SEA.size >= 12);
        assert('凹部は海', board[I(c, 0)] === 3);
        assert('凹部は打てない', isValidPlacement([{ x: c, y: 0 }], 1) === false);
        assert('港がある', INLET_PORT.size > 0);
        const port = [...INLET_PORT][0];
        pieces = []; history.length = 0; turn = 1; st.score = { 1: 0, 2: 0 };
        board[I(port % BOARD_SIZE, (port / BOARD_SIZE) | 0)] = 1;
        assert('港内の石は呼吸+1', getLiberties(board, port) >= 2);
    `,
};
