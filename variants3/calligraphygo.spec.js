// CALLIGRAPHYGO — 書道碁: 直前の自石に接続して打つと一筆が伸びる。最長の筆流が得点
const K = require('../gen_kit.js');
module.exports = {
    file: 'calligraphygo.html',
    en: 'CALLIGRAPHYGO',
    jp: '書道碁',
    prefix: 'calligraphygo',
    desc: '石は墨の筆跡。直前の自石に隣接して打つと一筆が伸び、最長の流れが得点。',
    kind: 'stone',
    icon: 'calligraphygo',
    spec: [
        ...K.rb('CALLIGRAPHYGO', '書道碁', 'calligraphygo'),
        K.params([
            { key: 'brush_mult', label: '筆流の得点係数', min: 1, max: 3, def: 1, hint: '最長の一筆×この値が得点' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.8, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { last: { 1: -1, 2: -1 }, cur: { 1: 0, 2: 0 }, best: { 1: 0, 2: 0 } }; // 筆跡の流れ`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { last: { 1: -1, 2: -1 }, cur: { 1: 0, 2: 0 }, best: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { last: { 1: -1, 2: -1 }, cur: { 1: 0, 2: 0 }, best: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { last: { 1: -1, 2: -1 }, cur: { 1: 0, 2: 0 }, best: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { last: { 1: -1, 2: -1 }, cur: { 1: 0, 2: 0 }, best: { 1: 0, 2: 0 } };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 書道: 直前の自分の筆跡に接続していれば一筆が伸びる
            {
                const i = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const li = st.last[player];
                if (li >= 0 && getNeighbors(i).includes(li)) {
                    st.cur[player]++;
                } else {
                    st.cur[player] = 1; // 筆を置き直す
                }
                st.last[player] = i;
                if (st.cur[player] > st.best[player]) {
                    st.best[player] = st.cur[player];
                    if (st.cur[player] >= 3) fxText(i, '筆流 ' + st.cur[player], '#1c1917', 900);
                }
            }

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 書道ルール: 最長の一筆の長さがそのまま得点
            territory.black += st.best[1] * (P('brush_mult') || 1);
            territory.white += st.best[2] * (P('brush_mult') || 1);`],
        ...K.STONE_MARKS_SPEC(`            // 現在の筆跡: 直前の石と最新の石を墨の流れで結ぶ
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(28,25,23,0.5)';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                ctx.lineCap = 'round';
                [1, 2].forEach(p => {
                    const li = st.last[p];
                    if (li < 0 || board[li] !== p || st.cur[p] < 2) return;
                    const x = li % BOARD_SIZE, y = Math.floor(li / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.46, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'筆流 ' + st.cur[turn] + ' (最長 ' + st.best[turn] + ')'`),
        [K.ONE, K.RV_BASE, K.rv([
            '石は墨の筆跡。直前に置いた自分の石に隣接して打つと「一筆」が伸びる (接続しないと新しい筆に)。',
            '終局時、最長の一筆の長さがそのまま得点。流れるような布石を目指せ — 両者同じ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { last: { 1: -1, 2: -1 }, cur: { 1: 0, 2: 0 }, best: { 1: 0, 2: 0 } };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 3連の一筆
        assert('一筆が3に伸びる', st.cur[1] === 3 && st.best[1] === 3);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1); // 接続しない → 新しい筆
        assert('筆を置き直す', st.cur[1] === 1 && st.best[1] === 3);
        endGameByScore();
        assert('最長筆流が得点', gameOver === true);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
