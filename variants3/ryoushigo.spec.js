// RYOUSHIGO — 料紙碁: 2行おきに厚料紙(呼吸+1/石)と薄料紙(作字点+1)が交互に並ぶ盤。
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
    file: 'ryoushigo.html',
    en: 'RYOUSHIGO',
    jp: '料紙碁',
    prefix: 'ryoushigo',
    desc: '2行おきに厚料紙(呼吸+1/石)と薄料紙(作字点+1)が交互に並ぶ盤。',
    kind: 'stone',
    icon: 'ryoushigo',
    spec: [
        ...K.rb('RYOUSHIGO', '料紙碁', 'ryoushigo'),
        K.params([
            { key: 'thick_bonus', label: '厚料紙の追加呼吸', min: 0, max: 3, def: 1, unit: '点/石' },
            { key: 'thin_bonus', label: '薄料紙の作字点', min: 0, max: 5, def: 1, unit: '点' },
        ]),
        ...ST(ST_INIT, `
        // 料紙: 4行周期の帯。y%4<=1 が厚料紙、y%4>=2 が薄料紙
        const thickRow = (y) => (y % 4) <= 1;
        const thinRow = (y) => (y % 4) >= 2;`, ''),
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 薄料紙への筆入れは作字点+1
            if (thinRow(move.cells[0].y)) st.score[player] += (P('thin_bonus') ?? 1);`],
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        liberties += ((curr / BOARD_SIZE) | 0) % 4 <= 1 ? Math.max(0, P('thick_bonus') ?? 1) : 0; // 厚料紙は破れにくい
                    }

                    if (liberties <= 0) {`],
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                liberties += ((curr / BOARD_SIZE) | 0) % 4 <= 1 ? Math.max(0, P('thick_bonus') ?? 1) : 0; // 厚料紙は破れにくい
            }
            return liberties;`],
        K.CUE_GRID(`            // 料紙の帯: 厚料紙は暖色、薄料紙は青みの帯
            for (let y = 0; y < BOARD_SIZE; y++) {
                const py = padding + y * cellSize;
                if (thickRow(y)) {
                    ctx.fillStyle = 'rgba(217,119,6,0.10)';
                    ctx.fillRect(padding - cellSize / 2, py - cellSize / 2, cellSize * BOARD_SIZE, cellSize);
                } else {
                    ctx.fillStyle = 'rgba(59,130,246,0.08)';
                    ctx.fillRect(padding - cellSize / 2, py - cellSize / 2, cellSize * BOARD_SIZE, cellSize);
                }
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'料紙 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_BASE, `                        料紙碁: 盤は4行周期の帯。厚料紙(y%4≦1)の石は呼吸+1/石、薄料紙(y%4≧2)への着手は作字点+1。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は4行周期。y%4 が 0,1 の行は厚料紙、2,3 の行は薄料紙。',
            '厚料紙に置かれた石は所属する連の呼吸が石1つにつき+1 (破れにくい)。',
            '薄料紙への着手はその都度+1点 (繊細な紙ほど筆跡が映える)。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        assert('厚料紙と薄料紙が交互', thickRow(0) && !thickRow(2) && thinRow(3));
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[0] = 1; board[1] = 1;
        assert('厚料紙の連は呼吸+1/石', getLiberties(board, 0) === 5);
        board.fill(0);
        board[2 * BOARD_SIZE] = 1; board[2 * BOARD_SIZE + 1] = 1;
        assert('薄料紙は呼吸ボーナスなし', getLiberties(board, 2 * BOARD_SIZE) === 5);
        st = { score: { 1: 0, 2: 0 }, _end: false };
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('薄料紙への筆入れ+1', st.score[1] === 1);
    `,
};
