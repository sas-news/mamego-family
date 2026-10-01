// SIMULGO — 見合碁: 相手の直前の着手と点対称の点に打つと「見合い」— 双方の石が無効で消える
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ last: { 1: -1, 2: -1 } }`;
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
    file: 'simulgo.html',
    en: 'SIMULGO',
    jp: '見合碁',
    prefix: 'simulgo',
    desc: '相手の直前の着手の点対称に打つと「見合い」— 双方の石が無効で消える。',
    kind: 'stone',
    icon: 'simulgo',
    spec: [
        ...K.rb('SIMULGO', '見合碁', 'simulgo'),
        K.params([
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 見合い: 着手点が相手の直前の着手点の点対称なら、双方の石が消える (無効)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            {
                const c0 = move.cells[0];
                const pi = c0.y * BOARD_SIZE + c0.x;
                const mirror = (BOARD_SIZE - 1 - c0.y) * BOARD_SIZE + (BOARD_SIZE - 1 - c0.x);
                if (st.last[opponent] === mirror && board[mirror] === opponent) {
                    // 見合い成立: 宣言が被り、双方の石が無効で消える
                    board[pi] = 0;
                    board[mirror] = 0;
                    st.last[opponent] = -1;
                    fxText(pi, '見合い!', '#38bdf8', 1400);
                    fxBurst(mirror, '#38bdf8', 9, 1.5);
                    fxShake(5, 320);
                    cleanUpPieces();
                } else {
                    st.last[player] = pi;
                }
            }

            turn = opponent;`],
        // 相手の宣言点とその対称点を水色リングで示す
        ...K.STONE_MARKS_SPEC(`            const ml = st.last[turn === 1 ? 2 : 1];
            if (ml >= 0) {
                const cx = padding + (ml % BOARD_SIZE) * cellSize;
                const cy = padding + ((ml / BOARD_SIZE) | 0) * cellSize;
                const mx = padding + (BOARD_SIZE - 1 - ml % BOARD_SIZE) * cellSize;
                const my = padding + (BOARD_SIZE - 1 - ((ml / BOARD_SIZE) | 0)) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(56,189,248,0.6)';
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                [[cx, cy], [mx, my]].forEach(([px, py]) => {
                    ctx.beginPath();
                    ctx.arc(px, py, cellSize * 0.32, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.setLineDash([cellSize * 0.08, cellSize * 0.08]);
                ctx.beginPath();
                ctx.moveTo(cx, cy); ctx.lineTo(mx, my);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.last[3 - turn] >= 0 ? '相手宣言あり — 対称点注意' : ''`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            見合碁: 相手の直前の着手の点対称位置に打つと「見合い」— 双方の石が無効で消える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '双方が同時に着手点を宣言する精神 — 相手の直前の着手の点対称 (天元で反転) は「被り」。',
            '被ると双方の石が無効で消える (アゲハマにもならない)。相手の宣言点は水色で示される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.last = { 1: -1, 2: -1 };
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1);
        assert('宣言点を記録', st.last[1] === 3 * BOARD_SIZE + 2);
        executeMove({ cells: [{ x: BOARD_SIZE - 1 - 2, y: BOARD_SIZE - 1 - 3 }] }, 2); // 点対称 → 見合い
        assert('宣言側の石も消える', board[3 * BOARD_SIZE + 2] === 0);
        assert('被った石も消える', board[(BOARD_SIZE - 1 - 3) * BOARD_SIZE + (BOARD_SIZE - 1 - 2)] === 0);
        assert('手番は進む', turn === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 2);
        assert('対称でなければ通常', board[0] === 1 && board[BOARD_SIZE + 1] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
