// HANEGO — ハネ碁: 敵石2枚の間に突き出すハネは局部的に強く +2目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'hanego.html',
    en: 'HANEGO',
    jp: 'ハネ碁',
    prefix: 'hanego',
    desc: '対向する敵石の間へのハネ (突き出し) は局所的に強く +2目。',
    kind: 'stone',
    icon: 'hanego',
    spec: [
        ...K.rb('HANEGO', 'ハネ碁', 'hanego'),
        K.params([
            { key: 'hane_bonus', label: 'ハネボーナス', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // ハネ判定: 着手点の左右 or 上下の両側が敵石 → +2目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // ハネ碁: 着手点の対向2辺 (左右 or 上下) が両方敵石ならハネ成立で +2目
            {
                const __p = move.cells[0];
                const __pi = __p.y * BOARD_SIZE + __p.x;
                const __e = BOARD_SIZE - 1;
                const __at = (x, y) => (x < 0 || x > __e || y < 0 || y > __e) ? 0 : board[y * BOARD_SIZE + x];
                const __haneW = __at(__p.x - 1, __p.y) === opponent && __at(__p.x + 1, __p.y) === opponent;
                const __haneH = __at(__p.x, __p.y - 1) === opponent && __at(__p.x, __p.y + 1) === opponent;
                if (__haneW || __haneH) {
                    st.bonus[player] = (st.bonus[player] || 0) + (P('hane_bonus') || 2);
                    fxText(__pi, 'ハネ +' + (P('hane_bonus') || 2), '#f472b6', 1100);
                    fxShake(__pi, '#f472b6', 600);
                }
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        [K.ONE, K.INFO_BASE, `            ハネ碁: 敵石2枚の間に突き出すと +2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            'ハネ (敵石に挟まれた急所への突き出し) は局所的に強い手筋。',
            '着手点の左右または上下が両方とも敵石ならハネ成立で +2目。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 } };
        board[4 * BOARD_SIZE + 3] = 2; board[4 * BOARD_SIZE + 5] = 2; // (3,4)と(5,4)に白
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 左右敵石の間へのハネ
        assert('ハネで+2目', st.bonus[1] === 2);
        board[8 * BOARD_SIZE + 8] = 2; // 片側のみ敵
        executeMove({ cells: [{ x: 8, y: 9 }] }, 1); // 上下の上側のみ敵
        assert('片側だけではハネ非成立', st.bonus[1] === 2);
        // 白の上下ハネ: (10,2)と(10,4)に黒、(10,3)に白 → 上下が敵
        board[2 * BOARD_SIZE + 10] = 1; board[4 * BOARD_SIZE + 10] = 1;
        executeMove({ cells: [{ x: 10, y: 3 }] }, 2);
        assert('白も上下ハネで+2目', st.bonus[2] === 2);
    `,
};
