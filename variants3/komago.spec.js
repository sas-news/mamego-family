// KOMAGO — 独楽碁: 置いた石は独楽。回転中 (4手分) は取られず、止まると取れる
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
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
const ST_INIT = `{ born: {} }`;
module.exports = {
    file: 'komago.html',
    en: 'KOMAGO',
    jp: '独楽碁',
    prefix: 'komago',
    desc: '置いた石は独楽。回転中の4手分は取られず、止まると取れる。',
    kind: 'stone',
    icon: 'komago',
    spec: [
        ...K.rb('KOMAGO', '独楽碁', 'komago'),
        ...ST(ST_INIT),
        // 置いた石は回転を始める (生まれた手数を記録)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 独楽: 生まれた手数を記録 (回転開始)
            move.cells.forEach(p => { st.born[p.y * BOARD_SIZE + p.x] = history.length; });`],
        // 回転中の石は取れない (生まれてから4手分の間は免疫)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent)
                .filter(i => !(st.born[i] !== undefined && history.length - st.born[i] < 4));
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; delete st.born[idx]; });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        ...K.STONE_MARKS_SPEC(`            // 回転中の独楽: 水色の渦巻きリングを描く
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if ((board[i] === 1 || board[i] === 2) && st.born[i] !== undefined && history.length - st.born[i] < 4) {
                        const cx = padding + (i % BOARD_SIZE) * cellSize;
                        const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                        ctx.strokeStyle = 'rgba(56,189,248,0.85)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.62, 0.4, Math.PI * 1.6);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.62, Math.PI + 0.4, Math.PI * 2.6);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'独楽: 直近4手の石は回転中'`),
        [K.ONE, K.INFO_ALGO, `            独楽碁: 置いた石は独楽。回転中の4手分は取られず、止まると取れる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石は独楽となり、置いてから4手分の間は回転中として取られない。',
            '回転が止まった石は通常通り取れる。捕獲のタイミングをずらす攻防が生まれる。',
            '回転免疫は両プレイヤーに同じ条件で適用される。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.born = {};
        // 白石を置いて3方向を黒で囲む (まだ呼吸点あり)
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        board[I(4, 3)] = 1; board[I(3, 4)] = 1; board[I(5, 4)] = 1;
        board[I(4, 4)] = 2; st.born[I(4, 4)] = history.length;
        // 黒が最後の呼吸点を塞ぐが、白石は回転中なので取れない
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('回転中の石は取られない', board[I(4, 4)] === 2);
        assert('アゲハマは増えない', captures[1] === 0);
        // 回転が止まると (生まれて4手以上経つと) 取られる
        st.born[I(4, 4)] = history.length - 5;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('止まった石は取られる', board[I(4, 4)] === 0);
        assert('アゲハマが加算される', captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
    `,
};
