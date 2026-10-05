// SAKURAGO — 桜碁: 置いて6手経った石は花を散らして消え、散った跡(自身と空き隣)が領地の印になる
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
module.exports = {
    file: 'sakurago.html',
    en: 'SAKURAGO',
    jp: '桜碁',
    prefix: 'sakurago',
    desc: '置いて6手で石は桜を散らして消え、散った跡と隣の空点が終局時の領地になる。',
    kind: 'stone',
    icon: 'sakurago',
    spec: [
        ...K.rb('SAKURAGO', '桜碁', 'sakurago'),
        K.params([
            { key: 'bloom_turns', label: '散るまでの手数', min: 2, max: 15, def: 6, unit: '手' },
            { key: 'petal_pts', label: '花びら1つの得点', min: 1, max: 4, def: 1, unit: '点' },
        ]),
        ...ST('{ born: {}, petal: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 桜碁: 生後6手の石は散って消え、跡と隣の空点に花びらの領地印を残す
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.born[mi] = history.length;
                for (const k in st.born) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) { delete st.born[k]; continue; }
                    if (history.length - st.born[k] >= Math.max(1, P('bloom_turns') || 6)) {
                        const col = board[idx];
                        board[idx] = 0;
                        delete st.born[k];
                        st.petal[idx] = col;
                        getNeighbors(idx).forEach(n => { if (board[n] === 0) st.petal[n] = col; });
                        fxBurst(idx, '#f9a8d4', 18);
                        fxText(idx, '散', '#f472b6', 1100);
                    }
                }
                for (const k in st.petal) if (board[k] !== 0) delete st.petal[k];
            }

            turn = opponent;`],
        // 花びらは桃色の小さな花
        ...K.STONE_MARKS_SPEC(`            // 桜: 花びらの跡に桃色の小花を描く
            {
                ctx.save();
                for (const k in st.petal) {
                    const idx = +k;
                    if (board[idx] !== 0) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = st.petal[k] === 1 ? 'rgba(244,114,182,0.8)' : 'rgba(251,207,232,0.9)';
                    for (let a = 0; a < 4; a++) {
                        const t = a / 4 * Math.PI * 2;
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(t) * cellSize * 0.11, cy + Math.sin(t) * cellSize * 0.11, cellSize * 0.07, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }`),
        // 終局時: 空点の花びら1個につき所有者+1目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            for (const k in st.petal) {
                if (board[k] !== 0) continue;
                if (st.petal[k] === 1) territory.black += Math.max(1, P('petal_pts') || 1);
                else territory.white += Math.max(1, P('petal_pts') || 1);
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            桜碁: 置いて6手で石は散って消え、跡と隣の空点に領地の花びら (+1目) を残す<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '置いてから6手経った石は満開となって散り、盤から消える。',
            '散った跡とその隣の空点に花びらが残り、終局時に空点なら所有者に+1目ずつ。',
            '石は消えるが広く地を残す — 密度の低い囲い方。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; st = { born: {}, petal: {} };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // h=1
        assert('生まれた手が記録される', st.born[I(4, 4)] === 1);
        for (let i = 0; i < 6; i++) executeMove({ cells: [{ x: 9 - (i % 2), y: 9 - ((i / 2) | 0) }] }, i % 2 + 1);
        assert('6手で散る', board[I(4, 4)] === 0);
        assert('散った跡に花びら', st.petal[I(4, 4)] === 1);
        assert('隣の空点にも花びら', st.petal[I(4, 3)] === 1 || st.petal[I(4, 5)] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
