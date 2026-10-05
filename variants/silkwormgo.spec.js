// SILKWORMGO — 養蚕碁: 石は蚕。桑畑で10手育つと繭を収穫して+1点、跡地は再利用できる
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
const ST_INIT = `{ worm: {}, score: { 1: 0, 2: 0 } }`;
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
    file: 'silkwormgo.html',
    en: 'SILKWORMGO',
    jp: '養蚕碁',
    prefix: 'silkwormgo',
    desc: '桑畑の蚕は10手で繭を収穫して+1点。跡地にはまた蚕を放てる。',
    kind: 'stone',
    icon: 'silkwormgo',
    spec: [
        ...K.rb('SILKWORMGO', '養蚕碁', 'silkwormgo'),
        K.params([
            { key: 'silk_age', label: '収穫までの手数', min: 3, max: 30, def: 10, unit: '手' },
            { key: 'silk_pts', label: '収穫の得点', min: 0, max: 5, def: 1, unit: '点' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 桑畑: 盤に2枚ある対称の桑畑 (蚕が糸を吐く)
        const SILK_SET = new Set();
        const SILK_AGE = 10; // 10手で繭を収穫
        {
            const m = Math.floor(BOARD_SIZE / 2);
            const a = Math.max(1, Math.floor(BOARD_SIZE * 0.22));
            [[a, BOARD_SIZE - 1 - a], [BOARD_SIZE - 1 - a, a]].forEach(([cx0, cy0]) => {
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (Math.abs(x - cx0) <= 1 && Math.abs(y - cy0) <= 1) SILK_SET.add(y * BOARD_SIZE + x);
                }
            });
        }`],
        // 毎手、桑畑の蚕が糸を吐く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 養蚕碁: 桑畑の蚕が糸を吐き、10手で繭を収穫 (+1点)
            SILK_SET.forEach(i => {
                if (board[i] === 1 || board[i] === 2) {
                    st.worm[i] = (st.worm[i] || 0) + 1;
                    if (st.worm[i] >= (P('silk_age') || SILK_AGE)) {
                        delete st.worm[i];
                        st.score[board[i]] += (P('silk_pts') ?? 1);
                        board[i] = 0;
                        fxBurst(i, '#fef3c7', 10, 1.2);
                        fxText(i, '収穫+1', '#fde68a', 1000);
                    }
                } else if (st.worm[i]) delete st.worm[i];
            });
            cleanUpPieces();

            turn = opponent;`],
        // 桑畑の描画
        K.CUE_GRID(`            // 桑畑: 緑の桑畑と葉影
            {
                ctx.save();
                SILK_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(34, 120, 50, 0.22)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    ctx.fillStyle = 'rgba(74, 160, 80, 0.5)';
                    ctx.beginPath();
                    ctx.ellipse(cx, cy - cellSize * 0.12, cellSize * 0.16, cellSize * 0.09, -0.5, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        // 糸を吐く蚕の輪
        ...K.STONE_MARKS_SPEC(`            // 育つ蚕: 糸の輪がまとわりつく
            Object.keys(st.worm).forEach(k => {
                const i = +k;
                if (board[i] !== 1 && board[i] !== 2) return;
                const n = st.worm[i];
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(253, 230, 138, ' + (0.25 + n / (P('silk_age') || SILK_AGE) * 0.6) + ')';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * (0.4 - n / (P('silk_age') || SILK_AGE) * 0.1), 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            });`),
        // 採点: 収穫点をアゲハマ相当で加算
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._silkDone) {
                st._silkDone = true;
                captures[1] += st.score[1] || 0;
                captures[2] += st.score[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'収穫 黒' + st.score[1] + ' / 白' + st.score[2]`),
        [K.ONE, K.INFO_BASE, `            養蚕碁: 桑畑の蚕は10手で繭を収穫して+1点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の対角に2枚の桑畑がある。',
            '桑畑の蚕は10手で繭を収穫 — 持ち主に+1点。収穫後の跡地にはまた蚕を放てる。',
            '桑畑を耕すか、敵の蚕を取り崩すか。両者同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('桑畑がある', SILK_SET.size === 18);
        // 桑畑の蚕が繭を収穫する
        board.fill(0); pieces = []; history.length = 0; st.worm = {}; st.score = { 1: 0, 2: 0 };
        const c = [...SILK_SET][0];
        board[c] = 2;
        st.worm[c] = SILK_AGE - 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('繭を収穫して+1点', st.score[2] === 1 && board[c] === 0);
        // 畑の外の蚕は収穫しない
        board.fill(0); history.length = 0; st.worm = {}; st.score = { 1: 0, 2: 0 };
        const mid = Math.floor(BOARD_SIZE / 2);
        board[I(mid, mid)] = 1;
        executeMove({ cells: [{ x: mid, y: 0 }] }, 2);
        assert('畑外は収穫しない', st.score[1] === 0 && board[I(mid, mid)] === 1);
    `,
};
