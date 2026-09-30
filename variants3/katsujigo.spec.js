// KATSUJIGO — 活字碁: 着手で自石の2x2ブロック(活字)が組み上がるごとに+3。
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
    file: 'katsujigo.html',
    en: 'KATSUJIGO',
    jp: '活字碁',
    prefix: 'katsujigo',
    desc: '着手で自石の2x2ブロック(活字)が組み上がるごとに+3。',
    kind: 'stone',
    icon: 'katsujigo',
    spec: [
        ...K.rb('KATSUJIGO', '活字碁', 'katsujigo'),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 活字: 着手を含む自石の2x2ブロック1つにつき+3
            const kx = move.cells[0].x, ky = move.cells[0].y;
            let kBlocks = 0;
            [[0, 0], [-1, 0], [0, -1], [-1, -1]].forEach(d => {
                const x = kx + d[0], y = ky + d[1];
                if (x < 0 || y < 0 || x + 1 >= BOARD_SIZE || y + 1 >= BOARD_SIZE) return;
                if (board[y * BOARD_SIZE + x] === player &&
                    board[y * BOARD_SIZE + x + 1] === player &&
                    board[(y + 1) * BOARD_SIZE + x] === player &&
                    board[(y + 1) * BOARD_SIZE + x + 1] === player) kBlocks++;
            });
            st.score[player] += kBlocks * 3;

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 活字: 2x2ブロックに型の罫線
            {
                ctx.save();
                for (let y = 0; y + 1 < BOARD_SIZE; y++) for (let x = 0; x + 1 < BOARD_SIZE; x++) {
                    const i = y * BOARD_SIZE + x;
                    const v = board[i];
                    if (v !== 0 && board[i + 1] === v && board[i + BOARD_SIZE] === v && board[i + BOARD_SIZE + 1] === v) {
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.strokeStyle = v === 1 ? 'rgba(254,243,199,0.7)' : 'rgba(120,53,15,0.7)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.06);
                        ctx.strokeRect(cx - cellSize * 0.42, cy - cellSize * 0.42, cellSize * 1.84, cellSize * 1.84);
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'活字 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `                        活字碁: 着手で自分の石の2x2ブロックが完成するごとに+3 (活字を組む)。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石で2x2のブロックを作ると「活字」が組めたとして+3 (着手で同時に複数できればその数だけ)。',
            '活字は堅い形。崩されると地も失う。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(0,0)]=1; board[I(1,0)]=1; board[I(0,1)]=1;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('2x2完成で+3', st.score[1] === 3);
        board.fill(0); pieces = [];
        board[I(4,4)]=1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        assert('未完成なら入らない', st.score[1] === 3);
    `,
};
