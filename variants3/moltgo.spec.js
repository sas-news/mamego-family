// MOLTGO — 脱皮碁: 取られた石は「殻」を残す。殻の残る空点は終局時+1目
const K = require('../gen_kit.js');
module.exports = {
    file: 'moltgo.html',
    en: 'MOLTGO',
    jp: '脱皮碁',
    prefix: 'moltgo',
    desc: '石は脱皮する生き物。取られた場所に殻が残り、終局時に1つ+1目。',
    kind: 'stone',
    icon: 'moltgo',
    spec: [
        ...K.rb('MOLTGO', '脱皮碁', 'moltgo'),
        K.params([
            { key: 'shell_pts', label: '抜殻1個の得点', min: 0, max: 4, def: 1, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { shell: {} }; // 殻: idx -> 抜け殻の持ち主 (1|2)
        let moltDetail = { 1: 0, 2: 0 };`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { shell: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { shell: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { shell: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { shell: {} };`],
        // 取られた石は殻を残す (殻の持ち主を記録)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    st.shell[idx] = opponent; // 抜け殻は取られた側のもの
                    board[idx] = 0;
                });
                fxSplash(captured[0], '#d6d3d1', 8);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 脱皮ルール: 殻の残る点 (空点か自分の石が残る点) は+1目
            moltDetail = { 1: 0, 2: 0 };
            Object.keys(st.shell).forEach(k => {
                const i = +k, ow = st.shell[i];
                if (board[i] === (ow === 1 ? 2 : 1)) return; // 敵に踏まれた殻は無効
                moltDetail[ow] += (P('shell_pts') ?? 1);
                if (ow === 1) territory.black += (P('shell_pts') ?? 1); else territory.white += (P('shell_pts') ?? 1);
            });`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 抜け殻: 空いた殻点に薄い殻の輪郭
            {
                ctx.save();
                Object.keys(st.shell).forEach(k => {
                    const i = +k;
                    if (board[i] !== 0) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = st.shell[i] === 1 ? 'rgba(87,83,78,0.55)' : 'rgba(180,160,120,0.65)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.36, Math.PI * 0.15, Math.PI * 1.85);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '石は脱皮する生き物。取られた石はその場に「殻」を残す。',
            '終局時、殻の残る点 (敵に踏まれていないもの) は1つ+1目。捨て身の脱皮も得点源 — 両者同じ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.shell = {};
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2);
        [[3, 4], [5, 4], [4, 3], [4, 5]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 1));
        assert('白が取られた', board[4 * BOARD_SIZE + 4] === 0 && captures[1] === 1);
        assert('殻が残る', st.shell[4 * BOARD_SIZE + 4] === 2);
        endGameByScore();
        assert('殻ボーナス(+1)', moltDetail[2] === 1);
        assert('終局する', gameOver === true);
    `,
};
