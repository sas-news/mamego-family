// BOUNDARYGO — 境界碁: 着手点の隣の敵石1つにつき境界杭+1 (最大+3)。
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
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
    file: 'boundarygo.html',
    en: 'BOUNDARYGO',
    jp: '境界碁',
    prefix: 'boundarygo',
    desc: '着手点の隣の敵石1つにつき境界杭+1 (最大+3)。',
    kind: 'stone',
    icon: 'boundarygo',
    spec: [
        ...K.rb('BOUNDARYGO', '境界碁', 'boundarygo'),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 境界杭: 着手点の隣にある敵石1つにつき+1 (最大+3)
            const bIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            let bN = 0;
            getNeighbors(bIdx).forEach(nb => { if (board[nb] === opponent) bN++; });
            st.score[player] += Math.min(bN, 3);

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 境界杭: 敵に隣接する最後の着手に杭の印
            {
                ctx.save();
                if (lastMove && lastMove.cells && lastMove.cells.length) {
                    const li = lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x;
                    const pl = board[li];
                    if (pl !== 0 && getNeighbors(li).some(n => board[n] !== 0 && board[n] !== pl)) {
                        const x = li % BOARD_SIZE, y = (li / BOARD_SIZE) | 0;
                        ctx.strokeStyle = pl === 1 ? 'rgba(254,243,199,0.9)' : 'rgba(120,53,15,0.9)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.07);
                        ctx.beginPath();
                        ctx.moveTo(padding + x * cellSize, padding + y * cellSize + cellSize * 0.3);
                        ctx.lineTo(padding + x * cellSize, padding + y * cellSize - cellSize * 0.3);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'境界 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `                        境界碁: 着手した石に隣接する敵石1つにつき+1点 (1手+3まで)。敵との境を進めるほど得る。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手点の上下左右に敵石があると1つにつき+1 (最大+3/手)。',
            '敵に近づくほど得るが、取られれば地も失う。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(6,5)]=2; board[I(4,5)]=2;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('敵2つに接して+2', st.score[1] === 2);
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('敵がいなければ+0', st.score[1] === 2);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('白も+0', st.score[2] === 0);
    `,
};
