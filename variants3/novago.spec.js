// NOVAGO — 客星碁: 15手周期で空点に客星が現れる。6手以内に置くと+5。
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
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false, nova: null }`;
module.exports = {
    file: 'novago.html',
    en: 'NOVAGO',
    jp: '客星碁',
    prefix: 'novago',
    desc: '15手周期で空点に客星が現れる。6手以内に置くと+5。',
    kind: 'stone',
    icon: 'novago',
    spec: [
        ...K.rb('NOVAGO', '客星碁', 'novago'),
        ...ST(ST_INIT, `
        // 客星: 突如現れる新星点。現れてから6手以内に置くと+5
        const trySpawnNova = () => {
            const empties = [];
            for (let i = 0; i < board.length; i++) if (board[i] === 0) empties.push(i);
            if (!empties.length) { st.nova = null; return; }
            const idx = empties[Math.floor(Math.random() * empties.length)];
            st.nova = { idx, until: history.length + 6 };
        };`, ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 客星: 8手目・23手目…と15手ごとに出現。期限を過ぎると消える
            if (history.length % 15 === 8) trySpawnNova();
            if (st.nova && history.length > st.nova.until) st.nova = null;
            const nIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            if (st.nova && st.nova.idx === nIdx) {
                st.score[player] += 5;
                st.nova = null;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 客星: 新星点に輝く星印
            {
                ctx.save();
                if (st.nova && board[st.nova.idx] === 0) {
                    const x = st.nova.idx % BOARD_SIZE, y = (st.nova.idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(245,158,11,0.9)';
                    ctx.beginPath();
                    for (let i = 0; i < 8; i++) {
                        const a = i * Math.PI / 4;
                        const r = i % 2 === 0 ? cellSize * 0.34 : cellSize * 0.13;
                        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
                        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
                    }
                    ctx.closePath(); ctx.fill();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`st.nova ? '客星 あと' + (st.nova.until - history.length) + '手' : '客星なし'`),
        [K.ONE, K.INFO_ALGO, `                        客星碁: 8手目から15手ごとにランダムな空点へ客星が現れる。消える前(6手以内)に置くと+5点。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '8・23・38…と15手ごとに盤上の空点へ客星が現れ、6手で消える。',
            '客星の点に置いた側が+5。先に取り合う競争。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '客星の出る位置は乱数。両者に等しくチャンスがある。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        Math.random = () => 0.0;
        for (let i = 0; i < 7; i++) history.push({ board: [...board] });
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1);
        assert('客星が現れる', st.nova && st.nova.idx === 0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('客星に置くと+5', st.score[2] === 5 && st.nova === null);
        assert('黒は入らない', st.score[1] === 0);
    `,
};
