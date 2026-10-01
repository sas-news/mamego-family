// NARIKOMAGO — 成駒碁: 敵陣最深部 (相手側3列) に打った石は「成って」金将相当 +2目
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 }, promo: {} }`;
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
    file: 'narikomago.html',
    en: 'NARIKOMAGO',
    jp: '成駒碁',
    prefix: 'narikomago',
    desc: '敵陣最深部 (相手側3列) に打ち込んだ石は「成」って金の輝き +2目。',
    kind: 'stone',
    icon: 'narikomago',
    spec: [
        ...K.rb('NARIKOMAGO', '成駒碁', 'narikomago'),
        ...ST(ST_INIT),
        // 成駒: 敵陣3列に着手 → 成駒化 +2目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 成駒碁: 敵陣最深部 (黒は下3列・白は上3列) に打つと成駒 +2目
            {
                const __p = move.cells[0];
                const __pi = __p.y * BOARD_SIZE + __p.x;
                const __zone = player === 1 ? (__p.y >= BOARD_SIZE - 3) : (__p.y <= 2);
                if (__zone && !st.promo[__pi]) {
                    st.promo[__pi] = 1;
                    st.bonus[player] = (st.bonus[player] || 0) + 2;
                    fxText(__pi, '成 +2', '#fbbf24', 1100);
                    fxGlow(__pi, '#fbbf24', 800);
                }
            }

            turn = opponent;`],
        // 成駒マーク: 金色リング
        ...K.STONE_MARKS_SPEC(`            for (const __k of Object.keys(st.promo || {})) {
                const __i = Number(__k);
                if (board[__i] === 0) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                ctx.save();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(__cx, __cy, cellSize * 0.26, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        [K.ONE, K.INFO_ALGO, `            成駒碁: 敵陣最深部に打つと石が成って +2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵陣最深部 (黒は下3列・白は上3列) に打ち込んだ石は「成駒」となり +2目。',
            '成駒は金の輝きを放つ — 深く打ち込むほど得するが、敵地で生き残るのは難しい。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, promo: {} };
        executeMove({ cells: [{ x: 5, y: BOARD_SIZE - 1 }] }, 1); // 黒は最下段で成る
        assert('敵陣最深部で成駒+2', st.bonus[1] === 2 && st.promo[5 + (BOARD_SIZE - 1) * BOARD_SIZE] === 1);
        executeMove({ cells: [{ x: 5, y: 0 }] }, 2); // 白は最上段で成る
        assert('白も敵陣で成駒+2', st.bonus[2] === 2);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 中央は成らない
        assert('中央は成らない', st.bonus[1] === 2);
    `,
};
