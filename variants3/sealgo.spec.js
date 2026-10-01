// SEALGO — 札符碁: 2個以上の自石に接して置いた石は「封印」され決して取られない
const K = require('../gen_kit.js');
module.exports = {
    file: 'sealgo.html',
    en: 'SEALGO',
    jp: '札符碁',
    prefix: 'sealgo',
    desc: '2個以上の自石に接して置いた石は封印され、取られなくなる。',
    kind: 'stone',
    icon: 'sealgo',
    spec: [
        ...K.rb('SEALGO', '札符碁', 'sealgo'),
        K.params([
            { key: 'seal_min', label: '封印に必要な接する自石数', min: 1, max: 4, def: 2, unit: '個' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { seal: { 1: {}, 2: {} } }; // 封印された石の位置 (player -> idx -> 1)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { seal: { 1: {}, 2: {} } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { seal: { 1: {}, 2: {} } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { seal: { 1: {}, 2: {} } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { seal: { 1: {}, 2: {} } };`],
        // 封印石は取られない (連が取られても封印石だけ残る)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                const freed = captured.filter(i => !st.seal[opponent][i]);
                freed.forEach(idx => board[idx] = 0);
                captures[player] += freed.length;
                if (freed.length < captured.length) {
                    fxGlow(captured[0], '#facc15', 800);
                    fxText(captured[0], '封印!', '#facc15', 1000);
                }
                if (freed.length > 0) soundManager.playCapture();
                else soundManager.playPlace();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 札符: 2個以上の自石に接して置いた石は封印される
            {
                const i = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const own = getNeighbors(i).filter(n => board[n] === player).length;
                if (own >= Math.max(1, P('seal_min') || 2)) {
                    st.seal[player][i] = 1;
                    fxGlow(i, '#facc15', 700);
                    fxText(i, '封', '#facc15', 900);
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
        ...K.STONE_MARKS_SPEC(`            // 封印石: 金の札マーク
            {
                ctx.save();
                [1, 2].forEach(p => {
                    Object.keys(st.seal[p]).forEach(k => {
                        const i = +k;
                        if (board[i] !== p) return;
                        const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.fillStyle = 'rgba(250,204,21,0.9)';
                        const w = cellSize * 0.15, h = cellSize * 0.30;
                        ctx.fillRect(cx - w, cy - h, w * 2, h * 2);
                        ctx.fillStyle = 'rgba(120,53,15,0.9)';
                        ctx.fillRect(cx - w * 0.4, cy - h * 0.5, w * 0.8, h);
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '2個以上の自分の石に接して置いた石には札が貼られ「封印」される。',
            '封印石は連が取られても決して盤上から消えない。封印点を巡る攻防 — 両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { seal: { 1: {}, 2: {} } };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1); // (4,4)と(3,3)に接して封印
        assert('封印される', st.seal[1][4 * BOARD_SIZE + 3] === 1);
        [[2, 4], [3, 5], [5, 4], [4, 3], [4, 5], [2, 3], [3, 2]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 2));
        assert('封印石は取られない', board[4 * BOARD_SIZE + 3] === 1);
        assert('封印でない石は取られる', board[4 * BOARD_SIZE + 4] === 0 && captures[2] === 2);
        assert('通常着手は合法', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
