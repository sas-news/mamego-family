// MIGRATIONGO — 渡り碁: 30手ごとの季節の変わり目に、全ての石が2列分だけ季節方向へ渡る
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= 150) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'migrationgo.html',
    en: 'MIGRATIONGO',
    jp: '渡り碁',
    prefix: 'migrationgo',
    desc: '30手ごとの季節の変わり目に、全ての石が2列分だけ南↔北へ渡る。',
    kind: 'stone',
    icon: 'migrationgo',
    spec: [
        ...K.rb('MIGRATIONGO', '渡り碁', 'migrationgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { south: true, lastSeason: 0 }; // 渡り方向と最終季節`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { south: true, lastSeason: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { south: true, lastSeason: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { south: true, lastSeason: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { south: true, lastSeason: 0 };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 渡り: 30手ごとの季節の変わり目に、全石が2列分 南→北→…と移動する
            {
                const season = Math.floor(history.length / 30);
                if (season !== st.lastSeason && history.length % 30 === 0) {
                    st.lastSeason = season;
                    const dir = st.south ? 1 : -1; // 交互に南/北へ
                    st.south = !st.south;
                    const order = [];
                    board.forEach((v, i) => { if (v === 1 || v === 2) order.push(i); });
                    // 進行方向の先側から処理して衝突を避ける
                    order.sort((a, b) => dir > 0 ? b - a : a - b);
                    let moved = 0;
                    order.forEach(i => {
                        const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                        const ny = y + dir * 2;
                        if (ny < 0 || ny >= BOARD_SIZE) return; // 端に押し止められる
                        const ni = ny * BOARD_SIZE + x;
                        if (board[ni] !== 0) return; // 渡り先が塞がっている
                        const val = board[i];
                        board[i] = 0;
                        board[ni] = val;
                        moved++;
                        fxSlide(i, ni, 380);
                    });
                    if (moved) {
                        fxShake(5, 500);
                        fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, dir > 0 ? '南へ渡る!' : '北へ渡る!', '#38bdf8', 1300);
                        cleanUpPieces();
                    }
                }
            }

            turn = opponent;`],
        // 渡りの季節までのカウントを表示
        ...K.EVENT_CHIP_SPEC(`'渡りまで' + (30 - (history.length % 30)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            渡り碁: 30手ごとに全石が季節方向へ2列渡る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '渡りの季節 — 30手ごとに全ての石が2列分だけ南へ (次は北へ、交互に) 移動する。',
            '渡り先が塞がっている石や端の石は動けない。地の形が季節ごとに大きく変わる。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { south: true, lastSeason: 0 };
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        history.length = 29;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1); // 30手目で季節の変わり目
        assert('南へ2列渡る', board[I(3, 5)] === 1 && board[I(3, 3)] === 0);
        assert('白石も渡る', board[I(8, 10)] === 2 && board[I(8, 8)] === 0);
        assert('季節が進んだ', st.lastSeason === 1 && st.south === false);
        board.fill(0); st = { south: true, lastSeason: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
