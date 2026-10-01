// TOTALITYGO — 日食碁: 9手ごとの着手は皆既日食。全石が影になり取れず、置いた石は次の1手も影に残る
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ ply: 0, shadow: -1 }`;
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
    file: 'totalitygo.html',
    en: 'TOTALITYGO',
    jp: '日食碁',
    prefix: 'totalitygo',
    desc: '9手ごとの皆既日食で全石が影になり取れない。置いた石は次の1手も影に残る。',
    kind: 'stone',
    icon: 'totalitygo',
    spec: [
        ...K.rb('TOTALITYGO', '日食碁', 'totalitygo'),
        K.params([
            { key: 'eclipse_interval', label: '皆既日食の間隔', min: 3, max: 30, def: 9, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.75, hint: '交点数比' },
        ]),
        ...ST(ST_INIT),
        // 影石は取り判定・窒息判定の対象外 (次の1手の間、呼吸点を失わない)
        [K.ONE, `            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {`,
`            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i] && i !== st.shadow) {`],
        // 皆既日食: 9手ごとの着手は全石が影になり取りが起きない。日食で置いた石は次の1手も取れない
        [K.ONE, K.CAPTURE_BLOCK, `            st.ply++;
            const eclipse = st.ply % (P('eclipse_interval') || 9) === 0;
            const shadowWas = st.shadow;
            st.shadow = -1;
            let captured = eclipse ? [] : getCapturedStones(board, opponent);
            if (captured.length > 0) captured = captured.filter(i => i !== shadowWas);
            if (eclipse) {
                st.shadow = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxText(st.shadow, '皆既日食!', '#f97316', 1400);
                fxGlow(st.shadow, '#f97316', 1100);
            }
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 日食後の影石を黒い輪郭で示す
        ...K.STONE_MARKS_SPEC(`            if (st.shadow >= 0) {
                const cx = padding + (st.shadow % BOARD_SIZE) * cellSize;
                const cy = padding + ((st.shadow / BOARD_SIZE) | 0) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(20,20,20,0.85)';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.34, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(249,115,22,0.7)';
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.40, -Math.PI * 0.4, Math.PI * 0.4);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'日食まで ' + ((P('eclipse_interval') || 9) - st.ply % (P('eclipse_interval') || 9)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            日食碁: 9手ごとの着手は皆既日食 — 全石が影になり敵に取れない。日食の石は次の1手も影に残る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤全体を数える手数が9の倍数になる着手の瞬間、皆既日食が起こる (双方交互に巡る)。',
            '日食の手では全ての石が影になり、どの連も取れない。',
            'さらに日食で置いた石は次の相手の1手の間も影に残り、取ることができない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.ply = 0; st.shadow = -1;
        const B = BOARD_SIZE;
        const mk = () => { board.fill(0); board[4 * B + 4] = 2; board[4 * B + 3] = 1; board[5 * B + 4] = 1; board[3 * B + 4] = 1; };
        mk(); st.ply = 8;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 9手目 → 日食
        assert('日食の手は取れない', board[4 * B + 4] === 2);
        assert('日食で置いた石は影', st.shadow === 4 * B + 5);
        board[4 * B + 6] = 2; board[5 * B + 5] = 2; board[3 * B + 5] = 2; // (5,4)を囲む白
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2); // 白の普通の手 → (5,4)は取れるはずが影
        assert('影の石は次の1手も取れない', board[4 * B + 5] === 1);
        mk(); st.ply = 9; st.shadow = -1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 10手目 → 通常
        assert('日食が明ければ取れる', board[4 * B + 4] === 0 && captures[1] === 1);
    `,
};
