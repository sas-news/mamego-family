// OREVEINGO — 鉱脈碁: 着手が自分の石で4連以上の直線を完成させると鉱石を掘り当てる (終局時+1目/鉱脈)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
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
    file: 'oreveingo.html',
    en: 'OREVEINGO',
    jp: '鉱脈碁',
    prefix: 'oreveingo',
    desc: '着手で自分の石の4連以上の直線 (鉱脈) を完成させると鉱石を掘り当て終局時+1目。',
    kind: 'stone',
    icon: 'oreveingo',
    spec: [
        ...K.rb('OREVEINGO', '鉱脈碁', 'oreveingo'),
        ...ST('{ dug: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 鉱脈碁: 4連以上の直線を完成させると鉱石を掘る (各石1回)
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const dirs = [[1, 0], [0, 1]];
                for (const d of dirs) {
                    let run = 1;
                    for (const s of [-1, 1]) {
                        let x = move.cells[0].x + d[0] * s, y = move.cells[0].y + d[1] * s;
                        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[y * BOARD_SIZE + x] === player) { run++; x += d[0] * s; y += d[1] * s; }
                    }
                    if (run >= 4 && !st.dug[mi]) {
                        st.dug[mi] = 1;
                        fxBurst(mi, '#fbbf24', 14);
                        fxText(mi, '鉱石+1', '#f59e0b', 1100);
                    }
                }
                for (const k in st.dug) if (board[k] === 0 || board[k] === 3) delete st.dug[k];
            }

            turn = opponent;`],
        // 掘った鉱脈の起点は金の菱形
        ...K.STONE_MARKS_SPEC(`            // 鉱脈: 掘り当てた石に金の菱形印
            {
                ctx.save();
                for (const k in st.dug) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, r = cellSize * 0.18;
                    ctx.fillStyle = 'rgba(251,191,36,0.9)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
                    ctx.closePath(); ctx.fill();
                }
                ctx.restore();
            }`),
        // 終局時: 盤上に残る鉱石1個につき+1目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            for (const k in st.dug) {
                if (board[k] === 1) territory.black += 1;
                else if (board[k] === 2) territory.white += 1;
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            鉱脈碁: 着手で自分の石の4連以上の直線を完成させると鉱石+1目 (終局時盤上に残っていること)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石を縦か横に4連以上並べると鉱脈を掘り当て、起点の石が鉱石になる。',
            '終局時に盤上に残っている鉱石1個につき+1目。掘った石を守り切ることが大事。',
            '長く伸ばすほど狙いやすいが、列を断たれると掘れない。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.dug = {};
        board[I(2, 5)] = 1; board[I(3, 5)] = 1; board[I(4, 5)] = 1;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 4連完成 → 鉱石
        assert('4連で鉱石を掘る', st.dug[I(5, 5)] === 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('孤立石は掘れない', st.dug[I(0, 0)] !== 1);
        executeMove({ cells: [{ x: 9, y: 8 }] }, 2);
        board.fill(0); st.dug = {}; pieces = [];
        board[I(1, 1)] = 1; board[I(2, 1)] = 1;
        executeMove({ cells: [{ x: 3, y: 1 }] }, 1); // 3連では掘れない
        assert('3連では掘れない', st.dug[I(3, 1)] !== 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 7, y: 7 }], 2) === true);
    `,
};
