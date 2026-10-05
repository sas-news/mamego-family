// MASKGO — 覆面碁: 置いてから4手の間、石に覆面がかかり色が読めない (情報隠しルール)
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
const ST_INIT = `{ mask: {} }`;
module.exports = {
    file: 'maskgo.html',
    en: 'MASKGO',
    jp: '覆面碁',
    prefix: 'maskgo',
    desc: '置いてから4手の間、石に覆面がかかり誰の石か一目で分からない。',
    kind: 'stone',
    icon: 'maskgo',
    spec: [
        ...K.rb('MASKGO', '覆面碁', 'maskgo'),
        K.params([
            { key: 'mask_turns', label: '覆面の手数', min: 1, max: 12, def: 4, hint: '置いてから覆面が剥がれるまでの手数' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 覆面: 配置した石に覆面がかかる (4手で剥がれる)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 覆面: 新しい石は4手の間、色が判別しにくい
            st.mask[move.cells[0].y * BOARD_SIZE + move.cells[0].x] = history.length;`],
        // 4手で覆面が剥がれる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 覆面剥がし: 4手経つか石が消えれば覆面も消える
            Object.keys(st.mask || {}).forEach(k => {
                const i = +k;
                if (board[i] !== 1 && board[i] !== 2) { delete st.mask[i]; return; }
                if (history.length - st.mask[i] >= Math.max(1, P('mask_turns') || 4)) { fxGlow(i, '#facc15', 500); delete st.mask[i]; }
            });

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 覆面: 覆面中の石に「?」の仮面を被せる
            {
                ctx.save();
                Object.keys(st.mask || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = 'rgba(120,113,108,0.55)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fef3c7';
                    ctx.font = \`bold \${Math.max(9, cellSize * 0.4)}px sans-serif\`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('?', cx, cy + cellSize * 0.02);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'覆面 ' + Object.keys(st.mask || {}).length`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            覆面碁: 置いてから4手の間、石に覆面がかかり誰の石か分からない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '新しく置かれた石には4手の間「覆面」がかかり、見た目では色が分からない。',
            '呼吸や取りの判定は内部では通常通り。最新の攻防が読みにくくなる。',
            '4手経つと覆面が剥がれる。直前の着手を記憶しておく記憶力の碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.mask = {};
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('覆面がかかる', st.mask[5 * BOARD_SIZE + 5] !== undefined);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('相手の石にも覆面', st.mask[0] !== undefined);
        history.length = st.mask[5 * BOARD_SIZE + 5] + 4;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('4手で覆面が剥がれる', st.mask[5 * BOARD_SIZE + 5] === undefined);
        assert('起動して通常着手可', isValidPlacement([{ x: 2, y: 0 }], 1) === true);
    `,
};
