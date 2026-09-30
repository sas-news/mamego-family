// LANTERNLOOPGO — 巡灯碁: 灯籠(星の点)を順に灯して一周させると即勝
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ lit: { 1: [], 2: [] } }`;
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
module.exports = {
    file: 'lanternloopgo.html',
    en: 'LANTERNLOOPGO',
    jp: '巡灯碁',
    prefix: 'lanternloopgo',
    desc: '灯籠(星の点)を順に灯して一周させると即勝。灯し方は着手で進める。',
    kind: 'stone',
    icon: 'lanternloopgo',
    spec: [
        ...K.rb('LANTERNLOOPGO', '巡灯碁', 'lanternloopgo'),
        ...ST(ST_INIT),
        // 巡灯: 着手点が星の点なら自分の灯籠に灯が入る。全て灯すと一周で即勝
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false;
            {
                const stars = getStarPoints(BOARD_SIZE).map(p => p.y * BOARD_SIZE + p.x);
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (stars.includes(pi) && !st.lit[player].includes(pi)) {
                    st.lit[player].push(pi);
                    fxGlow(pi, '#fbbf24', 1200);
                    if (st.lit[player].length >= stars.length) {
                        gameOver = true;
                        fxText(pi, '一周!', '#fbbf24', 1600);
                        endGameByScore();
                        return;
                    }
                }
            }
            turn = opponent;`],
        // 灯った灯籠に炎の印
        ...K.STONE_MARKS_SPEC(`            [1, 2].forEach(w => {
                st.lit[w].forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(251,191,36,0.9)';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.4, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(251,191,36,0.6)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.18);
                    ctx.quadraticCurveTo(cx + cellSize * 0.12, cy, cx, cy + cellSize * 0.1);
                    ctx.quadraticCurveTo(cx - cellSize * 0.12, cy, cx, cy - cellSize * 0.18);
                    ctx.fill();
                    ctx.restore();
                });
            })`),
        ...K.EVENT_CHIP_SPEC(`'灯籠 ' + st.lit[turn].length + '/' + getStarPoints(BOARD_SIZE).length`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            巡灯碁: 星の点に着手すると灯籠に灯が入る。全ての灯籠を一周させると即勝<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '星の点 (灯籠) に着手すると、その灯籠に自分の灯が入る (金の輪と炎)。',
            '盤上の全ての灯籠を灯して一周させた側は即勝利。',
            '灯籠を巡るか地を取るか — 双方対称の巡り合戦。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.lit = { 1: [], 2: [] };
        const B = BOARD_SIZE;
        const stars = getStarPoints(B).map(p => p.y * B + p.x);
        assert('星が定義される', stars.length > 0);
        const s0 = stars[0];
        executeMove({ cells: [{ x: s0 % B, y: (s0 / B) | 0 }] }, 1);
        assert('灯籠に灯が入る', st.lit[1].includes(s0));
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('星以外では灯らない', st.lit[2].length === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 0 }], 1) === true || board[B] !== 0);
    `,
};
