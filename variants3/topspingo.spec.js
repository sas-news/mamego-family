// TOPSPINGO — 独楽碁: 置いたばかりの石は独楽のように回転し、自分の次の2手の間は取れない。止まると普通に弱い
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
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
const ST_INIT = `{ spin: {} }`; // 回転中の石 idx → 持ち主の残り手数
module.exports = {
    file: 'topspingo.html',
    en: 'TOPSPINGO',
    jp: '独楽碁',
    prefix: 'topspingo',
    desc: '置いた石は独楽のように回転し、自分の次の2手の間は取れない。止まれば普通の石。',
    kind: 'stone',
    icon: 'topspingo',
    spec: [
        ...K.rb('TOPSPINGO', '独楽碁', 'topspingo'),
        ...ST(ST_INIT),
        // 回転中の独楽 (st.spin>0) は捕獲対象にならない
        [K.ONE, `                    if (!hasLiberty) {
                        captured.push(...group);
                    }`,
`                    if (!hasLiberty) {
                        // 独楽: 回転中の石は取れない (止まると普通に取れる)
                        captured.push(...group.filter(i => !st.spin[i]));
                    }`],
        // 着手ごとに自分の独楽の回転を1減らし、新しい石は回転2で置く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 独楽碁: 自分の回転中の石は自分の手番ごとに1段落ちる (0で停止して取れるようになる)
            Object.keys(st.spin).forEach(k => {
                const i = +k;
                if (board[i] === 0) { delete st.spin[k]; return; }
                if (board[i] !== player) return; // 相手の独楽は持ち主の手番で落ちる
                st.spin[k]--;
                if (st.spin[k] <= 0) { delete st.spin[k]; fxGlow(i, '#a8a29e', 500); }
            });
            // 新しい石は独楽として回転し始める (自分の次の2手の間は取れない)
            {
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (board[ci] === player) {
                    st.spin[ci] = 2;
                    fxText(ci, 'ヒュルヒュル', '#38bdf8', 800);
                }
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 回転中の独楽: 円弧の回転マークを描く
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(56,189,248,0.9)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                for (const k in st.spin) {
                    const i = +k;
                    if (board[i] === 0) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    const a0 = (fxNow() / 120 + i) % (Math.PI * 2);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.52, a0, a0 + Math.PI * 1.2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            独楽碁: 置いた石は独楽のように回転。自分の次の2手の間は敵に取られない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いたばかりの石は独楽のように回転しており、自分があと2手指すまで敵に取られない。',
            '回転が止まると普通の石に戻る (取れるし取られる)。自殺手判定でも回転中の石は取れない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.spin = {};
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[2 * BOARD_SIZE + 3] = 2; board[3 * BOARD_SIZE + 2] = 2; board[3 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 3] = 2;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // 白に囲まれた独楽石 (回転中は取れない)
        assert('新しい石は回転中', st.spin[3 * BOARD_SIZE + 3] === 2);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2); // 白の手番 — 囲まれているが回転中
        assert('回転中は取れない', board[3 * BOARD_SIZE + 3] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 黒2手目 → 回転残1
        executeMove({ cells: [{ x: 9, y: 8 }] }, 2); // まだ回っているので取れない
        assert('残1でも取れない', board[3 * BOARD_SIZE + 3] === 1);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1); // 黒3手目 → 回転0で停止
        assert('回転が止まった', st.spin[3 * BOARD_SIZE + 3] === undefined);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('止まると取られる', board[3 * BOARD_SIZE + 3] === 0);
    `,
};
