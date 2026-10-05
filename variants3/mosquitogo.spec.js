// MOSQUITOGO — 吸血碁: 置いた蚊(石)は隣の敵石から血(+1目)を吸う。同じ敵石からは一度だけ
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
            if (!capFired && history.length >= Math.max(1, P('cap') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'mosquitogo.html',
    en: 'MOSQUITOGO',
    jp: '吸血碁',
    prefix: 'mosquitogo',
    desc: '置いた蚊(石)は隣の敵石から血(+1目)を吸う。吸われた敵石は憔悴する。',
    kind: 'stone',
    icon: 'mosquitogo',
    spec: [
        ...K.rb('MOSQUITOGO', '吸血碁', 'mosquitogo'),
        K.params([
            { key: 'bite_pts', label: '吸血1箇所の得点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap', label: '打ち切り手数', min: 60, max: 400, def: 150, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { bonus: { 1: 0, 2: 0 }, bitten: {} }; // 吸った目・吸血済みの敵石`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { bonus: { 1: 0, 2: 0 }, bitten: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { bonus: { 1: 0, 2: 0 }, bitten: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { bonus: { 1: 0, 2: 0 }, bitten: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { bonus: { 1: 0, 2: 0 }, bitten: {} };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 吸血: 置いた蚊が隣の敵石から血を吸う (敵石1つにつき一度だけ +1目)
            {
                const li = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                let sucked = 0;
                getNeighbors(li).forEach(n => {
                    if (board[n] === opponent && !st.bitten[n]) {
                        st.bitten[n] = true;
                        sucked++;
                        fxSplash(n, '#ef4444', 7);
                    }
                });
                if (sucked) {
                    st.bonus[player] += sucked * (P('bite_pts') ?? 1);
                    fxText(li, '吸血 +' + sucked + '目', '#ef4444', 1100);
                }
            }

            turn = opponent;`],
        // 吸われた石に赤い咬み跡
        ...K.STONE_MARKS_SPEC(`            // 吸血済みの咬み跡
            {
                ctx.save();
                ctx.fillStyle = '#ef4444';
                Object.keys(st.bitten || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx + cellSize * 0.14, cy - cellSize * 0.14, cellSize * 0.07, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.bonus[1];
            const whiteTotal = territory.white + captures[2] + komi + st.bonus[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の吸血:</span> <strong>\${st.bonus[1]}目</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の吸血:</span> <strong>\${st.bonus[2]}目</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'吸血 +' + st.bonus[turn] + '目'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            吸血碁: 蚊(石)は隣の敵石から血(+1目)を吸う<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '置いた蚊は隣接する敵石から血を吸う — 敵石1つにつき一度だけ +1目。',
            '吸われた石には赤い咬み跡が残る。敵の大きな連のそばに何度も蚊を止めて稼げ。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, bitten: {} };
        board[I(4, 4)] = 2; board[I(4, 2)] = 2; // 敵石2つ
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1); // 両方に隣接
        assert('敵石2つから吸血', st.bonus[1] === 2);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 2); // 白の蚊は黒石 (4,3) に隣接
        assert('白も吸血できる', st.bonus[2] === 1);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 吸血済み (4,4) にのみ隣接
        assert('同じ敵石からは一度だけ', st.bonus[1] === 2);
        board.fill(0); st = { bonus: { 1: 0, 2: 0 }, bitten: {} };
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
