// TRIALGO — 試練碁: 四辺の中点は試練の関門。そこに自石を通した側は+2目 (各関門1回)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
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
const ST_INIT = `{ cleared: {} }`;
module.exports = {
    file: 'trialgo.html',
    en: 'TRIALGO',
    jp: '試練碁',
    prefix: 'trialgo',
    desc: '四辺の中点が関門。関門に自石を置けば+2目 (各関門1回・両者奪い合い)。',
    kind: 'stone',
    icon: 'trialgo',
    spec: [
        ...K.rb('TRIALGO', '試練碁', 'trialgo'),
        K.params([
            { key: 'gate_bonus', label: '関門突破ボーナス', min: 1, max: 8, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 補助関数をページスコープへ注入
        [K.ONE, `        function executeMove(move, player) {`, `        // 試練の関門: 四辺の中点
const TRIALS = (() => {
    const c = Math.floor(BOARD_SIZE / 2);
    return [c, BOARD_SIZE - 1 - c + c * 0, 0].length && [
        0 * BOARD_SIZE + c, (BOARD_SIZE - 1) * BOARD_SIZE + c, c * BOARD_SIZE + 0, c * BOARD_SIZE + (BOARD_SIZE - 1),
    ];
})();

        function executeMove(move, player) {`],

        // 関門の描画
        K.CUE_STARS(`            // 試練の関門: 鳥居のような朱門
            {
                ctx.save();
                TRIALS.forEach(i => {
                    if (st.cleared[i]) return;
                    if (board[i] !== 0) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(220,60,60,0.7)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.28, cy - cellSize * 0.18);
                    ctx.lineTo(cx + cellSize * 0.28, cy - cellSize * 0.18);
                    ctx.moveTo(cx - cellSize * 0.18, cy - cellSize * 0.18);
                    ctx.lineTo(cx - cellSize * 0.18, cy + cellSize * 0.22);
                    ctx.moveTo(cx + cellSize * 0.18, cy - cellSize * 0.18);
                    ctx.lineTo(cx + cellSize * 0.18, cy + cellSize * 0.22);
                    ctx.stroke();
                    ctx.restore();
                    ctx.save();
                });
                ctx.restore();
            }`),
        // 関門突破: 関門に自石を置けば+2目 (各関門1回)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 試練碁: 関門に自石があれば突破で+2目 (各関門1回)
            TRIALS.forEach(i => {
                if (!st.cleared[i] && board[i] === player) {
                    st.cleared[i] = player;
                    captures[player] += P('gate_bonus') || 2;
                    fxText(i, '突破 +' + (P('gate_bonus') || 2) + '目!', '#f87171', 1200);
                    fxGlow(i, '#f87171', 850);
                }
            });

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'関門 ' + Object.keys(st.cleared || {}).length + '/4'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            試練碁: 四辺の中点が関門。関門に自石を置いた側は+2目 (各関門1回・置いた時点で確定)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の四辺の中点に4つの関門 (朱門) がある。関門に自分の石を置けば+2目。',
            '各関門は1回のみ — 置いた時点で突破確定 (その後取られても点は戻らない)。',
            '辺は呼吸が浅い難所。危険な関門を先に通るか、堅い地を取るか。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.cleared = {};
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: 0 }] }, 1); // 上辺の関門
        assert('関門突破で+2目', captures[1] === 2 && st.cleared[c] === 1);
        executeMove({ cells: [{ x: c, y: BOARD_SIZE - 1 }] }, 2); // 下辺
        assert('白も関門を通せる', captures[2] === 2);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('既突破の関門は再加点なし', captures[1] === 2);
    `,
};
