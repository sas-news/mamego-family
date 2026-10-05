// SOKURYUGO — 測量碁: その行・列に初めて自石を置くと測量点+1ずつ。
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
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
    file: 'sokuryogo.html',
    en: 'SOKURYUGO',
    jp: '測量碁',
    prefix: 'sokuryogo',
    desc: 'その行・列に初めて自石を置くと測量点+1ずつ。',
    kind: 'stone',
    icon: 'sokuryogo',
    spec: [
        ...K.rb('SOKURYUGO', '測量碁', 'sokuryogo'),
        K.params([
            { key: 'survey_pts', label: '測量点 (行・列それぞれ)', min: 0, max: 5, def: 1, unit: '点' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 測量: その行・列に初めて自石が置かれると基点+1ずつ
            const sX = move.cells[0].x, sY = move.cells[0].y;
            let rowFirst = true, colFirst = true;
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (x !== sX && board[sY * BOARD_SIZE + x] === player) rowFirst = false;
            }
            for (let y = 0; y < BOARD_SIZE; y++) {
                if (y !== sY && board[y * BOARD_SIZE + sX] === player) colFirst = false;
            }
            st.score[player] += ((rowFirst ? 1 : 0) + (colFirst ? 1 : 0)) * (P('survey_pts') ?? 1);`],
        ...K.STONE_MARKS_SPEC(`            // 測量: 測量済みの行・列に薄い基線
            {
                ctx.save();
                ctx.fillStyle = 'rgba(14,165,233,0.06)';
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 0) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.48, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(14,165,233,0.25)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'測量 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_BASE, `                        測量碁: その行あるいは列に初めて自分の石を置くと測量点+1 (行と列で最大+2/手)。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の石が初めて置かれた行と列は測量済みになる。行・列それぞれ初回は+1点。',
            '全行を測るほど図面が完成に近づく。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('行も列も初測で+2', st.score[1] === 2);
        executeMove({ cells: [{ x: 5, y: 3 }] }, 2);
        assert('白は別カウント', st.score[2] === 2);
        executeMove({ cells: [{ x: 6, y: 3 }] }, 1);
        assert('同じ行は二度目なし', st.score[1] === 3);
    `,
};
