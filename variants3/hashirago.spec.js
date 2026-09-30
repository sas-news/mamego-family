// HASHIRAGO — 柱間碁: 着手から四方向に見える最も近い自石までの距離で部屋点 (合計上限+4)。
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
    file: 'hashirago.html',
    en: 'HASHIRAGO',
    jp: '柱間碁',
    prefix: 'hashirago',
    desc: '着手から四方向に見える最も近い自石までの距離で部屋点 (合計上限+4)。',
    kind: 'stone',
    icon: 'hashirago',
    spec: [
        ...K.rb('HASHIRAGO', '柱間碁', 'hashirago'),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 柱間: 四方向それぞれ、最初の自石までの距離d≧2で +min(d-1,3)
            const hIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            const hx = hIdx % BOARD_SIZE, hy = (hIdx / BOARD_SIZE) | 0;
            let hPts = 0;
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => {
                for (let s = 1; s < BOARD_SIZE; s++) {
                    const x = hx + d[0] * s, y = hy + d[1] * s;
                    if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) break;
                    const v = board[y * BOARD_SIZE + x];
                    if (v !== 0) {
                        if (v === player && s >= 2) hPts += Math.min(s - 1, 3);
                        break;
                    }
                }
            });
            st.score[player] += Math.min(hPts, 4);

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 柱間: 直線上で見える自石同士を細い梁で結ぶ
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(180,83,9,0.30)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                for (let y = 0; y < BOARD_SIZE; y++) {
                    let x = 0;
                    while (x < BOARD_SIZE) {
                        if (board[y * BOARD_SIZE + x] === 0) { x++; continue; }
                        const v = board[y * BOARD_SIZE + x];
                        let x2 = x + 1;
                        while (x2 < BOARD_SIZE && board[y * BOARD_SIZE + x2] === 0) x2++;
                        if (x2 < BOARD_SIZE && board[y * BOARD_SIZE + x2] === v && x2 - x >= 2) {
                            ctx.beginPath();
                            ctx.moveTo(padding + x * cellSize, padding + y * cellSize);
                            ctx.lineTo(padding + x2 * cellSize, padding + y * cellSize);
                            ctx.stroke();
                        }
                        x = x2;
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'柱間 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `                        柱間碁: 着手点から四方向に視線を伸ばし、最初に見える自石が距離2以上なら方向ごとに+min(距離-1,3) (合計+4まで)。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手点から上下左右を見て、最初の自石が2点以上離れていれば方向ごとに+(距離-1) (方向あたり最大+3、1手合計+4まで)。',
            '敵石や盤端が視線を遮る。広い部屋を作るほど得る。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(0,3)]=1; board[I(6,3)]=2; board[I(4,6)]=2;
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1);
        assert('遠い柱へ+3', st.score[1] === 3);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2);
        assert('白も柱間+1', st.score[2] === 1);
    `,
};
