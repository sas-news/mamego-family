// MIAIGO — 見合碁: 天元を挟む対称点は「見合い」。片方を取ると反対側は相手の予約点になる
const K = require('../gen_kit.js');
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
const ST_INIT = `{ reserved: {} }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'miaigo.html',
    en: 'MIAIGO',
    jp: '見合碁',
    prefix: 'miaigo',
    desc: '天元を挟む対称点は見合い — 片方を取ると反対側は次の相手の予約点になる。',
    kind: 'stone',
    icon: 'miaigo',
    spec: [
        ...K.rb('MIAIGO', '見合碁', 'miaigo'),
        K.params([
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 予約点は着手できない (所有者以外)
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                const __ri = p.y * BOARD_SIZE + p.x;
                if (st.reserved && st.reserved[__ri] && st.reserved[__ri] !== player) return false;
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }`],
        // 着手後: 対称点を相手の予約点にする (自分の予約点に置いた場合は消費)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 見合碁: 天元対称点を次の相手の予約点にする
            {
                const __p = move.cells[0];
                const __pi = __p.y * BOARD_SIZE + __p.x;
                if (st.reserved[__pi] === player) delete st.reserved[__pi]; // 予約消化
                const __mx = (BOARD_SIZE - 1) - __p.x;
                const __my = (BOARD_SIZE - 1) - __p.y;
                const __mi = __my * BOARD_SIZE + __mx;
                if (__mi !== __pi && board[__mi] === 0) {
                    st.reserved[__mi] = opponent;
                    fxGlow(__mi, '#a78bfa', 700);
                }
            }

            turn = opponent;`],
        // 予約点マーカー: 所有者色の薄い菱形
        ...K.STONE_MARKS_SPEC(`            for (const __k of Object.keys(st.reserved || {})) {
                const __i = Number(__k), __owner = st.reserved[__k];
                if (board[__i] !== 0) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                const __r = cellSize * 0.14;
                ctx.save();
                ctx.strokeStyle = __owner === 1 ? 'rgba(30,30,30,0.55)' : 'rgba(255,255,255,0.75)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                ctx.beginPath();
                ctx.moveTo(__cx, __cy - __r); ctx.lineTo(__cx + __r, __cy);
                ctx.lineTo(__cx, __cy + __r); ctx.lineTo(__cx - __r, __cy);
                ctx.closePath(); ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            見合碁: 対称点を取ると反対側が相手の予約点になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '天元を挟む180°対称点は「見合い」。片方に置くと、反対側の点は次の相手だけが置ける予約点になる。',
            '2つの好点を並べればどちらかは必ず取れる — 見合いの思考がそのままルールになった碁。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { reserved: {} };
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        const mir = (BOARD_SIZE - 1 - 3) * BOARD_SIZE + (BOARD_SIZE - 1 - 3);
        assert('対称点が相手の予約点になる', st.reserved[mir] === 2);
        assert('予約点は所有者以外置けない', isValidPlacement([{ x: BOARD_SIZE - 1 - 3, y: BOARD_SIZE - 1 - 3 }], 1) === false);
        assert('所有者は予約点に置ける', isValidPlacement([{ x: BOARD_SIZE - 1 - 3, y: BOARD_SIZE - 1 - 3 }], 2) === true);
        executeMove({ cells: [{ x: BOARD_SIZE - 1 - 3, y: BOARD_SIZE - 1 - 3 }] }, 2);
        assert('予約消化で消える', st.reserved[mir] === undefined);
    `,
};
