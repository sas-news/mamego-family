// AURORAGO — 極光碁: 各側5手ごとの着手は極光が現れ、全石に呼吸点+1 (その手は取りが起きない)
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ cnt: { 1: 0, 2: 0 } }`;
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
    file: 'aurorago.html',
    en: 'AURORAGO',
    jp: '極光碁',
    prefix: 'aurorago',
    desc: '各側5手ごとの着手は極光が現れ、全石に呼吸点+1。その手は取りが起きない。',
    kind: 'stone',
    icon: 'aurorago',
    spec: [
        ...K.rb('AURORAGO', '極光碁', 'aurorago'),
        ...ST(ST_INIT),
        // 極光: 各プレイヤー5手ごとの着手では全石に幻影の呼吸点が与えられ、取りが起きない
        [K.ONE, K.CAPTURE_BLOCK, `            st.cnt[player]++;
            const aurora = st.cnt[player] % 5 === 0;
            const captured = aurora ? [] : getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }
            if (aurora) {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxText(mi, '極光!', '#a78bfa', 1400);
                fxGlow(mi, '#a78bfa', 1000);
            }`],
        // 極光ターンは盤全体を淡い光の帯で彩る
        K.CUE_GRID(`            // 極光: 前の手が極光だった局面では空に光の帯が流れる
            {
                const lastAurora = (turn === 1 ? st.cnt[2] : st.cnt[1]) % 5 === 0 && (turn === 1 ? st.cnt[2] : st.cnt[1]) > 0;
                if (lastAurora) {
                    ctx.save();
                    const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                    const g = ctx.createLinearGradient(padding, padding, padding, w - padding);
                    g.addColorStop(0, 'rgba(167,139,250,0.10)');
                    g.addColorStop(0.5, 'rgba(52,211,153,0.08)');
                    g.addColorStop(1, 'rgba(167,139,250,0.02)');
                    ctx.fillStyle = g;
                    ctx.fillRect(padding, padding, w - padding * 2, w - padding * 2);
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`'極光まで ' + (5 - st.cnt[turn] % 5) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            極光碁: 各側5手ごとの着手で極光が現れ、全石に呼吸点+1。その手では取りが起きない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの5手ごとの着手 (5,10,15手目) には極光が現れる。',
            '極光の手では全ての石に幻影の呼吸点+1 — その手ではどの連も取られない。',
            '取りたい手を極光のタイミングに避ける/ぶつける読み合い。双方に同じ周期。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.cnt = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        const mk = () => { board.fill(0); board[4 * B + 4] = 2; board[4 * B + 3] = 1; board[5 * B + 4] = 1; board[3 * B + 4] = 1; };
        mk(); st.cnt = { 1: 4, 2: 0 };
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 5手目 → 極光
        assert('極光の手は取れない', board[4 * B + 4] === 2);
        assert('手数が進む', st.cnt[1] === 5);
        mk(); st.cnt = { 1: 5, 2: 0 };
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 6手目 → 通常
        assert('極光でなければ取れる', board[4 * B + 4] === 0 && captures[1] === 1);
        mk(); st.cnt = { 1: 0, 2: 4 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 6, y: 4 }] }, 2); // 白の5手目 → 極光 (取る側ではない)
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
    `,
};
