// MEMORIALGO — 供養碁: 取られた石は「祟り」になる。敵がその地を踏むと終局時+1目
const K = require('../gen_kit.js');
module.exports = {
    file: 'memorialgo.html',
    en: 'MEMORIALGO',
    jp: '供養碁',
    prefix: 'memorialgo',
    desc: '取られた石は祟りになる。敵がその地を踏むと終局時に+1目返す。',
    kind: 'stone',
    icon: 'memorialgo',
    spec: [
        ...K.rb('MEMORIALGO', '供養碁', 'memorialgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { grudge: {} }; // 祟り: idx -> 供養されなかった側 (1|2)
        let memDetail = { 1: 0, 2: 0 };`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { grudge: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { grudge: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { grudge: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { grudge: {} };`],
        // 取られた石は祟りを残す
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    st.grudge[idx] = opponent; // 供養されなかった側
                    board[idx] = 0;
                });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 供養ルール: 祟りの地を敵が踏んでいると1つ+1目が返る
            memDetail = { 1: 0, 2: 0 };
            Object.keys(st.grudge).forEach(k => {
                const i = +k, ow = st.grudge[i];
                if (board[i] !== (ow === 1 ? 2 : 1)) return;
                memDetail[ow]++;
                if (ow === 1) territory.black++; else territory.white++;
            });`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 祟り: 取られた跡に薄紫の燐火
            {
                ctx.save();
                Object.keys(st.grudge).forEach(k => {
                    const i = +k;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(167,139,250,0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.20, Math.PI * 0.7, Math.PI * 2.3);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '取られた石は供養されない「祟り」としてその地に残る。',
            '終局時、敵が祟りの地を踏んでいると取られた側に1つ+1目が返る。取りすぎは祟りを招く — 両者同じ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.grudge = {};
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2);
        [[3, 4], [5, 4], [4, 3], [4, 5]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 1));
        assert('祟りが残る', st.grudge[4 * BOARD_SIZE + 4] === 2);
        board[3 * BOARD_SIZE + 4] = 0; board[5 * BOARD_SIZE + 4] = 0;
        board[4 * BOARD_SIZE + 3] = 0; board[4 * BOARD_SIZE + 5] = 0;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 黒が祟りの地を踏む
        endGameByScore();
        assert('祟りボーナス(+1)', memDetail[2] === 1);
        assert('終局する', gameOver === true);
    `,
};
