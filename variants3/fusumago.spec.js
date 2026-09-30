// FUSUMAGO — 襖張碁: 自分の連が盤の左右両端に達すると襖完成で+10 (1回だけ)。
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
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false, fusuma: {1: false, 2: false} }`;
module.exports = {
    file: 'fusumago.html',
    en: 'FUSUMAGO',
    jp: '襖張碁',
    prefix: 'fusumago',
    desc: '自分の連が盤の左右両端に達すると襖完成で+10 (1回だけ)。',
    kind: 'stone',
    icon: 'fusumago',
    spec: [
        ...K.rb('FUSUMAGO', '襖張碁', 'fusumago'),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 襖: 着手した連が左右両辺に達していれば+10 (1回のみ)
            const fIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            if (!st.fusuma[player]) {
                let tL = false, tR = false;
                getConnectedGroup(fIdx, player).forEach(i => {
                    const x = i % BOARD_SIZE;
                    if (x === 0) tL = true;
                    if (x === BOARD_SIZE - 1) tR = true;
                });
                if (tL && tR) {
                    st.fusuma[player] = true;
                    st.score[player] += 10;
                }
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 襖: 両辺に達した連に引き手の印
            {
                ctx.save();
                [1, 2].forEach(pl => {
                    if (!st.fusuma[pl]) return;
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] !== pl) continue;
                        const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                        if (x !== 0 && x !== BOARD_SIZE - 1) continue;
                        ctx.fillStyle = pl === 1 ? 'rgba(254,243,199,0.85)' : 'rgba(120,53,15,0.85)';
                        ctx.beginPath();
                        ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.1, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'襖 黒' + (st.fusuma[1] ? '張済' : '未') + ' / 白' + (st.fusuma[2] ? '張済' : '未')`),
        [K.ONE, K.INFO_ALGO, `                        襖張碁: 自分の連が盤の左辺と右辺の両方に達すると「襖が張れた」として+10点 (各局1回)。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の連が左右両辺につながれば襖完成で+10 (両者とも1回だけ)。',
            '横断は長い道のり。切られないよう守りながら伸ばす。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        for (let x = 0; x < BOARD_SIZE - 1; x++) board[I(x, 4)] = 1;
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: 4 }] }, 1);
        assert('左右を結ぶと襖+10', st.fusuma[1] === true && st.score[1] === 10);
        executeMove({ cells: [{ x: 0, y: 6 }] }, 2);
        assert('白は未達成', st.fusuma[2] === false);
        assert('二度目は入らない', st.score[1] === 10);
    `,
};
