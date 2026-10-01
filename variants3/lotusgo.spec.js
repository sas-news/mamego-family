// LOTUSGO — 蓮碁: 石が取られた跡は泥になる。泥に根づいた石は蓮 — 終局時+2目
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
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
    file: 'lotusgo.html',
    en: 'LOTUSGO',
    jp: '蓮碁',
    prefix: 'lotusgo',
    desc: '石が取られた跡は泥。泥に置いた石は蓮に咲き、盤上に残れば終局時+2目。',
    kind: 'stone',
    icon: 'lotusgo',
    spec: [
        ...K.rb('LOTUSGO', '蓮碁', 'lotusgo'),
        K.params([
            { key: 'lotus_pts', label: '蓮の得点', min: 0, max: 6, def: 2, hint: '盤上に残った蓮1つにつき終局加点' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST('{ mud: {}, lotus: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 蓮碁: 取られた跡は泥。泥に置いた石は蓮に咲く (+2目)
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                captured.forEach(idx => { st.mud[idx] = 1; });
                if (st.mud[mi]) {
                    delete st.mud[mi];
                    st.lotus[mi] = player;
                    fxBurst(mi, '#f0abfc', 14);
                    fxText(mi, '蓮', '#e879f9', 1100);
                }
                for (const k in st.mud) if (board[k] !== 0) delete st.mud[k];
                for (const k in st.lotus) if (board[k] !== st.lotus[k]) delete st.lotus[k];
            }

            turn = opponent;`],
        // 泥は茶色の点、蓮は薄紫の花弁
        ...K.STONE_MARKS_SPEC(`            // 蓮: 泥の跡に茶点、蓮の石に薄紫の花弁輪
            {
                ctx.save();
                for (const k in st.mud) {
                    if (board[+k] !== 0) continue;
                    const x = (+k) % BOARD_SIZE, y = ((+k) / BOARD_SIZE) | 0;
                    ctx.fillStyle = 'rgba(120,113,108,0.55)';
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.12, 0, Math.PI * 2);
                    ctx.fill();
                }
                for (const k in st.lotus) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(232,121,249,0.9)';
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                    for (let a = 0; a < 5; a++) {
                        const t = a / 5 * Math.PI * 2 - Math.PI / 2;
                        ctx.beginPath();
                        ctx.ellipse(cx + Math.cos(t) * cellSize * 0.2, cy + Math.sin(t) * cellSize * 0.2,
                            cellSize * 0.08, cellSize * 0.05, t, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        // 終局時: 盤上の蓮1個につき+2目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            for (const k in st.lotus) {
                if (board[k] === 1) territory.black += (P('lotus_pts') ?? 2);
                else if (board[k] === 2) territory.white += (P('lotus_pts') ?? 2);
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            蓮碁: 石が取られた跡は泥。泥に置いた石は蓮に咲き、残れば終局時+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石が取られた交点は「泥」になる (どちらの石でも)。',
            '泥に石を置くと蓮に咲き、終局時に盤上に残っていれば+2目。',
            '取り合いの跡地を清らかな点に変える。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st = { mud: {}, lotus: {} };
        board[I(1, 1)] = 2;
        board[I(0, 1)] = 1; board[I(1, 0)] = 1; board[I(1, 2)] = 1;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1); // 白石を取る → 泥
        assert('取られた跡は泥', st.mud[I(1, 1)] === 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1); // 泥に置く → 蓮
        assert('泥に置いた石は蓮', st.lotus[I(1, 1)] === 1);
        assert('蓮の石は盤上に残る', board[I(1, 1)] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
