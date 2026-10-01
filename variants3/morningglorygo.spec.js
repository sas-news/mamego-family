// MORNINGGLORYGO — 朝顔碁: 石は朝顔。12手周期で咲いては萎れ、咲いている石だけ終局時+1目。孤立して古い石は枯れる
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
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
    file: 'morningglorygo.html',
    en: 'MORNINGGLORYGO',
    jp: '朝顔碁',
    prefix: 'morningglorygo',
    desc: '石は朝顔 — 12手周期で咲いては萎れる。咲いた石だけ終局時+1目。古く孤立した石は枯れる。',
    kind: 'stone',
    icon: 'morningglorygo',
    spec: [
        ...K.rb('MORNINGGLORYGO', '朝顔碁', 'morningglorygo'),
        K.params([
            { key: 'cycle', label: '昼夜の周期', min: 6, max: 30, def: 12, unit: '手', hint: '前半が朝 (花開く)・後半が夜 (しぼむ)' },
            { key: 'wither_age', label: '花が散る齢', min: 5, max: 30, def: 12, unit: '手' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST('{ born: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 朝顔碁: 生成手を記録。12手を過ぎて味方2石未満の孤立古株は枯れる
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.born[mi] = history.length;
                for (const k in st.born) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) { delete st.born[k]; continue; }
                    const age = history.length - st.born[k];
                    if (age >= (P('wither_age') || 12) && getNeighbors(idx).filter(n => board[n] === board[idx]).length < 2) {
                        const col = board[idx];
                        board[idx] = 0;
                        delete st.born[k];
                        fxSplash(idx, '#a78bfa');
                        fxText(idx, '枯', '#8b5cf6', 900);
                    }
                }
            }

            turn = opponent;`],
        // 咲いている石 (生後周期12手の前半) は終局時+1目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            for (const k in st.born) {
                const cell = +k;
                if (board[cell] !== 1 && board[cell] !== 2) continue;
                if ((history.length - st.born[k]) % Math.max(2, P('cycle') || 12) < Math.max(2, P('cycle') || 12) / 2) {
                    if (board[cell] === 1) territory.black += 1;
                    else territory.white += 1;
                }
            }`],
        // 咲いている石は紫の花、萎れた石は灰色ドット
        ...K.STONE_MARKS_SPEC(`            // 朝顔: 咲いている石に紫の花冠、萎れ期は薄い輪
            {
                const now = fxNow();
                ctx.save();
                for (const k in st.born) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const bloom = (history.length - st.born[k]) % Math.max(2, P('cycle') || 12) < Math.max(2, P('cycle') || 12) / 2;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = bloom ? 'rgba(167,139,250,' + (0.6 + 0.3 * Math.sin(now / 400 + idx)) + ')' : 'rgba(148,163,184,0.5)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * (bloom ? 0.33 : 0.22), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            朝顔碁: 石は12手周期で咲いては萎れる。咲いている石だけ終局時+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各石は生後12手周期で咲く (前半6手が開花期)。終局時に咲いている石1個につき+1目。',
            '生後12手を過ぎて味方2石未満の孤立した石は枯れて消える。',
            '石に寄り添わせて保たせ、終局のタイミングに咲かせる。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.born = {};
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('生まれた手が記録される', st.born[I(4, 4)] === 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        history.length = 13;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // (4,4)は生後13・孤立 → 枯れる
        assert('古く孤立した石は枯れる', board[I(4, 4)] === 0 && st.born[I(4, 4)] === undefined);
        assert('新しい石は枯れない', board[I(0, 0)] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
