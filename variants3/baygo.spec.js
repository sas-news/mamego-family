// BAYGO — 湾岸碁: 盤は湾岸線。船着き場 ( Wharf ) に石を入港させると得点
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
    file: 'baygo.html',
    en: 'BAYGO',
    jp: '湾岸碁',
    prefix: 'baygo',
    desc: '湾岸線の盤。船着き場に石を入港させるごとに+1点。',
    kind: 'stone',
    icon: 'baygo',
    spec: [
        ...K.rb('BAYGO', '湾岸碁', 'baygo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 湾岸: 左上が海 (x+y<SHORE)、海岸線 x+y==SHORE が船着き場
        const BAY_SHORE = Math.round(BOARD_SIZE * 0.75);
        const WHARF_SET = new Set();
        for (let x = 0; x < BOARD_SIZE; x++) {
            const y = BAY_SHORE - x;
            if (y >= 0 && y < BOARD_SIZE) WHARF_SET.add(y * BOARD_SIZE + x);
        }
        function isSea(x, y) { return x + y < BAY_SHORE; }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (isSea(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 海と波
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        // 入港: 船着き場に置くと+1点
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => {
                const wi = p.y * BOARD_SIZE + p.x;
                if (WHARF_SET.has(wi)) {
                    st.score[player]++;
                    fxGlow(wi, '#fbbf24', 800);
                    fxText(wi, '+入港', '#fbbf24', 1100);
                }
            });`],
        // 船着き場の描画: 木の桟橋
        K.CUE_GRID(`            // 船着き場: 桟橋の木板と係留杭
            {
                ctx.save();
                WHARF_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(146, 104, 56, 0.45)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(82, 56, 28, 0.8)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.32, cy - cellSize * 0.32);
                    ctx.lineTo(cx + cellSize * 0.32, cy + cellSize * 0.32);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        // 得点をアゲハマ相当点として終局時に加算
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
        [K.ONE, K.INFO_ALGO, `            湾岸碁: 左上は海。海岸線の船着き場に石を入港させると+1点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の左上は海 (着手不可・呼吸なし)。斜めの海岸線が船着き場。',
            '船着き場の点に石を置くと「入港」して+1点 (終局時にアゲハマ相当で加算)。',
            '海際の取り合いと入港ポイントの両立が勝負。両者同じ岸を使う。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('海がある', board[I(0, 0)] === 3 && isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('船着き場がある', WHARF_SET.size >= 3);
        const wi = [...WHARF_SET][0];
        st.score = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: wi % BOARD_SIZE, y: (wi / BOARD_SIZE) | 0 }] }, 1);
        assert('入港で+1点', st.score[1] === 1);
    `,
};
