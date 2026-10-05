// RINSHOGO — 臨書碁: 天元の周囲8点が古典の手本。臨書(着手)で写すと得点。
const K = require('../gen_kit.js');
const ST = (init, extraDecl, extraReset) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = ${init};${extraDecl || ''}`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = ${init};${extraReset || ''}`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const SCORE_END = [
    [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._end) {
                st._end = true;
                captures[1] += st.score[1] || 0;
                captures[2] += st.score[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
];
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false, rin: {1: 0, 2: 0} }`;
module.exports = {
    file: 'rinshogo.html',
    en: 'RINSHOGO',
    jp: '臨書碁',
    prefix: 'rinshogo',
    desc: '天元の周囲8点が古典の手本。臨書(着手)で写すと得点。',
    kind: 'stone',
    icon: 'rinshogo',
    spec: [
        ...K.rb('RINSHOGO', '臨書碁', 'rinshogo'),
        K.params([
            { key: 'rin_point', label: '手本1点の得点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'rin_goal', label: '完成に必要な臨書数', min: 2, max: 8, def: 4, unit: '点' },
            { key: 'rin_bonus', label: '完成ボーナス', min: 0, max: 16, def: 4, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT, `
        // 臨書の手本: 天元を囲む8点 (対称配置)
        const MODEL = new Set();
        const rebuildModel = () => {
            MODEL.clear();
            const c = (BOARD_SIZE - 1) / 2;
            [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]].forEach(p => {
                const x = c + p[0], y = c + p[1];
                if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) MODEL.add(y * BOARD_SIZE + x);
            });
        };`, `
            rebuildModel();`),
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            const rIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            if (MODEL.has(rIdx)) {
                st.rin[player]++;
                st.score[player] += (P('rin_point') ?? 1);
            }`],
        K.CUE_GRID(`            // 手本: 天元を囲む8点を淡い円で示す
            MODEL.forEach(i => {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                ctx.strokeStyle = 'rgba(120,113,108,0.55)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.30, 0, Math.PI * 2);
                ctx.stroke();
            });`),
        ...GAME_OVER,
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._end) {
                st._end = true;
                // 手本を規定点以上写せば臨書完成でボーナス
                if (st.rin[1] >= Math.max(1, P('rin_goal') || 4)) st.score[1] += (P('rin_bonus') ?? 4);
                if (st.rin[2] >= Math.max(1, P('rin_goal') || 4)) st.score[2] += (P('rin_bonus') ?? 4);
                captures[1] += st.score[1] || 0;
                captures[2] += st.score[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'臨書 ' + st.rin[1] + ' / ' + st.rin[2]`),
        [K.ONE, K.INFO_BASE, `                        臨書碁: 天元を囲む8点が古典の手本。手本点への着手で+1点。4点以上写すと終局時に+4点。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '天元を囲む8点が「手本」。手本点に置くたび臨書点+1。',
            '局終了時、臨書点が4以上なら完成報酬+4点。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '手本は8点しかないので両者の取り合いになる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = (BOARD_SIZE - 1) / 2;
        assert('手本は8点', MODEL.size === 8 && MODEL.has(I(c + 2, c + 1)));
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        executeMove({ cells: [{ x: c + 2, y: c + 1 }] }, 1);
        assert('臨書で+1', st.rin[1] === 1 && st.score[1] === 1);
        st.rin[1] = 4; st.score[1] = 0; captures[1] = 0;
        endGameByScore();
        assert('4点以上で完成+4', gameOver && st.score[1] === 4);
    `,
};
