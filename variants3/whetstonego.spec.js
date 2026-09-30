// WHETSTONEGO — 研師碁: 盤の砥石(区域)に隣接して打つと石が研がれて切れ味が上がる (捕獲力+1)
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
const ST_INIT = `{ sharp: {}, score: { 1: 0, 2: 0 }, _end: false }`;
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
    file: 'whetstonego.html',
    en: 'WHETSTONEGO',
    jp: '研師碁',
    prefix: 'whetstonego',
    desc: '石は刃物。砥石に隣接して打つと研がれ、研がれた石を取られると相手に+1の切れ味点。',
    kind: 'stone',
    icon: 'whetstonego',
    spec: [
        ...K.rb('WHETSTONEGO', '研師碁', 'whetstonego'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 砥石: 盤の四辺に2箇所ずつ (1マスの研磨面)
        let WHET = new Set();
        function rebuildWhet() {
            WHET = new Set();
            const n = BOARD_SIZE, m = Math.floor(n / 2), q = Math.max(1, Math.floor(n / 4));
            [ [q, 0], [n - 1 - q, 0], [q, n - 1], [n - 1 - q, n - 1],
              [0, q], [0, n - 1 - q], [n - 1, q], [n - 1, n - 1 - q] ]
                .forEach(([x, y]) => WHET.add(y * n + x));
        }
        function nearWhet(i) {
            return getNeighbors(i).some(n => WHET.has(n));
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            rebuildWhet();`],
        // 研ぎ: 砥石に隣接して打った石は「切れた」状態になる
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => {
                const pi = p.y * BOARD_SIZE + p.x;
                if (nearWhet(pi)) {
                    st.sharp[pi] = player;
                    fxGlow(pi, '#a5f3fc', 700);
                }
            });`],
        // 切れ味: 研がれた石を取ると取った側に+1の切れ味点
        [K.ONE, K.CAPTURE_BLOCK, K.CAPTURE_BLOCK + `
            // 切れ味: 研がれた石を取ると切れ味点+1
            captured.forEach(idx => {
                if (st.sharp[idx]) {
                    st.score[player]++;
                    delete st.sharp[idx];
                    fxText(idx, '切れ味+1', '#22d3ee', 1100);
                }
            });`],
        // 砥石の描画: 灰色の研磨面 + 砥石特有の筋
        K.CUE_GRID(`            // 砥石: 四辺の灰色の研磨面
            {
                ctx.save();
                WHET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const g = ctx.createLinearGradient(cx - cellSize * 0.5, cy, cx + cellSize * 0.5, cy);
                    g.addColorStop(0, 'rgba(140,140,150,0.5)');
                    g.addColorStop(0.5, 'rgba(200,200,210,0.6)');
                    g.addColorStop(1, 'rgba(140,140,150,0.5)');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(90,90,100,0.7)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    for (let s = -1; s <= 1; s++) {
                        ctx.beginPath();
                        ctx.moveTo(cx - cellSize * 0.35, cy + s * cellSize * 0.16);
                        ctx.lineTo(cx + cellSize * 0.35, cy + s * cellSize * 0.16);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }`),
        // 研がれた石の印: 青白い刃の筋
        ...K.STONE_MARKS_SPEC(`            // 研がれた石: 青白い刃の筋を引く
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(165,243,252,0.9)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.06);
                ctx.lineCap = 'round';
                Object.keys(st.sharp).forEach(k => {
                    const i = +k;
                    if (board[i] !== st.sharp[k]) return;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.18, cy + cellSize * 0.12);
                    ctx.lineTo(cx + cellSize * 0.18, cy - cellSize * 0.12);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        // 切れ味点を終局時にアゲハマ相当で加算
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
        ...K.EVENT_CHIP_SPEC(`'切れ味 黒' + st.score[1] + ' / 白' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `            研師碁: 砥石に隣接して打つと石が研がれる (青白い筋)。研がれた石を取ると切れ味+1点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '四辺の灰色セルは砥石。砥石に隣接して打った石は研がれて切れ味が上がる。',
            '研がれた石を取ると切れ味点+1 (終局時にアゲハマ相当で加算) — 鋭い刃ほど取りがいがある。',
            '研ぎは双方同じ条件。自分の石を研ぐと取られても相手に得点が入る諸刃の剣。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('砥石が8つ', WHET.size === 8);
        const w = [...WHET][0];
        const wx = w % BOARD_SIZE, wy = (w / BOARD_SIZE) | 0;
        const nbr = getNeighbors(w)[0];
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.sharp = {}; st.score = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: nbr % BOARD_SIZE, y: (nbr / BOARD_SIZE) | 0 }] }, 1);
        assert('砥石脇に打つと研がれる', st.sharp[nbr] === 1);
        board[I(nbr % BOARD_SIZE, (nbr / BOARD_SIZE) | 0)] = 0; st.sharp = {};
        // 切れ味点の検証: 研がれた白石を取る
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.score = { 1: 0, 2: 0 };
        board[I(5, 5)] = 2; st.sharp[I(5, 5)] = 2;
        board[I(5, 4)] = 1; board[I(4, 5)] = 1; board[I(6, 5)] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('研がれた石を取ると切れ味+1', captures[1] === 1 && st.score[1] === 1);
    `,
};
