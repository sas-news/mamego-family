// INOUGO — 伊能碁: 「自石のある行」の連続区間が伸びるたび差分加点。全行制覇で+15。
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
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false, best: {1: 0, 2: 0}, full: {1: false, 2: false} }`;
module.exports = {
    file: 'inougo.html',
    en: 'INOUGO',
    jp: '伊能碁',
    prefix: 'inougo',
    desc: '「自石のある行」の連続区間が伸びるたび差分加点。全行制覇で+15。',
    kind: 'stone',
    icon: 'inougo',
    spec: [
        ...K.rb('INOUGO', '伊能碁', 'inougo'),
        K.params([
            { key: 'full_pts', label: '全行制覇ボーナス', min: 5, max: 30, def: 15, unit: '目' },
        ]),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 伊能図: 連続する自石のある行の最長区間が伸びれば差分加点
            const inouRows = (pl) => {
                const rows = new Set();
                for (let i = 0; i < board.length; i++) if (board[i] === pl) rows.add((i / BOARD_SIZE) | 0);
                let best = 0, cur = 0;
                for (let y = 0; y < BOARD_SIZE; y++) {
                    if (rows.has(y)) { cur++; if (cur > best) best = cur; }
                    else cur = 0;
                }
                return { best: best, count: rows.size };
            };
            const inou = inouRows(player);
            if (inou.best > st.best[player]) {
                st.score[player] += inou.best - st.best[player];
                st.best[player] = inou.best;
            }
            if (!st.full[player] && inou.count === BOARD_SIZE) {
                st.full[player] = true;
                st.score[player] += (P('full_pts') || 15);
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 伊能: 測量済みの行の左端に小さな旗
            {
                ctx.save();
                const rows = new Set();
                for (let i = 0; i < board.length; i++) if (board[i] !== 0) rows.add((i / BOARD_SIZE) | 0);
                rows.forEach(y => {
                    ctx.fillStyle = 'rgba(14,165,233,0.5)';
                    ctx.beginPath();
                    ctx.moveTo(padding - cellSize * 0.55, padding + y * cellSize - cellSize * 0.12);
                    ctx.lineTo(padding - cellSize * 0.2, padding + y * cellSize);
                    ctx.lineTo(padding - cellSize * 0.55, padding + y * cellSize + cellSize * 0.12);
                    ctx.closePath(); ctx.fill();
                });
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'伊能図 ' + st.best[1] + '行 / ' + st.best[2] + '行'`),
        [K.ONE, K.INFO_ALGO, `                        伊能碁: 「自分の石がある行」が上下に連続する最長区間を記録。更新されるたび差分加点。全行に石があれば全国完成で+15。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石が存在する行が上下に何行連続するかを計測。最長記録を更新するたび、その差分が得点。',
            '全ての行に自分の石があれば全国測量完成で+15 (1回だけ)。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(0,0)]=1; board[I(0,1)]=1;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('連続2行で+2', st.best[1] === 2 && st.score[1] === 2);
        executeMove({ cells: [{ x: 1, y: 3 }] }, 1);
        assert('切れ目では伸びない', st.best[1] === 2 && st.score[1] === 2);
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1);
        assert('行2で連結4行+2', st.best[1] === 4 && st.score[1] === 4);
    `,
};
