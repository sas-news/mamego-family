// CRYSTALGO — 結晶碁: 4個以上で連結した石は結晶化。結晶は取られないが連にもならない
const K = require('../gen_kit.js');
module.exports = {
    file: 'crystalgo.html',
    en: 'CRYSTALGO',
    jp: '結晶碁',
    prefix: 'crystalgo',
    desc: '4個以上繋がった石は結晶化して不滅になるが、それ以上連にはならない。',
    kind: 'stone',
    icon: 'crystalgo',
    spec: [
        ...K.rb('CRYSTALGO', '結晶碁', 'crystalgo'),
        K.params([
            { key: 'crystal_min', label: '結晶化に必要な連サイズ', min: 2, max: 8, def: 4, unit: '石' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { cry: {} }; // 結晶マス idx -> 1`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { cry: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { cry: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { cry: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { cry: {} };`],
        // 結晶は取られない (連の集計から除外)
        [K.ONE, `            if (boardState[i] === player && !visited[i]) {`,
`            if (boardState[i] === player && !visited[i] && !st.cry[i]) {`],
        [K.ALL, `                        } else if (boardState[n] === player && !visited[n]) {`,
`                        } else if (boardState[n] === player && !visited[n] && !st.cry[n]) {`],
        // 着手後: 4個以上の連を結晶化
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            {
                const seen = Array(board.length).fill(false);
                for (let i = 0; i < board.length; i++) {
                    if ((board[i] === 1 || board[i] === 2) && !seen[i] && !st.cry[i]) {
                        const grp = getConnectedGroup(i, board[i]);
                        grp.forEach(g => { seen[g] = true; });
                        if (grp.length >= (P('crystal_min') || 4)) grp.forEach(g => { st.cry[g] = 1; fxGlow(g, '#67e8f9', 700); });
                    }
                }
            }
            turn = opponent;`],
        // 結晶の描画: 水色のダイヤ
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (const k in st.cry) {
                    const i = +k, x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    if (board[i] === 0) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const s = cellSize * 0.20;
                    ctx.fillStyle = 'rgba(103,232,249,0.9)';
                    ctx.strokeStyle = '#0e7490';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - s);
                    ctx.lineTo(cx + s * 0.8, cy);
                    ctx.lineTo(cx, cy + s);
                    ctx.lineTo(cx - s * 0.8, cy);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            結晶碁: 4個以上繋がった石は結晶化 (水色◆) して不滅になるが、それ以上連にはならない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '同色4個以上の連は結晶化 (水色◆) する。結晶は取られず、以後の連にも合流しない。',
            '結晶は安全な壁。大きく育てると息継ぎが途切れるので3連止めが堅い。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; st.cry = {}; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 3, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 8, y: 9 }] }, 2);
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 9, y: 8 }] }, 2);
        assert('3連では未結晶', st.cry[2 * BOARD_SIZE + 2] === undefined);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('4連で結晶化', st.cry[2 * BOARD_SIZE + 2] === 1 && st.cry[3 * BOARD_SIZE + 3] === 1);
        board[1 * BOARD_SIZE + 2] = 2; board[2 * BOARD_SIZE + 1] = 2; board[4 * BOARD_SIZE + 2] = 2;
        board[1 * BOARD_SIZE + 3] = 2; board[2 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 3] = 2;
        board[3 * BOARD_SIZE + 4] = 2;
        assert('結晶は囲んでも取れない', getCapturedStones(board, 1).length === 0);
        board[3 * BOARD_SIZE + 1] = 1; // 結晶の隣に新石 (直接置き)
        board[3 * BOARD_SIZE + 0] = 2; board[0 * BOARD_SIZE + 1] = 2; board[4 * BOARD_SIZE + 1] = 2;
        const dead = getCapturedStones(board, 1);
        assert('結晶に新石は連結しない', dead.includes(3 * BOARD_SIZE + 1) && !dead.includes(3 * BOARD_SIZE + 2));
    `,
};
