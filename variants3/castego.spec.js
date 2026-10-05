// CASTEGO — 階層碁: 4手ごとの着手は「上級」階級。上級石は取られると2目分の価値
const K = require('../gen_kit.js');
module.exports = {
    file: 'castego.html',
    en: 'CASTEGO',
    jp: '階層碁',
    prefix: 'castego',
    desc: '石は階級。4手ごとの着手は上級石 — 取られると2目分。数が少ないほど価値が高い。',
    kind: 'stone',
    icon: 'castego',
    spec: [
        ...K.rb('CASTEGO', '階層碁', 'castego'),
        K.params([
            { key: 'noble_every', label: '上級石の間隔', min: 2, max: 10, def: 4, unit: '手' },
            { key: 'noble_extra', label: '上級石の追加目', min: 1, max: 3, def: 1, unit: '目', hint: '取られるとアゲハマ+この値' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.8, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pcnt: { 1: 0, 2: 0 }, noble: {} }; // 階層: 着手数と上級石の位置`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { pcnt: { 1: 0, 2: 0 }, noble: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { pcnt: { 1: 0, 2: 0 }, noble: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { pcnt: { 1: 0, 2: 0 }, noble: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { pcnt: { 1: 0, 2: 0 }, noble: {} };`],
        // 上級石はアゲハマ2個分 (数が少ないほど価値が高い)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                let bonus = 0;
                captured.forEach(idx => {
                    if (st.noble[idx]) { bonus += (P('noble_extra') || 1); delete st.noble[idx]; }
                    board[idx] = 0;
                });
                captures[player] += captured.length + bonus;
                if (bonus > 0) fxText(captured[0], '上級石 +' + bonus + '目', '#facc15', 1100);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 階層: 消えた上級印の掃除 + 4手ごとの着手は上級石
            Object.keys(st.noble).forEach(k => { if (board[+k] === 0) delete st.noble[k]; });
            st.pcnt[player] = (st.pcnt[player] || 0) + 1;
            if (st.pcnt[player] % (P('noble_every') || 4) === 0) {
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.noble[ci] = 1;
                fxGlow(ci, '#facc15', 800);
                fxText(ci, '上級', '#facc15', 900);
            }

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 上級石: 金の冠リング
            {
                ctx.save();
                Object.keys(st.noble).forEach(k => {
                    const i = +k;
                    if (board[i] === 0) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(250,204,21,0.95)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(250,204,21,0.9)';
                    [-0.18, 0, 0.18].forEach(dx => {
                        ctx.beginPath();
                        ctx.moveTo(cx + dx * cellSize, cy - cellSize * 0.30);
                        ctx.lineTo(cx + dx * cellSize + cellSize * 0.06, cy - cellSize * 0.44);
                        ctx.lineTo(cx + dx * cellSize + cellSize * 0.12, cy - cellSize * 0.30);
                        ctx.closePath();
                        ctx.fill();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'次の上級石まで ' + ((P('noble_every') || 4) - ((st.pcnt[turn] || 0) % (P('noble_every') || 4))) + '手'`),
        [K.ONE, K.RV_BASE, K.rv([
            '石は階級。自分の4手ごとの着手は「上級」階級の石 (金の冠印) になる。',
            '上級石は取られるとアゲハマ2個分の価値。数が少ないほど貴重 — 両者同じ周期で現れる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.pcnt = { 1: 0, 2: 0 }; st.noble = {};
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        executeMove({ cells: [{ x: 0, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 0, y: 3 }] }, 1); // 4手目 → 上級
        assert('4手目が上級石', st.noble[3 * BOARD_SIZE] === 1);
        [[1, 0], [1, 1], [1, 2], [1, 3], [0, 4]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 2));
        assert('上級を含む連が取れる', board[0] === 0 && board[3 * BOARD_SIZE] === 0);
        assert('上級は2目分の価値', captures[2] === 5);
        assert('通常着手は合法', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
