// SALTFIELDGO — 塩田碁: 盤の塩田に石を引き込むと結晶が育つ。結晶1個につき+1点
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
const ST_INIT = `{ salt: [], score: { 1: 0, 2: 0 } }`; // salt: 結晶化した石
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
    file: 'saltfieldgo.html',
    en: 'SALTFIELDGO',
    jp: '塩田碁',
    prefix: 'saltfieldgo',
    desc: '盤の両端に塩田。10手ごとの天日で、田の中の石が塩の結晶になって+1点。',
    kind: 'stone',
    icon: 'saltfieldgo',
    spec: [
        ...K.rb('SALTFIELDGO', '塩田碁', 'saltfieldgo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 塩田: 盤の上下に2枚の結晶田 (天日で塩が育つ)
        const SALT_SET = new Set();
        {
            const m = Math.floor(BOARD_SIZE / 2);
            for (let x = Math.floor(BOARD_SIZE * 0.25); x <= Math.ceil(BOARD_SIZE * 0.72); x++) {
                SALT_SET.add(1 * BOARD_SIZE + x);
                SALT_SET.add((BOARD_SIZE - 2) * BOARD_SIZE + x);
            }
        }`],
        // 10手ごとの天日: 田の中の石が結晶化して+1点
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 塩田碁: 10手ごとの天日で田の石が塩の結晶になる (+1点)
            if (history.length > 0 && history.length % 10 === 0) {
                SALT_SET.forEach(i => {
                    if ((board[i] === 1 || board[i] === 2) && !st.salt.includes(i)) {
                        st.salt.push(i);
                        st.score[board[i]]++;
                        fxBurst(i, '#e0f2fe', 10, 1.3);
                        fxText(i, '結晶+1', '#38bdf8', 1000);
                    }
                });
                for (let i = st.salt.length - 1; i >= 0; i--) {
                    if (board[st.salt[i]] !== 1 && board[st.salt[i]] !== 2) st.salt.splice(i, 1);
                }
            }

            turn = opponent;`],
        // 塩田の描画
        K.CUE_GRID(`            // 塩田: 白い結晶田の畦
            {
                ctx.save();
                SALT_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(224, 242, 254, 0.30)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        // 結晶の輝き
        ...K.STONE_MARKS_SPEC(`            // 塩の結晶: 白い結晶の輝き
            st.salt.forEach(i => {
                if (board[i] !== 1 && board[i] !== 2) return;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.26);
                ctx.lineTo(cx + cellSize * 0.18, cy - cellSize * 0.08);
                ctx.lineTo(cx + cellSize * 0.18, cy + cellSize * 0.14);
                ctx.lineTo(cx, cy + cellSize * 0.28);
                ctx.lineTo(cx - cellSize * 0.18, cy + cellSize * 0.14);
                ctx.lineTo(cx - cellSize * 0.18, cy - cellSize * 0.08);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            });`),
        // 採点: 結晶点をアゲハマ相当で加算
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._saltDone) {
                st._saltDone = true;
                captures[1] += st.score[1] || 0;
                captures[2] += st.score[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'結晶 黒' + st.score[1] + ' / 白' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `            塩田碁: 上下の塩田で10手ごとに結晶が育ち+1点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の上下に塩田 (白い結晶田) がある。',
            '10手ごとの天日で、田の中の石が塩の結晶になって持ち主に+1点 (1石1回)。',
            '結晶田を巡る取り合い — 両者同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('塩田がある', SALT_SET.size > 4);
        // 天日で結晶化して+1点
        board.fill(0); pieces = []; history.length = 0; st.salt = []; st.score = { 1: 0, 2: 0 };
        const c = [...SALT_SET][0];
        board[c] = 1;
        history.length = 9; // 次の手で10手目の天日
        executeMove({ cells: [{ x: 0, y: Math.floor(BOARD_SIZE / 2) }] }, 2);
        assert('結晶化して+1点', st.salt.includes(c) && st.score[1] === 1);
        // 田の外は結晶化しない
        board.fill(0); history.length = 9; st.salt = []; st.score = { 1: 0, 2: 0 };
        const mid = Math.floor(BOARD_SIZE / 2);
        board[I(mid, mid)] = 2;
        executeMove({ cells: [{ x: 0, y: mid }] }, 1);
        assert('田外は結晶しない', st.score[2] === 0);
    `,
};
