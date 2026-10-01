// TSUGITEGO — 継手碁: 着手が離れた自連を2つ以上継ぐと継手報酬(継いだ数-1)x2。
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
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false }`;
module.exports = {
    file: 'tsugitego.html',
    en: 'TSUGITEGO',
    jp: '継手碁',
    prefix: 'tsugitego',
    desc: '着手が離れた自連を2つ以上継ぐと継手報酬(継いだ数-1)x2。',
    kind: 'stone',
    icon: 'tsugitego',
    spec: [
        ...K.rb('TSUGITEGO', '継手碁', 'tsugitego'),
        K.params([
            { key: 'joint_min', label: '継手に必要な連の数', min: 2, max: 4, def: 2 },
            { key: 'joint_bonus', label: '継手報酬 (係数)', min: 1, max: 6, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`, `            // 継手: 着手前に隣接する別々の自連の数を数える
            const tIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            const tReps = new Set();
            getNeighbors(tIdx).forEach(nb => {
                if (board[nb] === player) {
                    tReps.add(Math.min.apply(null, getConnectedGroup(nb, player)));
                }
            });
            if (tReps.size >= (P('joint_min') || 2)) st.score[player] += (tReps.size - 1) * (P('joint_bonus') || 2);
            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`],
        ...K.STONE_MARKS_SPEC(`            // 継手: 最後の着手が複数連を継いだら継ぎ目に楔の印
            {
                ctx.save();
                if (lastMove && lastMove.cells && lastMove.cells.length) {
                    const li = lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x;
                    const pl = board[li];
                    if (pl !== 0) {
                        const reps = new Set();
                        getNeighbors(li).forEach(nb => {
                            if (board[nb] === pl) reps.add(Math.min.apply(null, getConnectedGroup(nb, pl)));
                        });
                        if (reps.size >= 1) {
                            const ns = getNeighbors(li).filter(n => board[n] === pl);
                            if (ns.length >= 2) {
                                const x = li % BOARD_SIZE, y = (li / BOARD_SIZE) | 0;
                                ctx.strokeStyle = pl === 1 ? 'rgba(254,243,199,0.8)' : 'rgba(120,53,15,0.8)';
                                ctx.lineWidth = Math.max(1, cellSize * 0.06);
                                ctx.beginPath();
                                ctx.moveTo(padding + x * cellSize - cellSize * 0.2, padding + y * cellSize - cellSize * 0.2);
                                ctx.lineTo(padding + x * cellSize + cellSize * 0.2, padding + y * cellSize + cellSize * 0.2);
                                ctx.stroke();
                            }
                        }
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'継手 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `                        継手碁: 着手が離れていた自分の連を2つ以上つなぐと (つないだ数-1)x2 点の継手報酬。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した石の上下左右に、それまで離れていた自連が2つ以上あれば継手成立: (連の数-1)x2点。',
            'つなぐほど得るが、継ぎ目は急所にもなる。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(1,0)]=1; board[I(0,1)]=1;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('2連を継ぐと+2', st.score[1] === 2);
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('孤立着手は継がない', st.score[1] === 2);
    `,
};
