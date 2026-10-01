// KEIMAGO — ケイマ碁: 自軍石から桂馬飛び (1×2) の点に置くと +1目
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 } }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'keimago.html',
    en: 'KEIMAGO',
    jp: 'ケイマ碁',
    prefix: 'keimago',
    desc: '自軍石から桂馬飛び (1×2) の点に置くケイマは速く +1目。',
    kind: 'stone',
    icon: 'keimago',
    spec: [
        ...K.rb('KEIMAGO', 'ケイマ碁', 'keimago'),
        K.params([
            { key: 'keima_pts', label: 'ケイマの得点', min: 0, max: 6, def: 1, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // ケイマ: 自軍石から (±1,±2)/(±2,±1) オフセットの着手 → +1目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // ケイマ碁: 自軍石から桂馬の飛び先に置くと +1目
            {
                const __p = move.cells[0];
                const __pi = __p.y * BOARD_SIZE + __p.x;
                const __e = BOARD_SIZE - 1;
                const __at = (x, y) => (x < 0 || x > __e || y < 0 || y > __e) ? 0 : board[y * BOARD_SIZE + x];
                const __off = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
                const __keima = __off.some(([dx, dy]) => __at(__p.x + dx, __p.y + dy) === player);
                if (__keima) {
                    st.bonus[player] = (st.bonus[player] || 0) + (P('keima_pts') ?? 1);
                    fxText(__pi, 'ケイマ +' + (P('keima_pts') ?? 1), '#4ade80', 1000);
                    fxGlow(__pi, '#4ade80', 700);
                }
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        [K.ONE, K.INFO_ALGO, `            ケイマ碁: 自軍石から桂馬飛びに置くと +1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自軍の石から将棋の桂馬の飛び先 (1×2) に置く「ケイマ」は +1目。',
            'ケイマは速いが石同士は直接繋がっていない — 切られやすさはそのまま。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 } };
        board[4 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1); // (4,4)から桂馬飛び
        assert('ケイマで+1目', st.bonus[1] === 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2); // ケイマでない着手
        assert('ケイマ以外は無ボーナス', st.bonus[2] === 0);
        executeMove({ cells: [{ x: 8, y: 11 }] }, 2); // (9,9)から桂馬飛び (8,11)
        assert('白もケイマで+1目', st.bonus[2] === 1);
    `,
};
