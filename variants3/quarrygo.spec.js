// QUARRYGO — 採石碁: 盤の4箇所の採石場は利用回数に限りがある。尽きた採石場は障害物に枯れる
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
const ST_INIT = `{ q: {} }`;
const QUARRY_FN = `        // 採石場: 盤の四隅寄りに4箇所。各3回まで掘れる
        function quarryCells() {
            const m = BOARD_SIZE - 1;
            return [
                [Math.round(0.23 * m), Math.round(0.23 * m)],
                [Math.round(0.77 * m), Math.round(0.23 * m)],
                [Math.round(0.23 * m), Math.round(0.77 * m)],
                [Math.round(0.77 * m), Math.round(0.77 * m)],
            ].map(([x, y]) => y * BOARD_SIZE + x);
        }
`;
module.exports = {
    file: 'quarrygo.html',
    en: 'QUARRYGO',
    jp: '採石碁',
    prefix: 'quarrygo',
    desc: '4箇所の採石場は各3回まで石を掘り出せる。尽きると障害物に枯れる。',
    kind: 'stone',
    icon: 'quarrygo',
    spec: [
        ...K.rb('QUARRYGO', '採石碁', 'quarrygo'),
        ...ST(ST_INIT),
        [K.ONE, '        function updateUI() {', QUARRY_FN + `
        function updateUI() {`],
        // 採石場に置くと残量-1。尽きたらその点は障害物に枯れる
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 採石: 採石場の石は掘り出すたび残量を削り、尽きたら枯れて壁になる
            {
                const qi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (quarryCells().includes(qi)) {
                    st.q[qi] = (st.q[qi] || 0) + 1;
                    fxText(qi, '残' + Math.max(0, 3 - st.q[qi]), '#a8a29e', 900);
                }
            }`],
        // 枯れた採石場を障害物化 (着手後に判定)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 採石場の枯渇: 3回掘られた場所が空いたら障害物になる
            quarryCells().forEach(qi => {
                if ((st.q[qi] || 0) >= 3 && board[qi] === 0) {
                    board[qi] = 3;
                    fxGlow(qi, '#44403c', 800);
                    fxText(qi, '枯渇', '#78716c', 1100);
                }
            });

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 採石場: 鶴嘴マーク (斜めの山形) + 残量
            {
                ctx.save();
                quarryCells().forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    const used = st.q[i] || 0;
                    if (board[i] === 3) return;
                    ctx.strokeStyle = used >= 3 ? 'rgba(120,113,108,0.5)' : 'rgba(87,83,78,0.9)';
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.22, cy - cellSize * 0.18);
                    ctx.lineTo(cx + cellSize * 0.22, cy - cellSize * 0.18);
                    ctx.lineTo(cx + cellSize * 0.10, cy + cellSize * 0.20);
                    ctx.stroke();
                    ctx.fillStyle = used >= 3 ? 'rgba(120,113,108,0.6)' : 'rgba(87,83,78,0.95)';
                    ctx.font = \`bold \${Math.max(8, cellSize * 0.22)}px sans-serif\`;
                    ctx.textAlign = 'center';
                    ctx.fillText(String(3 - used), cx, cy + cellSize * 0.30);
                });
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            採石碁: 4箇所の採石場は各3回まで石を掘り出せる。尽きると障害物に枯れる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の四隅寄りに4つの「採石場」。そこに置いた石は採掘扱いで残量が-1。',
            '残量3回を掘り尽くしその点が空くと、採石場は枯れて侵入不可の障害物になる。',
            '早い者勝ちの資源地を巡る争い。両者に同じ採石場。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.q = {};
        const qs = quarryCells();
        assert('採石場は4箇所', qs.length === 4);
        const qx = qs[0] % BOARD_SIZE, qy = Math.floor(qs[0] / BOARD_SIZE);
        executeMove({ cells: [{ x: qx, y: qy }] }, 1);
        assert('採石すると残量-1', st.q[qs[0]] === 1);
        // 3回掘り尽くして石が取られると枯れる
        st.q[qs[0]] = 3;
        board[qs[0]] = 0;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('枯れた採石場は障害物', board[qs[0]] === 3);
        assert('障害物には置けない', isValidPlacement([{ x: qx, y: qy }], 1) === false);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 0 }], 1) === true);
    `,
};
