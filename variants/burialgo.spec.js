// BURIALGO — 墓穴碁: 各側最初の捕獲は墓穴になる。穴に落ちた石は二度と戻れない
const K = require('../gen_kit.js');
module.exports = {
    file: 'burialgo.html',
    en: 'BURIALGO',
    jp: '墓穴碁',
    prefix: 'burialgo',
    desc: '各側最初に石を取った場所は墓穴になり、二度と石は置けない。',
    kind: 'stone',
    icon: 'burialgo',
    spec: [
        ...K.rb('BURIALGO', '墓穴碁', 'burialgo'),
        K.params([
            { key: 'grave_times', label: '墓穴になる捕獲回数', min: 1, max: 3, def: 1, hint: '各側この回数の捕獲地点が墓穴に' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.8, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { used: { 1: false, 2: false } }; // 墓穴を掘ったか`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { used: { 1: false, 2: false } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { used: { 1: false, 2: false } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { used: { 1: false, 2: false } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { used: { 1: false, 2: false } };`],
        // 各側最初の捕獲地点は墓穴 (壁) になる — 落ちた石は二度と戻れない
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                if ((st.used[player] || 0) < (P('grave_times') || 1)) {
                    st.used[player] = (st.used[player] || 0) + 1;
                    captured.forEach(idx => {
                        board[idx] = 3; // 墓穴
                        fxBurst(idx, '#57534e', 8, 1.0);
                    });
                    fxText(captured[0], '墓穴', '#78716c', 1100);
                } else {
                    captured.forEach(idx => board[idx] = 0);
                }
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.WALL_SPEC,
        [K.ONE, K.RV_BASE, K.rv([
            '各プレイヤーが最初に敵石を取った場所は「墓穴」になる (暗い窪み)。',
            '墓穴には二度と石は置けず、地にもならない。最初の捕獲場所に注意 — 両者1回ずつ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { used: { 1: false, 2: false } };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2);
        [[3, 4], [5, 4], [4, 3], [4, 5]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 1));
        assert('最初の捕獲地点は墓穴', board[4 * BOARD_SIZE + 4] === 3);
        assert('墓穴には置けない', isValidPlacement([{ x: 4, y: 4 }], 1) === false);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        [[8, 9], [10, 9], [9, 8], [9, 10]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 1));
        assert('2度目の捕獲は通常処理', board[9 * BOARD_SIZE + 9] === 0 && captures[1] === 2);
    `,
};
