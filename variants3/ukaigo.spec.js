// UKAIGO — 鵜飼碁: 敵石を獲るたび鵜が鮎を咥えて+1 (最大5)。終局時に加算される
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
const ST_INIT = `{ ukai: { 1: 0, 2: 0 }, birds: {} }`;
module.exports = {
    file: 'ukaigo.html',
    en: 'UKAIGO',
    jp: '鵜飼碁',
    prefix: 'ukaigo',
    desc: '獲った側の着手石は鵜になる。捕獲のたび+1 (最大5) の鮎を咥える。',
    kind: 'stone',
    icon: 'ukaigo',
    spec: [
        ...K.rb('UKAIGO', '鵜飼碁', 'ukaigo'),
        ...ST(ST_INIT),
        // 鵜飼: 捕獲した手は鵜となり鮎+1 (最大5)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                // 鵜飼: 捕獲成功で着手石が鵜に。鮎+1 (最大5)
                st.ukai[player] = Math.min(5, st.ukai[player] + 1);
                st.birds[move.cells[0].y * BOARD_SIZE + move.cells[0].x] = player;
                fxText(captured[0], '鮎!', '#38bdf8', 1000);
                fxGlow(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '#f59e0b', 700);
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 鮎集計: 鵜が咥えた鮎を加算
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 鵜飼ルール: 鵜が咥えた鮎を得点に加算
            territory.black += st.ukai[1];
            territory.white += st.ukai[2];`],
        ...K.STONE_MARKS_SPEC(`            // 鵜: 石の上に小さな鳥影
            {
                ctx.save();
                Object.keys(st.birds || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.16, cy + cellSize * 0.08);
                    ctx.lineTo(cx, cy - cellSize * 0.14);
                    ctx.lineTo(cx + cellSize * 0.16, cy + cellSize * 0.08);
                    ctx.lineTo(cx, cy + cellSize * 0.0);
                    ctx.closePath();
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'鵜 黒' + (st.ukai ? st.ukai[1] : 0) + ' 白' + (st.ukai ? st.ukai[2] : 0)`),
        [K.ONE, K.INFO_ALGO, `            鵜飼碁: 敵石を獲るたび鵜が鮎を咥えて+1 (最大5、終局時加算)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵石を捕獲した着手は「鵜」になる。捕獲が成功するたび鮎を1尾咥え (最大5尾)、終局時に得点へ加算。',
            '鵜は双方同じ数だけ働く。獲り合いの腕がそのまま漁獲になる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.ukai = { 1: 0, 2: 0 }; st.birds = {};
        board[I(5, 0)] = 2; board[I(4, 0)] = 1; board[I(6, 0)] = 1;
        executeMove({ cells: [{ x: 5, y: 1 }] }, 1); // 白を取る
        assert('白を取れた', captures[1] === 1);
        assert('鵜が鮎を咥えた', st.ukai[1] === 1);
        assert('着手石が鵜になった', st.birds[I(5, 1)] === 1);
        board.fill(0); pieces = []; history.length = 0;
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
