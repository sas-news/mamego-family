// FIBOGO — フィボ碁: 自分の着手で作った連のサイズがフィボナッチ数なら +2目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'fibogo.html',
    en: 'FIBOGO',
    jp: 'フィボ碁',
    prefix: 'fibogo',
    desc: '着手でできた連のサイズがフィボナッチ数 (2,3,5,8…) なら +2目。',
    kind: 'stone',
    icon: 'fibogo',
    spec: [
        ...K.rb('FIBOGO', 'フィボ碁', 'fibogo'),
        K.params([
            { key: 'fib_pts', label: 'フィボボーナス', min: 0, max: 10, def: 2, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 連サイズがフィボナッチ数 → +2目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // フィボ碁: 着手後の自軍連サイズがフィボナッチ数なら +2目
            {
                const __fi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const __seen = new Set([__fi]);
                const __q = [__fi];
                while (__q.length > 0) {
                    const __c = __q.shift();
                    getNeighbors(__c).forEach(__n => {
                        if (board[__n] === player && !__seen.has(__n)) { __seen.add(__n); __q.push(__n); }
                    });
                }
                const __FIB = { 2: 1, 3: 1, 5: 1, 8: 1, 13: 1, 21: 1, 34: 1, 55: 1, 89: 1, 144: 1, 233: 1 };
                if (__FIB[__seen.size]) {
                    st.bonus[player] = (st.bonus[player] || 0) + (P('fib_pts') || 2);
                    fxText(__fi, 'フィボ +' + (P('fib_pts') || 2), '#4ade80', 1100);
                    fxGlow(__fi, '#4ade80', 800);
                }
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        ...K.EVENT_CHIP_SPEC(`'フィボ +' + ((st.bonus && st.bonus[turn]) || 0) + '目'`),
        [K.ONE, K.INFO_ALGO, `            フィボ碁: 着手でできた連のサイズがフィボナッチ数なら +2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手の結果、自分の連のサイズがフィボナッチ数 (2,3,5,8,13,…) になると +2目。',
            '連をフィボ数に育てるか、相手の連をフィボ数にさせないか — サイズ管理の碁。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 } };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 連サイズ1 → 非対象
        assert('単石は非対象', st.bonus[1] === 0);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 連サイズ2 → フィボ
        assert('連サイズ2で+2', st.bonus[1] === 2);
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1); // 連サイズ3 → フィボ
        assert('連サイズ3で更に+2', st.bonus[1] === 4);
        executeMove({ cells: [{ x: 7, y: 4 }] }, 1); // 連サイズ4 → 非対象
        assert('連サイズ4は非対象', st.bonus[1] === 4);
    `,
};
