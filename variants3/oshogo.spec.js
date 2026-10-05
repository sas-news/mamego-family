// OSHOGO — 王将碁: 各軍の最初の石は「王将」。王将を取れば即勝ち
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
const ST_INIT = `{ king: { 1: -1, 2: -1 } }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'oshogo.html',
    en: 'OSHOGO',
    jp: '王将碁',
    prefix: 'oshogo',
    desc: '各軍の最初の石は「王将」。王将が取られた側は即負け — 王を守り敵王を狩れ。',
    kind: 'stone',
    icon: 'oshogo',
    spec: [
        ...K.rb('OSHOGO', '王将碁', 'oshogo'),
        K.params([
            { key: 'king_move', label: '王将になる手数', min: 1, max: 5, def: 1, unit: '手目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        ...ST(ST_INIT),
        // 最初の着手が王将
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 王将碁: 各軍の設定手数目の石が王将
            if (st.king[player] < 0) {
                st.kcnt = st.kcnt || { 1: 0, 2: 0 };
                st.kcnt[player]++;
                if (st.kcnt[player] === Math.max(1, P('king_move') || 1)) {
                    st.king[player] = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                }
            }`],
        // 王将が取られたら即敗北 (capture 後に判定)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 王将碁: 王将が盤上から消えていたら即勝敗
            {
                const __dead = (st.king[opponent] >= 0 && board[st.king[opponent]] !== opponent) ? opponent
                    : (st.king[player] >= 0 && board[st.king[player]] !== player) ? player : 0;
                if (__dead > 0) {
                    const __win = __dead === 1 ? 2 : 1;
                    fxShake(st.king[__dead] >= 0 ? st.king[__dead] : 0, '#ef4444', 1200);
                    winByRule(__win, '王将取り', (__win === 1 ? '黒' : '白') + 'が敵の王将を取った');
                    return;
                }
            }

            turn = opponent;`],
        // 王将マーク: 王冠 (金の三角+点)
        ...K.STONE_MARKS_SPEC(`            for (const __p of [1, 2]) {
                const __i = st.king[__p];
                if (__i === undefined || __i < 0 || board[__i] !== __p) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                ctx.save();
                ctx.fillStyle = '#fbbf24';
                ctx.strokeStyle = 'rgba(120,80,0,0.8)';
                ctx.lineWidth = Math.max(0.8, cellSize * 0.03);
                const __r = cellSize * 0.16;
                ctx.beginPath();
                ctx.moveTo(__cx - __r, __cy + __r * 0.5);
                ctx.lineTo(__cx - __r, __cy - __r * 0.2);
                ctx.lineTo(__cx - __r * 0.45, __cy + __r * 0.15);
                ctx.lineTo(__cx, __cy - __r * 0.7);
                ctx.lineTo(__cx + __r * 0.45, __cy + __r * 0.15);
                ctx.lineTo(__cx + __r, __cy - __r * 0.2);
                ctx.lineTo(__cx + __r, __cy + __r * 0.5);
                ctx.closePath();
                ctx.fill(); ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            王将碁: 最初の石が王将。王将を取れば即勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '各軍の最初に置いた石は「王将」 (王冠印)。王将が取られた側は地の大小に関わらず即敗北。',
            '序手の位置が王座になる — 王を深く守りつつ敵王を狩る、将棋のような碁。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; gameOver = false;
        st = { king: { 1: -1, 2: -1 } };
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('最初の黒石が王将', st.king[1] === 6 * BOARD_SIZE + 6);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2);
        assert('最初の白石が王将', st.king[2] === 4 * BOARD_SIZE + 4);
        // 白の王将を呼吸0にして取る → 黒の即勝ち
        board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1; board[5 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 王将の最後の呼吸点を塞ぐ
        assert('王将を取ると即終局', gameOver === true);
    `,
};
