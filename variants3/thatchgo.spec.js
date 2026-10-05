// THATCHGO — 茅葺碁: 斜め上左右に自石がある所へ葺くと+3。
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
    file: 'thatchgo.html',
    en: 'THATCHGO',
    jp: '茅葺碁',
    prefix: 'thatchgo',
    desc: '斜め上左右に自石がある所へ葺くと+3。',
    kind: 'stone',
    icon: 'thatchgo',
    spec: [
        ...K.rb('THATCHGO', '茅葺碁', 'thatchgo'),
        K.params([
            { key: 'thatch_bonus', label: '茅葺の得点', min: 0, max: 10, def: 3, unit: '点' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.9, hint: '交点数比' },
        ]),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 茅葺: 斜め上左右が自石なら棟に茅を葺いた +3
            const tIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            const tx = tIdx % BOARD_SIZE, ty = (tIdx / BOARD_SIZE) | 0;
            if (ty > 0 && tx > 0 && tx < BOARD_SIZE - 1
                && board[tIdx - BOARD_SIZE - 1] === player && board[tIdx - BOARD_SIZE + 1] === player) {
                st.score[player] += (P('thatch_bonus') ?? 3);
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 茅葺: 棟の下に三角の屋根印
            {
                ctx.save();
                for (let i = BOARD_SIZE + 1; i < board.length - 1; i++) {
                    const v = board[i];
                    if (v === 0) continue;
                    if (board[i - BOARD_SIZE - 1] === v && board[i - BOARD_SIZE + 1] === v) {
                        const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                        ctx.fillStyle = v === 1 ? 'rgba(254,243,199,0.8)' : 'rgba(120,53,15,0.8)';
                        ctx.beginPath();
                        ctx.moveTo(padding + x * cellSize, padding + y * cellSize - cellSize * 0.34);
                        ctx.lineTo(padding + x * cellSize - cellSize * 0.2, padding + y * cellSize - cellSize * 0.12);
                        ctx.lineTo(padding + x * cellSize + cellSize * 0.2, padding + y * cellSize - cellSize * 0.12);
                        ctx.closePath(); ctx.fill();
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'茅葺 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_BASE, `                        茅葺碁: 斜め上の左右両方に自石がある点へ打つと「屋根を葺いた」+3点。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手点の斜め上左右2点が自石なら茅葺完成で+3 (両側の茅で棟を覆う形)。',
            '上方向だけを向くので下辺側の陣取りと相性がよい。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(2,1)]=1; board[I(4,1)]=1;
        executeMove({ cells: [{ x: 3, y: 2 }] }, 1);
        assert('茅を葺くと+3', st.score[1] === 3);
        board.fill(0); pieces = [];
        board[I(2,1)]=1;
        executeMove({ cells: [{ x: 3, y: 2 }] }, 1);
        assert('片方だけでは葺けない', st.score[1] === 3);
    `,
};
