// SYMMETRYGO — 対称碁: 中央縦軸の镜像位置に自分の石がある場所に置くと対称美ボーナス+2目
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
    file: 'symmetrygo.html',
    en: 'SYMMETRYGO',
    jp: '対称碁',
    prefix: 'symmetrygo',
    desc: '中央縦軸で镜像の位置に自分の石があれば、置いた瞬間+2目の対称美ボーナス。',
    kind: 'stone',
    icon: 'symmetrygo',
    spec: [
        ...K.rb('SYMMETRYGO', '対称碁', 'symmetrygo'),
        K.params([
            { key: 'sym_pts', label: '対称ボーナス', min: 0, max: 6, def: 2, unit: '目' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { bonus: { 1: 0, 2: 0 } }; // 対称美ボーナス`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 対称美ボーナス: 着いた点の镜像位置 (中央縦軸) に自分の石があれば+2目
            {
                const p = move.cells[0];
                const mi = p.y * BOARD_SIZE + (BOARD_SIZE - 1 - p.x);
                if (mi !== p.y * BOARD_SIZE + p.x && board[mi] === player) {
                    st.bonus[player] += (P('sym_pts') ?? 2);
                    const ci = p.y * BOARD_SIZE + p.x;
                    fxGlow(ci, '#38bdf8', 700);
                    fxGlow(mi, '#38bdf8', 700);
                    fxText(ci, '対称美 +2目', '#38bdf8', 1200);
                }
            }

            turn = opponent;`],
        // 中央の対称軸を描く
        K.CUE_GRID(`            // 対称軸: 中央縦の破線
            {
                ctx.save();
                const ax = padding + ((BOARD_SIZE - 1) / 2) * cellSize;
                ctx.strokeStyle = 'rgba(56,189,248,0.5)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.setLineDash([cellSize * 0.18, cellSize * 0.14]);
                ctx.beginPath();
                ctx.moveTo(ax, padding - cellSize * 0.6);
                ctx.lineTo(ax, padding + (BOARD_SIZE - 1) * cellSize + cellSize * 0.6);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.bonus[1];
            const whiteTotal = territory.white + captures[2] + komi + st.bonus[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の対称美:</span> <strong>\${st.bonus[1]}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の対称美:</span> <strong>\${st.bonus[2]}</strong></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            対称碁: 中央縦軸で镜像の位置に自分の石があれば+2目の対称美ボーナス<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の中央を縦に走る対称軸 (水色の破線)。置いた石の镜像位置に自分の石が既にあれば+2目。',
            '軸上の石は镜像が自分自身なのでボーナス対象外。左右対称に布石を広げると点が伸びる。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 } };
        executeMove({ cells: [{ x: 2, y: 4 }] }, 1);
        assert('非対称では無加点', st.bonus[1] === 0);
        executeMove({ cells: [{ x: BOARD_SIZE - 3, y: 4 }] }, 1); // 镜像位置
        assert('镜像で+2目', st.bonus[1] === 2);
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: 6 }] }, 1); // 軸上は対象外
        assert('軸上は対象外', st.bonus[1] === 2);
        board.fill(0); st.bonus = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
