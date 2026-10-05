// KEEPSAKEGO — 形見碁: 取られた石は形見(4)として名残を残し、終局時に亡き主の1目になる
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
            if (!capFired && history.length >= Math.max(1, P('cap_moves') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'keepsakego.html',
    en: 'KEEPSAKEGO',
    jp: '形見碁',
    prefix: 'keepsakego',
    desc: '取られた石は形見として名残を残す。形見は終局時に亡き主の1目になる。',
    kind: 'stone',
    icon: 'keepsakego',
    spec: [
        ...K.rb('KEEPSAKEGO', '形見碁', 'keepsakego'),
        K.params([
            { key: 'mem_pts', label: '形見1個の終局得点', min: 0, max: 4, def: 1, unit: '目' },
            { key: 'cap_moves', label: '打ち切り手数', min: 40, max: 400, def: 150, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { mem: {} }; // 形見セル idx→亡き主 (1/2)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { mem: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { mem: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { mem: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { mem: {} };`],
        // 形見: 取られた石はその場に名残 (4) を残す — 主は死んだ側
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    board[idx] = 4; // 形見として名残を残す
                    st.mem[idx] = opponent; // 亡き主
                    captures[player]++;
                    fxGlow(idx, '#fbbf24', 900);
                });
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 形見の描画: 亡き主の色の小さな供養塔
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        obstaclePainter = (val, cx, cy, cs, idx) => {
            if (val !== 4) return false;
            ctx.save();
            const owner = st.mem[idx];
            const g = ctx.createLinearGradient(cx, cy - cs * 0.4, cx, cy + cs * 0.4);
            g.addColorStop(0, '#e7e5e4'); g.addColorStop(1, '#a8a29e');
            ctx.fillStyle = g;
            // 五輪塔風の形見
            ctx.beginPath();
            ctx.arc(cx, cy - cs * 0.22, cs * 0.11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(cx - cs * 0.12, cy - cs * 0.12, cs * 0.24, cs * 0.16);
            ctx.beginPath();
            ctx.moveTo(cx - cs * 0.16, cy + cs * 0.04);
            ctx.lineTo(cx + cs * 0.16, cy + cs * 0.04);
            ctx.lineTo(cx + cs * 0.12, cy + cs * 0.2);
            ctx.lineTo(cx - cs * 0.12, cy + cs * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = owner === 1 ? '#111' : '#57534e';
            ctx.lineWidth = Math.max(1, cs * 0.03);
            ctx.stroke();
            ctx.restore();
            return true;
        };`],
        // 採点: 形見は亡き主の1目
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            let memB = 0, memW = 0;
            Object.keys(st.mem).forEach(k => { if (board[k] === 4) { if (st.mem[k] === 1) memB += (P('mem_pts') ?? 1); else memW += (P('mem_pts') ?? 1); } });
            const blackTotal = territory.black + captures[1] + memB;
            const whiteTotal = territory.white + captures[2] + komi + memW;`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の形見:</span> <strong>\${memB}目</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の形見:</span> <strong>\${memW}目</strong></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            形見碁: 取られた石は形見を残し、終局時に亡き主の1目になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '取られた石はその場に「形見」(小さな供養塔) を残す。形見には誰も置けない。',
            '終局時、形見は亡き主の1目になる — 取られるほど相手に形見の地を贈ることになる。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { mem: {} };
        board[I(4, 4)] = 2;
        board[I(3, 4)] = 1; board[I(5, 4)] = 1; board[I(4, 3)] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('形見が残る', board[I(4, 4)] === 4 && captures[1] === 1);
        assert('形見の主は白', st.mem[I(4, 4)] === 2);
        assert('形見には置けない', isValidPlacement([{ x: 4, y: 4 }], 2) === false);
        board.fill(0); st = { mem: {} };
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
