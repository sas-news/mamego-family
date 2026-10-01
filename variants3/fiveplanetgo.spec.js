// FIVEPLANETGO — 五星碁: 着手ごとに五行の型が巡る。連に3種で+3、5種全てで+8。
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
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
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false, pcnt: {1: 0, 2: 0}, ptype: {}, fusion: {1: [], 2: []} }`;
module.exports = {
    file: 'fiveplanetgo.html',
    en: 'FIVEPLANETGO',
    jp: '五星碁',
    prefix: 'fiveplanetgo',
    desc: '着手ごとに五行の型が巡る。連に3種で+3、5種全てで+8。',
    kind: 'stone',
    icon: 'fiveplanetgo',
    spec: [
        ...K.rb('FIVEPLANETGO', '五星碁', 'fiveplanetgo'),
        K.params([
            { key: 'three_pts', label: '三連の兆ボーナス', min: 0, max: 10, def: 3, unit: '目' },
            { key: 'five_pts', label: '五星会合ボーナス', min: 0, max: 20, def: 8, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT, `
        // 五星: 着手順に五行(木・火・土・金・水)の型を割り当てる
        const FP_COLORS = ['#16a34a', '#dc2626', '#a16207', '#d4d4d8', '#0ea5e9'];
        const FP_NAMES = ['木', '火', '土', '金', '水'];`, ''),
        [K.ONE, K.PIECES_PUSH, `            // 五星の型を着手石に割り当て
            st.pcnt[player]++;
            st.ptype[move.cells[0].y * BOARD_SIZE + move.cells[0].x] = (st.pcnt[player] - 1) % 5;
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });`],
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 五星会合: 着手した連に型が3種以上で+3、5種全てで+8 (各1回)
            const fpIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            const fpTypes = new Set();
            getConnectedGroup(fpIdx, player).forEach(i => {
                if (st.ptype[i] !== undefined) fpTypes.add(st.ptype[i]);
            });
            st.fusion[player] = st.fusion[player] || [];
            if (fpTypes.size >= 5 && !st.fusion[player].includes(5)) {
                st.fusion[player].push(5);
                st.score[player] += (P('five_pts') || 8);
            } else if (fpTypes.size >= 3 && !st.fusion[player].includes(3)) {
                st.fusion[player].push(3);
                st.score[player] += (P('three_pts') || 3);
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 五星: 石の右上に型の色点
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 0 || st.ptype[i] === undefined) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillStyle = FP_COLORS[st.ptype[i]];
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize + cellSize * 0.24, padding + y * cellSize - cellSize * 0.24, cellSize * 0.10, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'五星 ' + FP_NAMES[st.pcnt[1] % 5] + ' / ' + FP_NAMES[st.pcnt[2] % 5]`),
        [K.ONE, K.INFO_ALGO, `                        五星碁: 着手順に五行の型が石に割り当てられる。自分の連に型が3種揃うと+3、5種全てで+8 (各1回)。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の着手ごとに木・火・土・金・水の型が順に割り当てられる。',
            '自分の連の中に3種以上の型が揃うと三連の兆で+3、5種全てで五星会合+8 (各1回)。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1);
        assert('3種会合+3', st.score[1] === 3);
        executeMove({ cells: [{ x: 3, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1);
        assert('五星会合+8', st.score[1] === 11);
        executeMove({ cells: [{ x: 5, y: 0 }] }, 2);
        assert('白は別カウント', st.score[2] === 0 && st.pcnt[2] === 1);
    `,
};
