// BREWGO — 醸造碁: 石は麹。醸造槽に12手浸かると酒に変わり、終局時1個1点になる
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
const ST_INIT = `{ brew: {}, sake: [] }`; // brew: 槽内の熟成カウント, sake: 酒になった石
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
    file: 'brewgo.html',
    en: 'BREWGO',
    jp: '醸造碁',
    prefix: 'brewgo',
    desc: '盤の醸造槽。麹の石が12手浸かると酒に変わり、終局時1個1点になる。',
    kind: 'stone',
    icon: 'brewgo',
    spec: [
        ...K.rb('BREWGO', '醸造碁', 'brewgo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 醸造槽: 盤に2棟ある対称の仕込み樽 (石を酒に変える)
        const BREW_SET = new Set();
        const BREW_AGE = 12; // 12手浸かると酒に変わる
        {
            const m = Math.floor(BOARD_SIZE / 2);
            const a = Math.max(1, Math.floor(BOARD_SIZE * 0.20));
            [[a, a], [BOARD_SIZE - 1 - a, BOARD_SIZE - 1 - a]].forEach(([cx0, cy0]) => {
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (Math.abs(x - cx0) <= 1 && Math.abs(y - cy0) <= 1) BREW_SET.add(y * BOARD_SIZE + x);
                }
            });
        }`],
        // 毎手、槽内の石が熟成する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 醸造碁: 槽内の麹が熟成し、12手で酒に変わる
            BREW_SET.forEach(i => {
                if (board[i] === 1 || board[i] === 2) {
                    if (st.sake.includes(i)) return;
                    st.brew[i] = (st.brew[i] || 0) + 1;
                    if (st.brew[i] >= BREW_AGE) {
                        st.sake.push(i);
                        delete st.brew[i];
                        fxGlow(i, '#f59e0b', 800);
                        fxText(i, '酒!', '#f59e0b', 1000);
                    }
                } else if (st.brew[i]) delete st.brew[i];
            });
            for (let i = st.sake.length - 1; i >= 0; i--) {
                if (board[st.sake[i]] !== 1 && board[st.sake[i]] !== 2) st.sake.splice(i, 1);
            }

            turn = opponent;`],
        // 醸造槽の描画
        K.CUE_GRID(`            // 醸造槽: 杉玉のある仕込み樽
            {
                ctx.save();
                BREW_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(146, 64, 14, 0.28)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(120, 53, 15, 0.5)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        // 酒になった石の印
        ...K.STONE_MARKS_SPEC(`            // 酒の石: 琥珀の滴印
            st.sake.forEach(i => {
                if (board[i] !== 1 && board[i] !== 2) return;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.16);
                ctx.quadraticCurveTo(cx + cellSize * 0.14, cy + cellSize * 0.06, cx, cy + cellSize * 0.2);
                ctx.quadraticCurveTo(cx - cellSize * 0.14, cy + cellSize * 0.06, cx, cy - cellSize * 0.16);
                ctx.fill();
                ctx.restore();
            });`),
        // 採点: 残った酒は1個1点
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._sakeDone) {
                st._sakeDone = true;
                st.sake.forEach(i => { if (board[i] === 1 || board[i] === 2) captures[board[i]]++; });
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'酒 ' + st.sake.filter(i => board[i] === 1 || board[i] === 2).length + '個'`),
        [K.ONE, K.INFO_ALGO, `            醸造碁: 仕込み樽に12手浸かった麹は酒になる (終局時1個1点)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の対角に2つの仕込み樽 (醸造槽) がある。',
            '槽の中に12手浸かった麹の石は酒に変わる (琥珀の滴印)。終局時に1個1点の加点。',
            '槽を守って醸すか、敵の麹を引きずり出すか。両者同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('仕込み樽がある', BREW_SET.size === 18);
        // 槽内の石が熟成して酒になる
        board.fill(0); pieces = []; history.length = 0; st.brew = {}; st.sake = [];
        const c = [...BREW_SET][0];
        board[c] = 1;
        st.brew[c] = BREW_AGE - 1;
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 }] }, 2);
        assert('熟成して酒になる', st.sake.includes(c));
        // 槽外の石は熟成しない
        board.fill(0); history.length = 0; st.brew = {}; st.sake = [];
        const mid = Math.floor(BOARD_SIZE / 2);
        board[I(mid, mid)] = 1;
        executeMove({ cells: [{ x: 0, y: mid }] }, 2);
        assert('槽外は熟成しない', !st.sake.length);
    `,
};
