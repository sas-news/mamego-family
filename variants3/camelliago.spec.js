// CAMELLIAGO — 椿碁: 取られた石は散り際に花を残す。散った跡が空点なら所有者に終局時+1目
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
    file: 'camelliago.html',
    en: 'CAMELLIAGO',
    jp: '椿碁',
    prefix: 'camelliago',
    desc: '取られた石は散り際に椿の花を残す — 跡が空点のままなら所有者に終局時+1目。',
    kind: 'stone',
    icon: 'camelliago',
    spec: [
        ...K.rb('CAMELLIAGO', '椿碁', 'camelliago'),
        K.params([
            { key: 'flower_pt', label: '落花1個の得点', min: 1, max: 3, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.9, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        ...ST('{ fallen: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 椿碁: 取られた石は散り際に花を残す (所有者は取られた側)
            {
                captured.forEach(idx => {
                    st.fallen[idx] = opponent;
                    fxBurst(idx, '#fb7185', 12);
                    fxText(idx, '散', '#f43f5e', 900);
                });
                for (const k in st.fallen) if (board[k] !== 0) delete st.fallen[k];
            }

            turn = opponent;`],
        // 散った跡は紅い椿の花印
        ...K.STONE_MARKS_SPEC(`            // 椿: 散った跡に紅い花印
            {
                ctx.save();
                for (const k in st.fallen) {
                    const idx = +k;
                    if (board[idx] !== 0) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = st.fallen[k] === 1 ? 'rgba(190,18,60,0.8)' : 'rgba(251,113,133,0.85)';
                    for (let a = 0; a < 5; a++) {
                        const t = a / 5 * Math.PI * 2 - Math.PI / 2;
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(t) * cellSize * 0.1, cy + Math.sin(t) * cellSize * 0.1, cellSize * 0.07, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }`),
        // 終局時: 空点の落花1個につき所有者+1目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            for (const k in st.fallen) {
                if (board[k] !== 0) continue;
                if (st.fallen[k] === 1) territory.black += (P('flower_pt') || 1);
                else territory.white += (P('flower_pt') || 1);
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            椿碁: 取られた石は散り際に花を残す — 空点のままなら所有者に終局時+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '取られた石は散り際に椿の花を残し、その点が終局まで空点なら所有者に+1目。',
            '取られた側にも見返りがある — 攻める側は跡地を埋めたくなる。',
            '花を残す場所で捨てるか、踏み潰すか。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st = { fallen: {} };
        board[I(1, 1)] = 2;
        board[I(0, 1)] = 1; board[I(1, 0)] = 1; board[I(1, 2)] = 1;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1); // 白を取る → 落花
        assert('取られた跡に花が残る', st.fallen[I(1, 1)] === 2);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1); // 跡を埋めると花は消える
        assert('埋めると花は消える', st.fallen[I(1, 1)] === undefined);
        assert('アゲハマは通常通り', captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
