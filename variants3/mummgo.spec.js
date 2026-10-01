// MUMMGO — 干乾碁: 呼吸0の連は即死せず「ミイラ化」して盤に残る。敵はミイラ連をクリックで回収できる
const K = require('../gen_kit.js');
module.exports = {
    file: 'mummgo.html',
    en: 'MUMMGO',
    jp: '干乾碁',
    prefix: 'mummgo',
    desc: '呼吸0の連はミイラ化して盤に残る。敵ミイラ連をクリックで回収する。',
    kind: 'stone',
    icon: 'mummgo',
    spec: [
        ...K.rb('MUMMGO', '干乾碁', 'mummgo'),
        K.params([
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { mum: {} }; // ミイラマス idx -> 1
        function mummyGroup(i0) {
            const col = board[i0], out = [], vis = new Set([i0]), q = [i0];
            while (q.length) {
                const c = q.shift(); out.push(c);
                getNeighbors(c).forEach(n => {
                    if (!vis.has(n) && st.mum[n] && board[n] === col) { vis.add(n); q.push(n); }
                });
            }
            return out;
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { mum: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { mum: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { mum: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { mum: {} };`],
        // ミイラは連にも取りにも参加しない (干からびた残像)
        [K.ONE, `            if (boardState[i] === player && !visited[i]) {`,
`            if (boardState[i] === player && !visited[i] && !st.mum[i]) {`],
        [K.ALL, `                        } else if (boardState[n] === player && !visited[n]) {`,
`                        } else if (boardState[n] === player && !visited[n] && !st.mum[n]) {`],
        // 呼吸0の連は死なずにミイラ化する (アゲハマ未計上)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { st.mum[idx] = 1; fxGlow(idx, '#d6d3d1', 500); });
                soundManager.playCapture();
            } else {
                soundManager.playPlace();
            }`],
        // クリック: 敵ミイラ連を回収してアゲハマにする (1手を消費)
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            const isTouch = lastPointerType === 'touch';`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // ミイラ回収: 敵ミイラ連をクリックで取り上げる (1手消費)
            {
                const hp = getPlacementAt(anchor.u, anchor.v);
                if (hp && hp.cells[0]) {
                    const hi = hp.cells[0].y * BOARD_SIZE + hp.cells[0].x;
                    if (st.mum[hi] && board[hi] === (turn === 1 ? 2 : 1)) {
                        mummyGroup(hi).forEach(i => { delete st.mum[i]; board[i] = 0; captures[turn]++; fxBurst(i, '#d6d3d1', 8); });
                        cleanUpPieces();
                        soundManager.playCapture();
                        consecutivePasses = 0;
                        holdUsed = false;
                        turn = turn === 1 ? 2 : 1;
                        if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                        updateUI();
                        saveState();
                        if (!gameOver && gameMode === 'ai' && turn === aiPlayer) triggerAiMove();
                        return;
                    }
                }
            }

            const isTouch = lastPointerType === 'touch';`],
        // ミイラの描画: 乾いたグレーの帯
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (const k in st.mum) {
                    const i = +k, x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    if (board[i] === 0) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(214,211,209,0.95)';
                    ctx.lineWidth = Math.max(2, cellSize * 0.09);
                    for (let b = -1; b <= 1; b++) {
                        ctx.beginPath();
                        ctx.moveTo(cx - cellSize * 0.28, cy + b * cellSize * 0.16);
                        ctx.lineTo(cx + cellSize * 0.28, cy + b * cellSize * 0.16);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            干乾碁: 呼吸0の連は即死せず「ミイラ化」(灰帯)。敵ミイラ連をクリックで回収してアゲハマにする<br>
            PC: クリックで配置 / 敵ミイラ連クリックで回収<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '呼吸0の連は死なずにミイラ化して盤に残る。ミイラは連に合流せず、地にもならない。',
            '敵ミイラ連をクリックすると回収してアゲハマになる (1手消費)。残ると両者の邪魔。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; st.mum = {}; captures = { 1: 0, 2: 0 };
        board[I(1, 0)] = 1; board[I(0, 1)] = 1; board[I(2, 1)] = 1;
        board[I(1, 1)] = 2;
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1);
        assert('白はミイラ化して盤に残る', board[I(1, 1)] === 2 && st.mum[I(1, 1)] === 1);
        assert('アゲハマは未計上', captures[1] === 0);
        assert('ミイラは取り判定に出ない', getCapturedStones(board, 2).length === 0);
        assert('ミイラは連に合流しない', getCapturedStones(board, 2).every(i => st.mum[i] !== 1));
        assert('ミイラマスには置けず他は置ける', isValidPlacement([{ x: 1, y: 1 }], 1) === false && isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
