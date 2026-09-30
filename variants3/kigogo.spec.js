// KIGOGO — 揮毫碁: 連を6・10・14石の大きさに伸ばすたび、その石数だけ揮毫得点。
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
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false, kigo: {1: [], 2: []} }`;
module.exports = {
    file: 'kigogo.html',
    en: 'KIGOGO',
    jp: '揮毫碁',
    prefix: 'kigogo',
    desc: '連を6・10・14石の大きさに伸ばすたび、その石数だけ揮毫得点。',
    kind: 'stone',
    icon: 'kigogo',
    spec: [
        ...K.rb('KIGOGO', '揮毫碁', 'kigogo'),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 揮毫: 着手した連が節目の大きさ(6/10/14)に達するたび +連サイズ
            const kIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            st.kigo[player] = st.kigo[player] || [];
            [6, 10, 14].forEach(t => {
                if (getConnectedGroup(kIdx, player).length >= t && !st.kigo[player].includes(t)) {
                    st.kigo[player].push(t);
                    st.score[player] += t;
                }
            });

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 節目を超えた連の着手点に朱色の落款を押す
            {
                ctx.save();
                const lastIdx = lastMove && lastMove.cells ? lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x : -1;
                if (lastIdx >= 0 && board[lastIdx] !== 0 && getConnectedGroup(lastIdx, board[lastIdx]).length >= 6) {
                    const x = lastIdx % BOARD_SIZE, y = (lastIdx / BOARD_SIZE) | 0;
                    ctx.fillStyle = 'rgba(185,28,28,0.8)';
                    ctx.fillRect(padding + x * cellSize - cellSize * 0.14, padding + y * cellSize - cellSize * 0.14, cellSize * 0.28, cellSize * 0.28);
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'揮毫 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `                        揮毫碁: 自分の連が6・10・14石に達するたび、その石数だけ得点 (各節目は1回だけ)。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の連のサイズが6・10・14石の節目に達するたび、その石数が得点になる (各節目1回)。',
            '大きな連を育てるほど得るが、相手に切られると台無し。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。コミ込みの通常採点に揮毫点が加算される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(0,0)]=1; board[I(1,0)]=1; board[I(2,0)]=1; board[I(3,0)]=1; board[I(4,0)]=1;
        executeMove({ cells: [{ x: 5, y: 0 }] }, 1);
        assert('6連に達して+6', st.score[1] === 6);
        executeMove({ cells: [{ x: 6, y: 0 }] }, 2);
        assert('相手の着手では入らない', st.score[2] === 0);
        executeMove({ cells: [{ x: 0, y: 6 }] }, 1);
        assert('同じ節目は二度入らない', st.score[1] === 6);
    `,
};
