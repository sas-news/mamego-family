// ARCHEDBEAMGO — 虹梁碁: 着手で横向き3連以上の虹梁が架かると+2。
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
    file: 'archedbeamgo.html',
    en: 'ARCHEDBEAMGO',
    jp: '虹梁碁',
    prefix: 'archedbeamgo',
    desc: '着手で横向き3連以上の虹梁が架かると+2。',
    kind: 'stone',
    icon: 'archedbeamgo',
    spec: [
        ...K.rb('ARCHEDBEAMGO', '虹梁碁', 'archedbeamgo'),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 虹梁: 着手を含む横の連が3連以上なら+2
            const aIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            const aRow = (aIdx / BOARD_SIZE) | 0;
            let aRun = 1;
            for (let x = (aIdx % BOARD_SIZE) - 1; x >= 0 && board[aRow * BOARD_SIZE + x] === player; x--) aRun++;
            for (let x = (aIdx % BOARD_SIZE) + 1; x < BOARD_SIZE && board[aRow * BOARD_SIZE + x] === player; x++) aRun++;
            if (aRun >= 3) st.score[player] += 2;

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 虹梁: 横3連以上の上に虹の弧を描く
            {
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) {
                    let x = 0;
                    while (x < BOARD_SIZE) {
                        const v = board[y * BOARD_SIZE + x];
                        if (v === 0) { x++; continue; }
                        let x2 = x;
                        while (x2 + 1 < BOARD_SIZE && board[y * BOARD_SIZE + x2 + 1] === v) x2++;
                        if (x2 - x + 1 >= 3) {
                            const cx1 = padding + x * cellSize, cx2 = padding + x2 * cellSize;
                            const cy = padding + y * cellSize;
                            ctx.strokeStyle = v === 1 ? 'rgba(254,243,199,0.75)' : 'rgba(120,53,15,0.75)';
                            ctx.lineWidth = Math.max(1.2, cellSize * 0.07);
                            ctx.beginPath();
                            ctx.moveTo(cx1, cy - cellSize * 0.28);
                            ctx.quadraticCurveTo((cx1 + cx2) / 2, cy - cellSize * 0.8, cx2, cy - cellSize * 0.28);
                            ctx.stroke();
                        }
                        x = x2 + 1;
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'虹梁 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `                        虹梁碁: 着手で横向きに3連以上が完成すると虹梁が架かり+2点。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した石が横向きに3連以上の自石を成せば「虹梁」成立で+2。',
            '長い梁は屋根を支えるように連を象徴的に強く見せる (得点のみ・呼吸は通常)。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(3,3)]=1; board[I(5,3)]=1;
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1);
        assert('横3連の虹梁+2', st.score[1] === 2);
        board.fill(0); pieces = [];
        board[I(3,3)]=1;
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1);
        assert('2連では梁にならない', st.score[1] === 2);
    `,
};
