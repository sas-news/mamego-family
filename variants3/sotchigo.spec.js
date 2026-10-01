// SOTCHIGO — 装丁碁: 着手の隣に四方を自石で囲まれた空点(綴じ目)ができると+3。
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
    file: 'sotchigo.html',
    en: 'SOTCHIGO',
    jp: '装丁碁',
    prefix: 'sotchigo',
    desc: '着手の隣に四方を自石で囲まれた空点(綴じ目)ができると+3。',
    kind: 'stone',
    icon: 'sotchigo',
    spec: [
        ...K.rb('SOTCHIGO', '装丁碁', 'sotchigo'),
        K.params([
            { key: 'sotchi_pts', label: '綴じ目の得点', min: 0, max: 9, def: 3, unit: '点' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 綴じ目: 着手点の隣に「四方が自石の空点」があれば装丁+3
            const soIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            getNeighbors(soIdx).forEach(nb => {
                if (board[nb] === 0 && getNeighbors(nb).every(n => board[n] === player)) {
                    st.score[player] += (P('sotchi_pts') ?? 3);
                }
            });

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 綴じ目: 四方を囲まれた空点に小さな環の印
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 0) continue;
                    const ns = getNeighbors(i);
                    if (ns.length >= 2 && ns.every(n => board[n] === board[ns[0]] && board[n] !== 0)) {
                        const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                        ctx.strokeStyle = board[ns[0]] === 1 ? 'rgba(28,25,23,0.5)' : 'rgba(120,53,15,0.5)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.14, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'装丁 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `                        装丁碁: 着手した石の隣に「四方を自分の石で囲まれた空点」ができると綴じ目完成で+3。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分が打った石の上下左右の隣に、四方すべて自石の空点ができれば綴じ目完成で+3。',
            '綴じ目は眼と同じ形。本を綴じるように空点を囲む。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。複数の綴じ目が同時にできればその数だけ入る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(0,1)]=1; board[I(1,0)]=1; board[I(2,1)]=1;
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1);
        assert('綴じ目完成で+3', st.score[1] === 3);
        board.fill(0); pieces = [];
        board[I(5,5)]=1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('囲めなければ入らない', st.score[1] === 3);
    `,
};
