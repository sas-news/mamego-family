// STAMPGO — 判子碁: 石を捺した点に印が残る。終局時、印の残る点は+1目
const K = require('../gen_kit.js');
module.exports = {
    file: 'stampgo.html',
    en: 'STAMPGO',
    jp: '判子碁',
    prefix: 'stampgo',
    desc: '石は判子。捺した点に印が残り、終局時に印のある点は1つ+1目。',
    kind: 'stone',
    icon: 'stampgo',
    spec: [
        ...K.rb('STAMPGO', '判子碁', 'stampgo'),
        K.params([
            { key: 'stamp_pts', label: '印1つあたりの得点', min: 0, max: 5, def: 1, unit: '目' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { stamp: {} }; // 印: idx -> 捺した側 (1|2)
        let stampDetail = { 1: 0, 2: 0 };`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { stamp: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { stamp: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { stamp: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { stamp: {} };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 判子: 捺した点に自分の印が残る
            {
                const i = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.stamp[i] = player;
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
            // 判子ルール: 自分の印のある点 (空点か自分の石が残る点) は+1目
            stampDetail = { 1: 0, 2: 0 };
            Object.keys(st.stamp).forEach(k => {
                const i = +k, ow = st.stamp[i];
                if (board[i] === (ow === 1 ? 2 : 1)) return; // 敵に踏まれた印は無効
                stampDetail[ow] += (P('stamp_pts') ?? 1);
                if (ow === 1) territory.black += (P('stamp_pts') ?? 1); else territory.white += (P('stamp_pts') ?? 1);
            });`],
        ...K.STONE_MARKS_SPEC(`            // 印: 捺された点に朱色の小さな角印
            {
                ctx.save();
                Object.keys(st.stamp).forEach(k => {
                    const i = +k;
                    if (board[i] !== 0) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const s = cellSize * 0.16;
                    ctx.fillStyle = st.stamp[i] === 1 ? 'rgba(220,38,38,0.55)' : 'rgba(248,113,113,0.55)';
                    ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石は判子。石を置くとその点に自分の「印」が捺される。',
            '終局時、印の残る点 (空点か自分の石が残る点) は1つ+1目。石が取られても印は残る — 両者同じ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.stamp = {};
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('印が捺される', st.stamp[4 * BOARD_SIZE + 4] === 1);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2); // 同点に白を捺す (テスト上は直接実行)
        assert('上書きされる', st.stamp[4 * BOARD_SIZE + 4] === 2);
        board.fill(0); st.stamp = { 30: 1, 40: 1 };
        endGameByScore();
        assert('印ボーナス(+2)', stampDetail[1] === 2);
        assert('終局する', gameOver === true);
    `,
};
