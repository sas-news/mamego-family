// TAKUHONGO — 拓本碁: 5石以上の敵連を取ると拓本(碑文点=石数)が得られる。
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
    file: 'takuhongo.html',
    en: 'TAKUHONGO',
    jp: '拓本碁',
    prefix: 'takuhongo',
    desc: '5石以上の敵連を取ると拓本(碑文点=石数)が得られる。',
    kind: 'stone',
    icon: 'takuhongo',
    spec: [
        ...K.rb('TAKUHONGO', '拓本碁', 'takuhongo'),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `                captured.forEach(idx => board[idx] = 0);`, `                // 拓本: 取った連が5石以上なら碑文点 = 取った石数
                if (captured.length >= 5) {
                    st.score[player] += captured.length;
                }
                captured.forEach(idx => board[idx] = 0);`],
        ...K.STONE_MARKS_SPEC(`            // 碑影: 取られそうな大きな連に薄い碑の輪郭
            {
                ctx.save();
                pieces.forEach(pc => {
                    if (!pc.cells || !pc.cells.length) return;
                    const idx = pc.cells[0].y * BOARD_SIZE + pc.cells[0].x;
                    if (board[idx] === 0) return;
                    if (getConnectedGroup(idx, board[idx]).length >= 5) {
                        const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                        ctx.strokeStyle = 'rgba(120,113,108,0.5)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.05);
                        ctx.strokeRect(padding + x * cellSize - cellSize * 0.3, padding + y * cellSize - cellSize * 0.42, cellSize * 0.6, cellSize * 0.72);
                    }
                });
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'拓本 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `                        拓本碁: 5石以上の敵連を取ると「碑を拓した」として取った石数だけ得点。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '5石以上の敵連を一度に取ると、取った石数だけ拓本点が入る。',
            '大きな連は育てるほど取られたときの被害も大きい。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。拓本点はアゲハマに加算される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(1,1)]=2; board[I(2,1)]=2; board[I(3,1)]=2; board[I(4,1)]=2; board[I(5,1)]=2;
        board[I(0,1)]=1; board[I(6,1)]=1;
        board[I(1,0)]=1; board[I(2,0)]=1; board[I(3,0)]=1; board[I(4,0)]=1; board[I(5,0)]=1;
        board[I(1,2)]=1; board[I(2,2)]=1; board[I(3,2)]=1; board[I(4,2)]=1;
        executeMove({ cells: [{ x: 5, y: 2 }] }, 1);
        assert('5石の碑を拓すと+5', captures[1] === 5 && st.score[1] === 5);
        board.fill(0);
        board[I(3,3)]=2; board[I(4,3)]=1; board[I(2,3)]=1; board[I(3,2)]=1;
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1);
        assert('4石以下では拓せない', st.score[1] === 5 && captures[1] === 6);
    `,
};
