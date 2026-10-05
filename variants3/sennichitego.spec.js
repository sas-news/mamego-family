// SENNICHITEGO — 千日碁: 同一局面が3回現れたら千日手で引き分け
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
const ST_INIT = `{ seen: {} }`;
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
    file: 'sennichitego.html',
    en: 'SENNICHITEGO',
    jp: '千日碁',
    prefix: 'sennichitego',
    desc: '同一局面が3回現れたら千日手で引き分け (局面検出付き)。',
    kind: 'stone',
    icon: 'sennichitego',
    spec: [
        ...K.rb('SENNICHITEGO', '千日碁', 'sennichitego'),
        K.params([
            { key: 'repeat_max', label: '千日手になる繰り返し回数', min: 2, max: 6, def: 3, unit: '回' },
        ]),
        ...ST(ST_INIT),
        // 千日手判定: 盤面+手番のハッシュが3回目なら引き分け終局
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 千日碁: 局面 (盤面+次の手番) が3回現れたら千日手引き分け
            {
                const __key = board.join(',') + ':' + opponent;
                st.seen[__key] = (st.seen[__key] || 0) + 1;
                if (st.seen[__key] >= Math.max(1, P('repeat_max') || 3)) {
                    fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '千日手', '#94a3b8', 1400);
                    gameOver = true;
                    gameResultData = { title: '千日手', details: '同一局面が3回現れました (引き分け)' };
                    updateUI();
                    soundManager.playWin();
                    showResultModal();
                    if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                    saveState();
                    return;
                }
            }

            turn = opponent;`],
        [K.ONE, K.INFO_BASE, `            千日碁: 同一局面3回で引き分け<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤面と手番の組が3回現れると千日手で引き分け終局。',
            'コウ争いや形の往復で同じ局面を繰り返すと決着がつかない — 詰将棋ならぬ千日碁。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; gameOver = false;
        st = { seen: {} };
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        const k1 = board.join(',') + ':' + 2;
        assert('局面が記録される', st.seen[k1] === 1);
        // 次の黒手後の盤面キーをあらかじめ2回記録しておく
        const tb = [...board]; tb[3 * BOARD_SIZE + 3] = 1;
        st.seen[tb.join(',') + ':' + 2] = 2;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // 同じ局面が3回目 → 千日手
        assert('3回目で千日手引き分け', gameOver === true);
        assert('結果は千日手', !!gameResultData && gameResultData.title === '千日手');
    `,
};
