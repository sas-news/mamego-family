// RAPTORGO — 猛禽碁: 孤立した着地点は鷹の急降下。近くの孤立した敵石を1つ捕る
const K = require('../gen_kit.js');
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
const ST_INIT = `{ raptors: [] }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'raptorgo.html',
    en: 'RAPTORGO',
    jp: '猛禽碁',
    prefix: 'raptorgo',
    desc: '孤立した地点への着手は鷹の急降下。4目以内の孤立敵石を1つ狩る。',
    kind: 'stone',
    icon: 'raptorgo',
    spec: [
        ...K.rb('RAPTORGO', '猛禽碁', 'raptorgo'),
        ...ST(ST_INIT),
        // 猛禽ルール: 周囲に石のない孤立着手は急降下 — 4目以内の孤立敵石を狩る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 猛禽: 孤立した地点に置くと鷹になる。4目以内の孤立した敵石(小動物)を1つ捕らえる
            {
                st.raptors = st.raptors.filter(i => board[i] !== 0);
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const mx = move.cells[0].x, my = move.cells[0].y;
                const alone = getNeighbors(mi).every(i => board[i] === 0);
                if (alone) {
                    st.raptors.push(mi);
                    // 狩り: 味方と繋がっていない孤立敵石のうち最近のものを1つ
                    let best = -1, bestD = 99;
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] !== opponent) continue;
                        if (!getNeighbors(i).every(n => board[n] !== opponent)) continue; // 連のある敵は逃げる
                        const dx = (i % BOARD_SIZE) - mx, dy = Math.floor(i / BOARD_SIZE) - my;
                        const d = Math.abs(dx) + Math.abs(dy);
                        if (d >= 2 && d <= 4 && d < bestD) { best = i; bestD = d; }
                    }
                    if (best >= 0) {
                        board[best] = 0;
                        captures[player]++;
                        fxSlide(best, mi, 420);
                        fxBurst(best, '#fbbf24', 10, 1.6);
                        fxText(mi, '急降下!', '#fbbf24', 1100);
                        cleanUpPieces();
                    } else {
                        fxGlow(mi, '#a3e635', 600);
                    }
                }
            }

            turn = opponent;`],
        // 鷹の印: 孤立した猛禽石に鉤爪マーク
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                (st.raptors || []).forEach(i => {
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.2, cy - cellSize * 0.18);
                    ctx.lineTo(cx, cy + cellSize * 0.05);
                    ctx.lineTo(cx + cellSize * 0.2, cy - cellSize * 0.18);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'鷹 ' + st.raptors.filter(i => board[i] !== 0).length + '羽'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            猛禽碁: 上下左右に石のない孤立地点への着手は鷹の急降下。4目以内の孤立敵石を1つ狩る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '隣接4点が全て空の地点に置くとその石は「鷹」。着手と同時に4目以内で最も近い孤立した敵石1つを狩る。',
            '連に守られた敵石は狩られない。孤立の度合いを競う静かな撃ち合い。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.raptors = [];
        board[4 * BOARD_SIZE + 7] = 2; // 孤立した白石 (距離3)
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('孤立着手は鷹になる', st.raptors.includes(4 * BOARD_SIZE + 4));
        assert('孤立敵石を狩る', board[4 * BOARD_SIZE + 7] === 0 && captures[1] === 1);
        board[8 * BOARD_SIZE + 4] = 2; board[8 * BOARD_SIZE + 5] = 2; // 連のある白石
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1);
        assert('連のある敵は狩れない', board[8 * BOARD_SIZE + 4] === 2 && board[8 * BOARD_SIZE + 5] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
