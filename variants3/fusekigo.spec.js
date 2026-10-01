// FUSEKIGO — 布石碁: 序盤は着手ごとに +1目、終盤は取り石が +1目ずつ加点
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'fusekigo.html',
    en: 'FUSEKIGO',
    jp: '布石碁',
    prefix: 'fusekigo',
    desc: '布石 (序盤18手) は1手ごとに +1目。以後の終盤戦では取り石1個が +1目。',
    kind: 'stone',
    icon: 'fusekigo',
    spec: [
        ...K.rb('FUSEKIGO', '布石碁', 'fusekigo'),
        ...ST(ST_INIT),
        // 序盤18手は着手ボーナス、以後はアゲハマが各+1目上乗せ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 布石碁: 序盤 (18手まで) は着手ごとに +1目
            if (history.length <= 18) {
                const __pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.bonus[player] = (st.bonus[player] || 0) + 1;
                fxText(__pi, '布石 +1', '#f59e0b', 800);
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        ...K.EVENT_CHIP_SPEC(`history.length <= 18 ? '布石 +' + ((st.bonus && st.bonus[turn]) || 0) + '目' : ''`),
        [K.ONE, K.INFO_ALGO, `            布石碁: 序盤18手は1手ごとに +1目。終盤は取り石が点数を伸ばす<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '布石 (序盤18手) は広く打つだけで1手 +1目 — 序盤の構築が点数になる。',
            '以後は通常の地とアゲハマ勝負。序盤の稼ぎを終盤で守り切る碁。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 } };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('序盤着手で+1目', st.bonus[1] === 1);
        executeMove({ cells: [{ x: 10, y: 10 }] }, 2);
        assert('白も序盤着手で+1目', st.bonus[2] === 1);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('累積する', st.bonus[1] === 2);
    `,
};
