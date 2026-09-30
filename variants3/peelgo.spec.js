// PEELGO — 剥落碁: 古い石の表面が剥がれて効果を失い、色の抜けた殻(4)として残る
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= 150) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'peelgo.html',
    en: 'PEELGO',
    jp: '剥落碁',
    prefix: 'peelgo',
    desc: '置いてから35手で石の表面が剥落し、色の抜けた殻(置けない障害)として残る。',
    kind: 'stone',
    icon: 'peelgo',
    spec: [
        ...K.rb('PEELGO', '剥落碁', 'peelgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { age: {} }; // 石の誕生手数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { age: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { age: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { age: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { age: {} };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 剥落: 置いた石に年齢を刻み、35手で表面が剥がれて殻 (4) になる
            {
                const li = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.age[li] = history.length;
                let peeled = 0;
                Object.keys(st.age).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) { delete st.age[i]; return; }
                    if (history.length - st.age[i] >= 35) {
                        board[i] = 4; // 色が剥落して殻になる
                        delete st.age[i];
                        peeled++;
                        fxSplash(i, '#a8a29e', 8);
                    }
                });
                if (peeled) {
                    fxText(li, '剥落!', '#a8a29e', 1100);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 剥落した殻: 色の抜けた石の形
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        obstaclePainter = (val, cx, cy, cs, idx) => {
            if (val !== 4) return false;
            ctx.save();
            ctx.fillStyle = '#d6d3d1';
            ctx.beginPath();
            ctx.arc(cx, cy, cs * 0.36, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#78716c';
            ctx.lineWidth = Math.max(1, cs * 0.04);
            ctx.stroke();
            // 剥がれた欠け
            ctx.strokeStyle = '#a8a29e';
            ctx.lineWidth = Math.max(1, cs * 0.05);
            ctx.beginPath();
            ctx.arc(cx - cs * 0.05, cy - cs * 0.05, cs * 0.2, Math.PI * 0.2, Math.PI * 1.1);
            ctx.stroke();
            ctx.restore();
            return true;
        };`],
        // 剥落間近の石に薄い粉吹き
        ...K.STONE_MARKS_SPEC(`            // 剥落間近 (残り10手) の石に粉吹きマーク
            {
                ctx.save();
                ctx.fillStyle = 'rgba(214,211,209,0.8)';
                Object.keys(st.age || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    if (history.length - st.age[i] < 25) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx + cellSize * 0.12, cy + cellSize * 0.12, cellSize * 0.07, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(cx - cellSize * 0.14, cy - cellSize * 0.05, cellSize * 0.05, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            剥落碁: 古い石は表面が剥がれて殻として残る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は古くなると表面が剥落する — 置いてから35手で色が抜け、置けない殻として盤上に残る。',
            '剥落間近の石には粉が吹く。殻は永遠に残り、盤はだんだん使えなくなる。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { age: {} };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('誕生手数が刻まれる', st.age[I(4, 4)] === 1);
        history.length = 36;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2); // 37手目: 36手経過で剥落
        assert('35手で剥落する', board[I(4, 4)] === 4 && st.age[I(4, 4)] === undefined);
        assert('殻には置けない', isValidPlacement([{ x: 4, y: 4 }], 1) === false);
        board.fill(0); st = { age: {} };
        assert('起動して通常着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
