// SEEDGO — 種子碁: 石は配置時に「種」。3手後に発芽して近傍1マスへ新石が生える
const K = require('../gen_kit.js');
module.exports = {
    file: 'seedgo.html',
    en: 'SEEDGO',
    jp: '種子碁',
    prefix: 'seedgo',
    desc: '打った石は「種」。3手後に発芽し、空いた近傍へ新しい石が生える。',
    kind: 'stone',
    icon: 'seedgo',
    spec: [
        ...K.rb('SEEDGO', '種子碁', 'seedgo'),
        K.params([
            { key: 'sprout_turns', label: '発芽までの手数', min: 1, max: 8, def: 3, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { seed: {} }; // 種マス idx -> [残り手数, 色]
        function sproutDirs() { return null; }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { seed: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { seed: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { seed: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { seed: {} };`],
        // 手番ごとに種が育ち、熟すと近傍の空きへ発芽する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            const ripened = [];
            for (const k in st.seed) {
                if (--st.seed[k][0] <= 0) ripened.push(+k);
            }
            ripened.forEach(i => {
                const col = st.seed[i][1];
                delete st.seed[i];
                if (board[i] !== col) return; // 種が死んでいれば発芽しない
                const spots = getNeighbors(i).filter(n => board[n] === 0);
                if (spots.length === 0) return;
                const t = spots[0];
                board[t] = col;
                cleanUpPieces();
                fxGlow(t, '#86efac', 600);
                fxText(t, '芽!', '#4ade80', 900);
            });
            move.cells.forEach(p => { st.seed[p.y * BOARD_SIZE + p.x] = [Math.max(1, P('sprout_turns') || 3), player]; });
            turn = opponent;`],
        // 種の描画: 石の上に小さな芽
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (const k in st.seed) {
                    const i = +k, x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    if (board[i] === 0) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const grow = ((P('sprout_turns') || 3) + 1 - st.seed[i][0]) / (P('sprout_turns') || 3);
                    ctx.strokeStyle = '#4ade80';
                    ctx.fillStyle = '#86efac';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.10);
                    ctx.quadraticCurveTo(cx + cellSize * 0.02, cy - cellSize * 0.28 * grow, cx + cellSize * 0.10, cy - cellSize * 0.34 * grow);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.ellipse(cx + cellSize * 0.12, cy - cellSize * 0.34 * grow, cellSize * 0.09, cellSize * 0.05, -0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            種子碁: 打った石は「種」。3手後に発芽して空いた近傍へ新しい石が生える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '打った石は「種」(芽印) になり、3手後に隣の空きマスへ自動で新しい石が生える。',
            '発芽先は左上から順に最初の空き。種が取られると発芽しない。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; st.seed = {}; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        const si = 4 * BOARD_SIZE + 4;
        assert('種が仕込まれた', st.seed[si] && st.seed[si][0] === 3 && st.seed[si][1] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        assert('まだ発芽していない', st.seed[si] !== undefined && board[si] === 1);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2);
        assert('発芽して近傍に生えた', board[4 * BOARD_SIZE + 3] === 1);
        assert('種マークは消えた', st.seed[si] === undefined);
    `,
};
