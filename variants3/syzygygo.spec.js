// SYZYGYGO — 交食碁: 15の倍数手は交食。その手で取った石は1つにつき+1点。
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
    file: 'syzygygo.html',
    en: 'SYZYGYGO',
    jp: '交食碁',
    prefix: 'syzygygo',
    desc: '15の倍数手は交食。その手で取った石は1つにつき+1点。',
    kind: 'stone',
    icon: 'syzygygo',
    spec: [
        ...K.rb('SYZYGYGO', '交食碁', 'syzygygo'),
        K.params([
            { key: 'eclipse_interval', label: '交食の間隔', min: 5, max: 40, def: 15, unit: '手' },
        ]),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `                captures[player] += captured.length;`, `                captures[player] += captured.length;
                // 交食: 15の倍数手の取りは石1つにつき追加+1
                if (history.length > 0 && history.length % (P('eclipse_interval') || 15) === 0) {
                    st.score[player] += captured.length;
                }`],
        K.CUE_GRID(`            // 交食: 15の倍数手では盤が薄暗くなる
            if (history.length > 0 && history.length % (P('eclipse_interval') || 15) === 0) {
                ctx.fillStyle = 'rgba(15,23,42,0.22)';
                ctx.fillRect(padding - cellSize / 2, padding - cellSize / 2, cellSize * BOARD_SIZE, cellSize * BOARD_SIZE);
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'交食まで ' + ((P('eclipse_interval') || 15) - (history.length % (P('eclipse_interval') || 15))) + '手'`),
        [K.ONE, K.INFO_ALGO, `                        交食碁: 15の倍数の手は交食。その着手で取った石は通常のアゲハマに加えて1つにつき+1点。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '15・30・45…と15の倍数の手は「交食」。その手の取りは1石につき追加+1点。',
            '交食の手に合わせて相手の連を仕留めると大きい。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '交食の訪れは手数だけで決まる。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(5,5)]=2;
        board[I(4,5)]=1; board[I(6,5)]=1; board[I(5,4)]=1;
        for (let i = 0; i < 14; i++) history.push({ board: [...board] });
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('交食手の取りは倍加', captures[1] === 1 && st.score[1] === 1);
        board.fill(0); pieces = [];
        board[I(5,5)]=2; board[I(4,5)]=1; board[I(6,5)]=1; board[I(5,4)]=1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('通常手は追加なし', captures[1] === 2 && st.score[1] === 1);
    `,
};
