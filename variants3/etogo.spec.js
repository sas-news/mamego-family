// ETOGO — 干支碁: 置いた石に干支の印が12周期で回り、終局時に干支の種類ごと+2点
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
const ST_INIT = `{ ply: 0, marks: {} }`;
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
    file: 'etogo.html',
    en: 'ETOGO',
    jp: '干支碁',
    prefix: 'etogo',
    desc: '置いた石に干支の印が12手周期で回る。終局時、盤上の干支の種類ごと+2点。',
    kind: 'stone',
    icon: 'etogo',
    spec: [
        ...K.rb('ETOGO', '干支碁', 'etogo'),
        K.params([
            { key: 'zodiac_pts', label: '干支1種類ごとの得点', min: 0, max: 8, def: 2, unit: '点' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 干支ヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 干支: 子丑寅卯辰巳午未申酉戌亥
        const ETO_ZODIAC = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        function etoScore(pl) {
            const kinds = new Set();
            for (const k in st.marks) {
                const i = +k;
                if (board[i] === pl) kinds.add(st.marks[i]);
            }
            return kinds.size * (P('zodiac_pts') || 2);
        }

        function endGameByScore() {`],
        // 採点に干支点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + etoScore(1);
            const whiteTotal = territory.white + captures[2] + komi + etoScore(2);`],
        // 干支: 着手ごとに12周期の干支印が付く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 干支: 着手した石に12手周期の干支印が付く
            st.ply++;
            {
                const cell = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.marks[cell] = st.ply % 12;
                if (st.ply % 12 === 0) {
                    fxGlow(cell, '#fbbf24', 900);
                    fxText(cell, '亥・一巡', '#fbbf24', 1200);
                }
            }

            turn = opponent;`],
        // 干支印を小さく石の下に描く
        ...K.STONE_MARKS_SPEC(`            // 干支: 印の付いた石の下に干支を小さく
            {
                ctx.save();
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.max(7, cellSize * 0.24) + 'px sans-serif';
                for (const k in st.marks) {
                    const i = +k;
                    const pl = board[i];
                    if (pl !== 1 && pl !== 2) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = pl === 1 ? 'rgba(253,224,71,0.85)' : 'rgba(190,24,93,0.8)';
                    ctx.fillText(ETO_ZODIAC[st.marks[i]], cx, cy + cellSize * 0.42);
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'干支: ' + ETO_ZODIAC[st.ply % 12]`),
        [K.ONE, K.INFO_BASE, `            干支碁: 置いた石に干支の印が12手周期で回る。終局時、干支の種類ごと+2点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石を置くたび、その石に子→丑→…→亥と12手周期の干支印が付く。',
            '終局時、盤上に残った自分の石の干支の種類数ごとに+2点 (最大24点)。',
            '取られた石の干支は得点にならない。印は双方同じ周期で回る。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        st.ply = 0; st.marks = {};
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('初期は干支0種', etoScore(1) === 0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // ply1 → 丑
        assert('着手で干支印', st.marks[0] === 1 && etoScore(1) === 2);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1); // ply2 → 寅
        assert('別干支で種類増', etoScore(1) === 4);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2); // ply3
        assert('白も同条件', st.marks[5 * B + 5] === 3 && etoScore(2) === 2);
    `,
};
