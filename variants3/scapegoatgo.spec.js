// SCAPEGOATGO — 身代碁: 初手の石は「身代わり」。連が取られても身代わり1個だけが死ぬ (各1回)
const K = require('../gen_kit.js');
module.exports = {
    file: 'scapegoatgo.html',
    en: 'SCAPEGOATGO',
    jp: '身代碁',
    prefix: 'scapegoatgo',
    desc: '初手の石は身代わり。それを含む連が取られても身代わり1個だけが死ぬ (各1回)。',
    kind: 'stone',
    icon: 'scapegoatgo',
    spec: [
        ...K.rb('SCAPEGOATGO', '身代碁', 'scapegoatgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { doll: { 1: -1, 2: -1 }, used: { 1: false, 2: false } }; // 身代わりの位置と使用済`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { doll: { 1: -1, 2: -1 }, used: { 1: false, 2: false } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { doll: { 1: -1, 2: -1 }, used: { 1: false, 2: false } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { doll: { 1: -1, 2: -1 }, used: { 1: false, 2: false } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { doll: { 1: -1, 2: -1 }, used: { 1: false, 2: false } };`],
        // 身代わり: それを含む連が取られても身代わり1個だけが死を引き受ける
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                const doll = st.doll[opponent];
                if (doll >= 0 && !st.used[opponent] && captured.indexOf(doll) >= 0) {
                    st.used[opponent] = true;
                    board[doll] = 0;
                    captures[player] += 1;
                    fxBurst(doll, '#f5f5f4', 10, 1.4);
                    fxText(doll, '身代わり!', '#d6d3d1', 1100);
                    soundManager.playCapture();
                    cleanUpPieces();
                } else {
                    captured.forEach(idx => board[idx] = 0);
                    captures[player] += captured.length;
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 身代わり: 各プレイヤーの初手の石が藁人形になる
            if (st.doll[player] < 0) {
                st.doll[player] = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            }

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 身代わり: 藁人形の十字マーク
            {
                ctx.save();
                [1, 2].forEach(p => {
                    const d = st.doll[p];
                    if (d < 0 || st.used[p] || board[d] !== p) return;
                    const x = d % BOARD_SIZE, y = Math.floor(d / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(214,211,209,0.95)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.30);
                    ctx.lineTo(cx, cy + cellSize * 0.30);
                    ctx.moveTo(cx - cellSize * 0.22, cy - cellSize * 0.08);
                    ctx.lineTo(cx + cellSize * 0.22, cy - cellSize * 0.08);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の初手の石は「身代わり」の藁人形 (十字印)。',
            '身代わりを含む連が取られても、身代わり1個だけが死を引き受けて残りは助かる。各側1回だけ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { doll: { 1: -1, 2: -1 }, used: { 1: false, 2: false } };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 身代わり
        assert('初手が身代わり', st.doll[1] === 4 * BOARD_SIZE + 4);
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        [[3, 4], [5, 4], [4, 3], [3, 5], [5, 5], [4, 6]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 2));
        assert('身代わりだけが死ぬ', board[4 * BOARD_SIZE + 4] === 0 && board[5 * BOARD_SIZE + 4] === 1);
        assert('身代わりは1回だけ', st.used[1] === true && captures[2] === 1);
        [[3, 5], [5, 5], [4, 6], [4, 4]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 2));
        assert('2度目は普通に取れる', board[5 * BOARD_SIZE + 4] === 0 && captures[2] === 2);
    `,
};
