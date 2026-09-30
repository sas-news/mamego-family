// LODESTONEGO — 磁針碁: 天元に近いほど指針点が高い (天元+4・隣+2・子午線上+1)。
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
    file: 'lodestonego.html',
    en: 'LODESTONEGO',
    jp: '磁針碁',
    prefix: 'lodestonego',
    desc: '天元に近いほど指針点が高い (天元+4・隣+2・子午線上+1)。',
    kind: 'stone',
    icon: 'lodestonego',
    spec: [
        ...K.rb('LODESTONEGO', '磁針碁', 'lodestonego'),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 磁針: 天元に近いほど指針点が高い
            const lX = move.cells[0].x, lY = move.cells[0].y;
            const lc = (BOARD_SIZE - 1) / 2;
            if (lX === lc && lY === lc) st.score[player] += 4;
            else if (Math.abs(lX - lc) + Math.abs(lY - lc) === 1) st.score[player] += 2;
            else if (lX === lc || lY === lc) st.score[player] += 1;`],
        K.CUE_GRID(`            // 子午線: 中央の縦横を淡く照らす
            {
                const c_ = (BOARD_SIZE - 1) / 2;
                ctx.fillStyle = 'rgba(220,38,38,0.07)';
                ctx.fillRect(padding + c_ * cellSize - cellSize / 2, padding - cellSize / 2, cellSize, cellSize * BOARD_SIZE);
                ctx.fillRect(padding - cellSize / 2, padding + c_ * cellSize - cellSize / 2, cellSize * BOARD_SIZE, cellSize);
            }`),
        ...K.STONE_MARKS_SPEC(`            // 磁針: 天元の石に北を指す針
            {
                ctx.save();
                const c_ = (BOARD_SIZE - 1) / 2;
                const ci = c_ * BOARD_SIZE + c_;
                if (board[ci] !== 0) {
                    const cx = padding + c_ * cellSize, cy = padding + c_ * cellSize;
                    ctx.fillStyle = 'rgba(220,38,38,0.9)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.36);
                    ctx.lineTo(cx - cellSize * 0.09, cy - cellSize * 0.08);
                    ctx.lineTo(cx + cellSize * 0.09, cy - cellSize * 0.08);
                    ctx.closePath(); ctx.fill();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'磁針 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `                        磁針碁: 盤中央は磁北。天元へ置くと+4、天元の四隣は+2、中央行・列のその他の点は+1。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '天元への着手+4、天元の四隣+2、中央の行・列のその他の点+1 (重複はしない)。',
            '中央を制するほど指針点が溜まる。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = (BOARD_SIZE - 1) / 2;
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('天元+4', st.score[1] === 4);
        executeMove({ cells: [{ x: c + 1, y: c }] }, 2);
        assert('天元隣+2', st.score[2] === 2);
        executeMove({ cells: [{ x: 0, y: c }] }, 1);
        assert('子午線上+1', st.score[1] === 5);
    `,
};
