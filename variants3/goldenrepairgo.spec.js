// GOLDENREPAIRGO — 金継碁: 取られた跡に自分が打ち直すと「金継ぎ」— 修復石は終局時+2目
const K = require('../gen_kit.js');
module.exports = {
    file: 'goldenrepairgo.html',
    en: 'GOLDENREPAIRGO',
    jp: '金継碁',
    prefix: 'goldenrepairgo',
    desc: '取られた連の跡を自分で打ち直すと金継ぎ修復 — 修復石は終局時+2目。',
    kind: 'stone',
    icon: 'goldenrepairgo',
    spec: [
        ...K.rb('GOLDENREPAIRGO', '金継碁', 'goldenrepairgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { site: { 1: {}, 2: {} }, gold: {} }; // 欠けた跡と金継ぎ修復済みの位置
        let goldDetail = { 1: 0, 2: 0 };`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { site: { 1: {}, 2: {} }, gold: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { site: { 1: {}, 2: {} }, gold: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { site: { 1: {}, 2: {} }, gold: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { site: { 1: {}, 2: {} }, gold: {} };`],
        // 取られた跡を記録 (取られた側の「欠け」)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    st.site[opponent][idx] = 1;
                    board[idx] = 0;
                });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 金継ぎ: 自分の欠けた跡に打ち直すと修復石になる
            {
                const i = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (st.site[player][i]) {
                    delete st.site[player][i];
                    st.gold[i] = player;
                    fxGlow(i, '#facc15', 900);
                    fxText(i, '金継ぎ', '#facc15', 1100);
                }
            }

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 金継ぎルール: 修復石が残っていると1つ+2目
            goldDetail = { 1: 0, 2: 0 };
            Object.keys(st.gold).forEach(k => {
                const i = +k, ow = st.gold[i];
                if (board[i] !== ow) return;
                goldDetail[ow] += 2;
                if (ow === 1) territory.black += 2; else territory.white += 2;
            });`],
        ...K.STONE_MARKS_SPEC(`            // 金継ぎ修復石: 金の亀裂筋
            {
                ctx.save();
                Object.keys(st.gold).forEach(k => {
                    const i = +k;
                    if (board[i] === 0) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(250,204,21,0.95)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.28, cy - cellSize * 0.10);
                    ctx.lineTo(cx - cellSize * 0.05, cy + cellSize * 0.02);
                    ctx.lineTo(cx + cellSize * 0.10, cy - cellSize * 0.18);
                    ctx.lineTo(cx + cellSize * 0.28, cy + cellSize * 0.12);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '取られた連の跡は「欠け」になる。自分の欠けに自分の石で打ち直すと「金継ぎ」修復。',
            '修復石が終局時に残っていれば1つ+2目。奪い合いと修復の攻防 — 両者同じルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { site: { 1: {}, 2: {} }, gold: {} };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2);
        [[3, 4], [5, 4], [4, 3], [4, 5]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 1));
        assert('欠けが記録される', st.site[2][4 * BOARD_SIZE + 4] === 1);
        board[3 * BOARD_SIZE + 4] = 0; board[5 * BOARD_SIZE + 4] = 0;
        board[4 * BOARD_SIZE + 3] = 0; board[4 * BOARD_SIZE + 5] = 0; // テスト用に欠けの周りを開ける
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2); // 白が欠けに打ち直す
        assert('金継ぎ修復になる', st.gold[4 * BOARD_SIZE + 4] === 2);
        endGameByScore();
        assert('修復ボーナス(+2)', goldDetail[2] === 2);
        assert('終局する', gameOver === true);
    `,
};
