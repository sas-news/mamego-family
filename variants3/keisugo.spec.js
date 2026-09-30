// KEISUGO — 磬子碁: 自分の5手ごとに磬(けいす)が鳴り、法会の節目として+3目の功徳
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
const ST_INIT = `{ pcnt: { 1: 0, 2: 0 } }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'keisugo.html',
    en: 'KEISUGO',
    jp: '磬子碁',
    prefix: 'keisugo',
    desc: '自分の5手ごとに磬(けいす)が鳴る。法会の節目に功徳として+3目のアゲハマ。',
    kind: 'stone',
    icon: 'keisugo',
    spec: [
        ...K.rb('KEISUGO', '磬子碁', 'keisugo'),
        ...ST(ST_INIT),
        // 磬: 自分の5手ごとに鳴って+3
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 磬子ルール: 自分の5手ごとに磬が鳴り節目の功徳 +3
            st.pcnt[player] = (st.pcnt[player] || 0) + 1;
            if (st.pcnt[player] % 5 === 0) {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                captures[player] += 3;
                fxGlow(mi, '#a5b4fc', 900);
                fxText(mi, '磬 +3', '#818cf8', 1300);
                fxShake(3, 260);
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'磬まで ' + (5 - (st.pcnt[turn] % 5)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            磬子碁: 自分の5手ごとに磬が鳴り、法会の節目として+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の着手を数えて5手ごとに磬(けいす=法会の鉦)が鳴り、節目の功徳として+3目のアゲハマ。',
            '両者が同じ周期で鳴らす対称ルール — 節目の手を取り・逃げに使い分けろ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.pcnt = { 1: 0, 2: 0 };
        for (let i = 0; i < 4; i++) executeMove({ cells: [{ x: i * 2, y: 0 }] }, 1);
        assert('4手ではまだ鳴らない', captures[1] === 0);
        executeMove({ cells: [{ x: 8, y: 0 }] }, 1);
        assert('5手目で磬が鳴る', captures[1] === 3);
        for (let i = 0; i < 5; i++) executeMove({ cells: [{ x: i * 2, y: 4 }] }, 2);
        assert('白も対称に鳴る', captures[2] === 3);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
