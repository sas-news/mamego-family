// ARMILLARYGO — 渾天碁: 盤に刻まれた2重の天環。環上への着手+1、環と経緯の交点は+2。
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
    file: 'armillarygo.html',
    en: 'ARMILLARYGO',
    jp: '渾天碁',
    prefix: 'armillarygo',
    desc: '盤に刻まれた2重の天環。環上への着手+1、環と経緯の交点は+2。',
    kind: 'stone',
    icon: 'armillarygo',
    spec: [
        ...K.rb('ARMILLARYGO', '渾天碁', 'armillarygo'),
        K.params([
            { key: 'ring_pts', label: '環上の得点', min: 1, max: 4, def: 1, unit: '点' },
            { key: 'node_pts', label: '交点の得点', min: 1, max: 6, def: 2, unit: '点' },
            { key: 'ring_width', label: '環の太さ', min: 0.15, max: 0.9, def: 0.45, step: 0.05, hint: '中心線からの許容距離' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT, `
        // 渾天儀: 中心を跨ぐ2重の環と経緯の交点
        const ringR1 = () => (BOARD_SIZE - 1) / 3;
        const ringR2 = () => (BOARD_SIZE - 1) * 2 / 3;
        const ringCell = (x, y) => {
            const c = (BOARD_SIZE - 1) / 2;
            const d = Math.sqrt((x - c) * (x - c) + (y - c) * (y - c));
            return Math.abs(d - ringR1()) < (P('ring_width') || 0.45) || Math.abs(d - ringR2()) < (P('ring_width') || 0.45);
        };
        const nodeCell = (x, y) => {
            const c = (BOARD_SIZE - 1) / 2;
            return (x === c || y === c) && ringCell(x, y);
        };`, ''),
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 環上+1、経緯との交点なら+2
            if (nodeCell(move.cells[0].x, move.cells[0].y)) st.score[player] += (P('node_pts') || 2);
            else if (ringCell(move.cells[0].x, move.cells[0].y)) st.score[player] += (P('ring_pts') || 1);`],
        K.CUE_GRID(`            // 渾天儀の2環と経緯線
            {
                const c_ = (BOARD_SIZE - 1) / 2;
                const cx = padding + c_ * cellSize, cy = padding + c_ * cellSize;
                ctx.strokeStyle = 'rgba(180,83,9,0.45)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.beginPath(); ctx.arc(cx, cy, ringR1() * cellSize, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(cx, cy, ringR2() * cellSize, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = 'rgba(120,113,108,0.35)';
                ctx.beginPath();
                ctx.moveTo(cx - ringR2() * cellSize * 1.05, cy); ctx.lineTo(cx + ringR2() * cellSize * 1.05, cy);
                ctx.moveTo(cx, cy - ringR2() * cellSize * 1.05); ctx.lineTo(cx, cy + ringR2() * cellSize * 1.05);
                ctx.stroke();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'天環 ' + st.score[1] + ' / ' + st.score[2]`),
        [K.ONE, K.INFO_BASE, `                        渾天碁: 盤には2重の天環と経緯線が刻まれている。環上への着手で+1、環と経緯線の交点なら+2。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤面の2つの同心円が天環。環上への着手で+1点。',
            '環と縦横の経緯線が交わる8点 (ノード) への着手は+2点。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = (BOARD_SIZE - 1) / 2;
        assert('天環がある', ringCell(c + 4, c) && !ringCell(0, 0));
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        executeMove({ cells: [{ x: c + 4, y: c }] }, 1);
        assert('環と経緯の交点+2', st.score[1] === 2);
        executeMove({ cells: [{ x: c + 3, y: c - 3 }] }, 2);
        assert('環上は+1', st.score[2] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('環外は+0', st.score[1] === 2);
    `,
};
