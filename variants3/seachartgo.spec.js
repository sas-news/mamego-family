// SEACHARTGO — 海図碁: 盤の左右両辺中央が港。両港を自連で結ぶと航路完成+12。
const K = require('../gen_kit.js');
const ST = (init, extraDecl, extraReset) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = ${init};${extraDecl || ''}`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = ${init};${extraReset || ''}`],
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
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスで即採点終局
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
const SCORE_END = [
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
];
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false, route: {1: false, 2: false} }`;
module.exports = {
    file: 'seachartgo.html',
    en: 'SEACHARTGO',
    jp: '海図碁',
    prefix: 'seachartgo',
    desc: '盤の左右両辺中央が港。両港を自連で結ぶと航路完成+12。',
    kind: 'stone',
    icon: 'seachartgo',
    spec: [
        ...K.rb('SEACHARTGO', '海図碁', 'seachartgo'),
        K.params([
            { key: 'reef_pts', label: '礁の水路点', min: 0, max: 4, def: 1, unit: '点' },
            { key: 'route_bonus', label: '航路完成ボーナス', min: 0, max: 30, def: 12, unit: '点' },
        ]),
        ...ST(ST_INIT, `
        // 海図: 左右両辺の中央が港、その内側4点が礁
        const PORTS = [];
        const REEFS = new Set();
        const rebuildChart = () => {
            PORTS.length = 0; REEFS.clear();
            const c = (BOARD_SIZE - 1) / 2, q = Math.floor(BOARD_SIZE / 3);
            PORTS.push(c * BOARD_SIZE, c * BOARD_SIZE + BOARD_SIZE - 1);
            [q, BOARD_SIZE - 1 - q].forEach(x => [c - 2, c + 2].forEach(y => {
                if (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE) REEFS.add(y * BOARD_SIZE + x);
            }));
        };`, `
            rebuildChart();`),
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 礁への着手は水路点+1
            if (REEFS.has(move.cells[0].y * BOARD_SIZE + move.cells[0].x)) st.score[player] += Math.max(0, P('reef_pts') ?? 1);`],
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 航路: 着手した連が両港を結べば海図完成+12 (1回)
            const cIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            if (!st.route[player]) {
                const g = getConnectedGroup(cIdx, player);
                if (g.includes(PORTS[0]) && g.includes(PORTS[1])) {
                    st.route[player] = true;
                    st.score[player] += (P('route_bonus') ?? 12);
                }
            }

            turn = opponent;`],
        K.CUE_GRID(`            // 海図: 港と礁を描く
            {
                PORTS.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillStyle = 'rgba(14,116,144,0.5)';
                    ctx.fillRect(padding + x * cellSize - cellSize * 0.4, padding + y * cellSize - cellSize * 0.4, cellSize * 0.8, cellSize * 0.8);
                });
                REEFS.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.strokeStyle = 'rgba(8,145,178,0.6)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.moveTo(padding + x * cellSize - cellSize * 0.2, padding + y * cellSize + cellSize * 0.12);
                    ctx.lineTo(padding + x * cellSize, padding + y * cellSize - cellSize * 0.18);
                    ctx.lineTo(padding + x * cellSize + cellSize * 0.2, padding + y * cellSize + cellSize * 0.12);
                    ctx.stroke();
                });
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'航路 黒' + (st.route[1] ? '完成' : '未成') + ' / 白' + (st.route[2] ? '完成' : '未成')`),
        [K.ONE, K.INFO_BASE, `                        海図碁: 左右両辺の中央は港、内側の4点は礁(着手+1)。自分の連で両港を結ぶと航路完成+12 (1回)。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '左右両辺の中央点は港。内側4点の礁に置くと水路点+1。',
            '自分の連が両港をつなぐと航路完成で+12 (各局1回)。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = (BOARD_SIZE - 1) / 2;
        assert('港2つと礁4つ', PORTS.length === 2 && REEFS.size === 4);
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        executeMove({ cells: [{ x: Math.floor(BOARD_SIZE / 3), y: c - 2 }] }, 1);
        assert('礁で+1', st.score[1] === 1);
        for (let x = 0; x < BOARD_SIZE - 1; x++) board[I(x, c)] = 1;
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: c }] }, 1);
        assert('両港を結ぶと+12', st.route[1] === true && st.score[1] === 13);
    `,
};
