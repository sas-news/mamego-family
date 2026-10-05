// TOKYOGO — 組物碁: 自石に上下を挟まれた石は斗栱。組むと+2、その連は呼吸+1。
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
    file: 'tokyogo.html',
    en: 'TOKYOGO',
    jp: '組物碁',
    prefix: 'tokyogo',
    desc: '自石に上下を挟まれた石は斗栱。組むと+2、その連は呼吸+1。',
    kind: 'stone',
    icon: 'tokyogo',
    spec: [
        ...K.rb('TOKYOGO', '組物碁', 'tokyogo'),
        K.params([
            { key: 'score', label: '斗栱の得点', min: 0, max: 8, def: 2, unit: '点' },
            { key: 'tokyo_liberty', label: '斗栱の追加呼吸', min: 0, max: 4, def: 1 },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.9, hint: '交点数比' },
        ]),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 斗栱: 着手した石の上下が自石なら斗栱成立 +2
            const toIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            if (toIdx >= BOARD_SIZE && toIdx < BOARD_SIZE * (BOARD_SIZE - 1)
                && board[toIdx - BOARD_SIZE] === player && board[toIdx + BOARD_SIZE] === player) {
                st.score[player] += (P('score') ?? 2);
            }

            turn = opponent;`],
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        liberties += (curr >= BOARD_SIZE && curr < BOARD_SIZE * (BOARD_SIZE - 1) && boardState[curr - BOARD_SIZE] === player && boardState[curr + BOARD_SIZE] === player) ? (P('tokyo_liberty') ?? 1) : 0; // 斗栱が連を支える
                    }

                    if (liberties <= 0) {`],
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                liberties += (curr >= BOARD_SIZE && curr < BOARD_SIZE * (BOARD_SIZE - 1) && boardState[curr - BOARD_SIZE] === player && boardState[curr + BOARD_SIZE] === player) ? (P('tokyo_liberty') ?? 1) : 0; // 斗栱が連を支える
            }
            return liberties;`],
        ...K.STONE_MARKS_SPEC(`            // 斗栱: 上下に自石を持つ石に受け材の印
            {
                ctx.save();
                for (let i = BOARD_SIZE; i < BOARD_SIZE * (BOARD_SIZE - 1); i++) {
                    const v = board[i];
                    if (v !== 0 && board[i - BOARD_SIZE] === v && board[i + BOARD_SIZE] === v) {
                        const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                        ctx.fillStyle = v === 1 ? 'rgba(254,243,199,0.85)' : 'rgba(120,53,15,0.85)';
                        ctx.fillRect(padding + x * cellSize - cellSize * 0.26, padding + y * cellSize - cellSize * 0.08, cellSize * 0.52, cellSize * 0.16);
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'斗栱 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_BASE, `                        組物碁: 自分の石が上下を同じ自分の石に挟まれた形は「斗栱」。組むと+2点、斗栱を含む連は呼吸+1。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '上下を自石で挟まれた石は斗栱(組物)。斗栱を組んだ着手で+2点。',
            '斗栱を含む連は呼吸が+1 (支えられて抜けにくい)。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(3,0)]=1; board[I(3,2)]=1;
        executeMove({ cells: [{ x: 3, y: 1 }] }, 1);
        assert('斗栱を組むと+2', st.score[1] === 2);
        assert('斗栱の連は呼吸+1', getLiberties(board, I(3,1)) === 8);
        board.fill(0); pieces = [];
        board[I(5,5)]=1; board[I(6,5)]=1; board[I(7,5)]=1;
        assert('横に挟んだだけでは斗栱にならない', getLiberties(board, I(6,5)) === 8);
    `,
};
