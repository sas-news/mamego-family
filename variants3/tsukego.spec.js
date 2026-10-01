// TSUKEGO — ツケ碁: 自軍に触れず敵石だけに接する「ツケ」はその敵石を封じる
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
const ST_INIT = `{ sealed: {} }`;
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
    file: 'tsukego.html',
    en: 'TSUKEGO',
    jp: 'ツケ碁',
    prefix: 'tsukego',
    desc: 'ツケ (自軍に触れず敵石だけに接する着手) で触れた敵石を「封じ」る — 封じられた石には隣接着手できない。',
    kind: 'stone',
    icon: 'tsukego',
    spec: [
        ...K.rb('TSUKEGO', 'ツケ碁', 'tsukego'),
        ...ST(ST_INIT),
        // 封じられた自軍石の隣接点には着手できない (封じは敵を拘束する)
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                const __vi = p.y * BOARD_SIZE + p.x;
                for (const __n of getNeighbors(__vi)) {
                    // 封じられた自軍石へのツケ増し (隣接着手) は禁止
                    if (st.sealed && st.sealed[__n] === player) return false;
                }
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }`],
        // ツケ: 自軍に一切触れず敵石にだけ接する着手 → 接した敵石を封じる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // ツケ碁: 自軍0・敵のみに接する着手は「ツケ」— 接した敵石を封じる
            {
                const __pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const __nbs = getNeighbors(__pi);
                const __ownAdj = __nbs.filter(__n => board[__n] === player).length;
                if (__ownAdj === 0) {
                    __nbs.filter(__n => board[__n] === opponent).forEach(__n => {
                        st.sealed[__n] = opponent;
                        fxText(__n, '封', '#c084fc', 1100);
                        fxGlow(__n, '#c084fc', 800);
                    });
                }
                // 取られた・取り返した石の封じを清掃
                for (const __k of Object.keys(st.sealed)) {
                    const __i = Number(__k);
                    if (board[__i] !== st.sealed[__k]) delete st.sealed[__k];
                }
            }

            turn = opponent;`],
        // 封じマーク: 石の上に紫の鍵印
        ...K.STONE_MARKS_SPEC(`            for (const __k of Object.keys(st.sealed || {})) {
                const __i = Number(__k);
                if (board[__i] !== st.sealed[__k]) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(192,132,252,0.95)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.055);
                ctx.beginPath();
                ctx.arc(__cx, __cy, cellSize * 0.16, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(__cx, __cy + cellSize * 0.16); ctx.lineTo(__cx, __cy + cellSize * 0.30);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            ツケ碁: 敵石だけに接する着手で敵石を封じる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自軍の石に触れず敵石だけに接する着手は「ツケ」。触れた敵石は封じられる。',
            '封じられた石は持ち主がその隣接点に打てない (連の他の石経由なら延びられる)。石を取れば封じは消える。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { sealed: {} };
        board[4 * BOARD_SIZE + 4] = 1; // 黒(4,4)孤立
        executeMove({ cells: [{ x: 4, y: 5 }] }, 2); // 白がツケ (自軍隣接なし・敵のみ)
        assert('ツケで敵石を封じる', st.sealed[4 * BOARD_SIZE + 4] === 1);
        assert('封じ石の隣接には持ち主が打てない', isValidPlacement([{ x: 3, y: 4 }], 1) === false);
        assert('封じた側は打てる', isValidPlacement([{ x: 3, y: 4 }], 2) === true);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1); // 無関係の場所は打てる
        assert('無関係の場所には打てる', board[8 * BOARD_SIZE + 8] === 1);
    `,
};
