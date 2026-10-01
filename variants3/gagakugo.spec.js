// GAGAKUGO — 雅楽碁: 笙(天)・篳篥(地)・箏(人)の三種の石。三種編成が揃うと雅楽が奏でられ得点
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
const ST_INIT = `{ inst: [], pcnt: { 1: 0, 2: 0 } }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'gagakugo.html',
    en: 'GAGAKUGO',
    jp: '雅楽碁',
    prefix: 'gagakugo',
    desc: '石は笙・篳篥・箏の三種を順に担う。自連に三種揃うと雅楽が奏でられ+2目。',
    kind: 'stone',
    icon: 'gagakugo',
    spec: [
        ...K.rb('GAGAKUGO', '雅楽碁', 'gagakugo'),
        K.params([
            { key: 'gagaku_pts', label: '雅楽の得点', min: 1, max: 8, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        ...ST(ST_INIT),
        // 三種編成: 自分の着手数%3 で 笙(0)・篳篥(1)・箏(2) を担う。自連に三種揃うと +2目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 雅楽: 着手石は自分の手数に応じて 笙→篳篥→箏 の楽器を担う。自連に三種揃うと奏でられ+2目
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.pcnt[player]++;
                st.inst[mi] = (st.pcnt[player] - 1) % 3; // 0=笙 1=篳篥 2=箏
                if (board[mi] === player) {
                    const g = getConnectedGroup(mi, player);
                    const kinds = new Set(g.map(j => st.inst[j]).filter(v => v !== undefined));
                    if (kinds.size >= 3) {
                        captures[player] += (P('gagaku_pts') || 2);
                        g.forEach(j => fxGlow(j, '#fcd34d', 700));
                        fxText(mi, '雅楽 +' + (P('gagaku_pts') || 2), '#fbbf24', 1300);
                    }
                }
            }

            turn = opponent;`],
        // 石が取られたら楽器マークも消す
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; delete st.inst[idx]; });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 石に楽器印: 笙・篳篥・箏
        ...K.STONE_MARKS_SPEC(`            Object.keys(st.inst).forEach(k => {
                const i = +k;
                if (board[i] === 0 || st.inst[i] === undefined) return;
                const mark = ['笙', '篳', '箏'][st.inst[i]];
                ctx.fillStyle = board[i] === 1 ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';
                ctx.font = (cellSize * 0.32) + 'px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(mark, i % BOARD_SIZE * cellSize + padding, Math.floor(i / BOARD_SIZE) * cellSize + padding);
            });`),
        ...K.EVENT_CHIP_SPEC(`'次の楽器: ' + ['笙','篳篥','箏'][st.pcnt[turn] % 3]`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            雅楽碁: 石は自分の手数ごとに笙・篳篥・箏を担う。自分の連に三種揃うと雅楽が奏でられ+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した石は自分の手数に応じて笙・篳篥・箏の楽器を担う (三種が順繰りに巡る)。',
            '自分の連に三種が揃うと雅楽が奏でられ+2目。連を編成する編曲の碁。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.inst = [];
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 1手目 → 笙
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 2手目 → 篳篥
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1); // 3手目 → 箏 → 三種揃い
        assert('三種揃いで雅楽+2', captures[1] === 2);
        assert('楽器が記録される', st.inst[4 * BOARD_SIZE + 4] === 0 && st.inst[4 * BOARD_SIZE + 5] === 1 && st.inst[4 * BOARD_SIZE + 6] === 2);
        captures = { 1: 0, 2: 0 }; board.fill(0); st.inst = []; history.length = 0;
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 2, y: 5 }] }, 1); // 離れた連 — 三種不揃い
        assert('連が違えば奏でられない', captures[1] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 2) === true);
    `,
};
