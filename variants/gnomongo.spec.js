// GNOMONGO — 圭表碁: 8手ごとに回る日影の方角へ敵石が隣接していれば+2。
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
    file: 'gnomongo.html',
    en: 'GNOMONGO',
    jp: '圭表碁',
    prefix: 'gnomongo',
    desc: '8手ごとに回る日影の方角へ敵石が隣接していれば+2。',
    kind: 'stone',
    icon: 'gnomongo',
    spec: [
        ...K.rb('GNOMONGO', '圭表碁', 'gnomongo'),
        K.params([
            { key: 'shadow_interval', label: '日影の移動間隔', min: 2, max: 30, def: 8, unit: '手' },
            { key: 'gnomon_pts', label: '日影の得点', min: 1, max: 8, def: 2, unit: '点' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        ...ST(ST_INIT, `
        // 圭表の日影: 8手ごとに影の方角が東→南→西→北と回る
        const SHADOW_DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        const SHADOW_NAMES = ['東', '南', '西', '北'];
        const shadowDir = () => SHADOW_DIRS[Math.floor(history.length / Math.max(1, P('shadow_interval') || 8)) % 4];`, ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 圭表: 着手点から影の方角に敵石があれば「影が届いた」+2
            const gIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            const gd = shadowDir();
            const gx2 = (gIdx % BOARD_SIZE) + gd[0], gy2 = ((gIdx / BOARD_SIZE) | 0) + gd[1];
            if (gx2 >= 0 && gx2 < BOARD_SIZE && gy2 >= 0 && gy2 < BOARD_SIZE
                && board[gy2 * BOARD_SIZE + gx2] === opponent) {
                st.score[player] += (P('gnomon_pts') || 2);
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 圭表: 各石の影の方角に短い日影を描く
            {
                ctx.save();
                const d = shadowDir();
                ctx.strokeStyle = 'rgba(68,64,60,0.35)';
                ctx.lineWidth = Math.max(1, cellSize * 0.08);
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 0) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.beginPath();
                    ctx.moveTo(padding + x * cellSize + d[0] * cellSize * 0.3, padding + y * cellSize + d[1] * cellSize * 0.3);
                    ctx.lineTo(padding + x * cellSize + d[0] * cellSize * 0.62, padding + y * cellSize + d[1] * cellSize * 0.62);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'日影 ' + SHADOW_NAMES[Math.floor(history.length / Math.max(1, P('shadow_interval') || 8)) % 4]`),
        [K.ONE, K.INFO_BASE, `                        圭表碁: 8手ごとに日影の方角が東→南→西→北と回る。着手点の影の方角に敵石がいれば+2点。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '8手ごとに日影の方角が回る (東→南→西→北)。',
            '着手した石の影の方角の隣に敵石があれば影が届いたとして+2。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '影の方角は手数だけで決まる。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(6,5)]=2;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('影(東)の敵に届き+2', st.score[1] === 2);
        executeMove({ cells: [{ x: 4, y: 5 }] }, 2);
        assert('白も影で+2', st.score[2] === 2);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1);
        assert('影に敵がいなければ+0', st.score[1] === 2);
    `,
};
