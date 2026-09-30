// GHOSTGO2 — 幽体碁: 打った石は3手間「幽霊状態」で取られない・呼吸もしない
const K = require('../gen_kit.js');
module.exports = {
    file: 'ghostgo2.html',
    en: 'GHOSTGO2',
    jp: '幽体碁',
    prefix: 'ghostgo2',
    desc: '打った石は3手間「幽霊状態」。取られないが呼吸も連結もしない。',
    kind: 'stone',
    icon: 'ghostgo2',
    spec: [
        ...K.rb('GHOSTGO2', '幽体碁', 'ghostgo2'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { ghost: {} }; // 幽霊マス idx -> 残り手数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { ghost: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { ghost: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { ghost: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { ghost: {} };`],
        // 幽霊は取られない (連の集計から除外)
        [K.ONE, `            if (boardState[i] === player && !visited[i]) {`,
`            if (boardState[i] === player && !visited[i] && !st.ghost[i]) {`],
        [K.ALL, `                        } else if (boardState[n] === player && !visited[n]) {`,
`                        } else if (boardState[n] === player && !visited[n] && !st.ghost[n]) {`],
        // 新しく置いた石を幽霊化 + 幽霊タイマー更新
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            for (const k in st.ghost) {
                if (--st.ghost[k] <= 0) { delete st.ghost[k]; fxGlow(+k, '#a5b4fc', 500); }
            }
            move.cells.forEach(p => { st.ghost[p.y * BOARD_SIZE + p.x] = 3; });
            turn = opponent;`],
        // 幽霊の描画: 淡い靄のリング
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (const k in st.ghost) {
                    const i = +k, x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const a = 0.35 + 0.15 * Math.sin(fxNow() / 200 + i);
                    ctx.strokeStyle = 'rgba(165,180,252,' + a.toFixed(3) + ')';
                    ctx.lineWidth = Math.max(2, cellSize * 0.09);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            幽体碁: 打った石は3手間「幽霊状態」(紫の輪) で取られない・呼吸も連結もしない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '新しく打った石は3手間「幽霊」(紫の輪)。取られず呼吸もしないが、マスは占有する。',
            '幽霊が実体化すると初めて連に加わり呼吸し始める。救援の時間稼ぎに使える。',
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
        board.fill(0); pieces = []; st.ghost = {}; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        const gi = 4 * BOARD_SIZE + 4;
        assert('新しい石は幽霊', st.ghost[gi] === 3);
        board[3 * BOARD_SIZE + 4] = 2; board[5 * BOARD_SIZE + 4] = 2;
        board[4 * BOARD_SIZE + 3] = 2; board[4 * BOARD_SIZE + 5] = 2;
        assert('幽霊は囲んでも取れない', getCapturedStones(board, 1).length === 0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2);
        assert('3手後に実体化する', st.ghost[gi] === undefined);
        assert('実体化後は取れる判定になる', getCapturedStones(board, 1).length === 1);
    `,
};
