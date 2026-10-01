// SUZURIGO — 硯相碁: 四分区の硯で墨を摺り、十分に溜まると盤上の着手で揮毫得点。
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
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false, ink: {1: 0, 2: 0}, ground: {1: false, 2: false} }`;
module.exports = {
    file: 'suzurigo.html',
    en: 'SUZURIGO',
    jp: '硯相碁',
    prefix: 'suzurigo',
    desc: '四分区の硯で墨を摺り、十分に溜まると盤上の着手で揮毫得点。',
    kind: 'stone',
    icon: 'suzurigo',
    spec: [
        ...K.rb('SUZURIGO', '硯相碁', 'suzurigo'),
        K.params([
            { key: 'ink_star', label: '星で摺れる墨の量', min: 1, max: 6, def: 2, unit: '墨' },
            { key: 'kigo_min', label: '季語に必要な墨', min: 2, max: 12, def: 5, unit: '墨' },
            { key: 'kigo_pts', label: '季語の得点', min: 1, max: 10, def: 4, unit: '点' },
        ]),
        ...ST(ST_INIT, `
        // 4つの硯: 四分区の星を中心とする3x3の墨池
        const SUZU = new Set();
        const rebuildSuzu = () => {
            SUZU.clear();
            const q = Math.floor(BOARD_SIZE / 3);
            [q, BOARD_SIZE - q - 1].forEach(sx => [q, BOARD_SIZE - q - 1].forEach(sy => {
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    const x = sx + dx, y = sy + dy;
                    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) SUZU.add(y * BOARD_SIZE + x);
                }
            }));
        };`, `
            rebuildSuzu();`),
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            const sIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            if (SUZU.has(sIdx)) {
                // 硯で墨を摺る: 星(中心)は+2、池の他点は+1
                const sx = sIdx % BOARD_SIZE, sy = (sIdx / BOARD_SIZE) | 0;
                const q = Math.floor(BOARD_SIZE / 3);
                const isCenter = (sx === q || sx === BOARD_SIZE - q - 1) && (sy === q || sy === BOARD_SIZE - q - 1);
                st.ink[player] += isCenter ? (P('ink_star') || 2) : 1;
            }
            // 墨が5以上溜まっていれば、硯の外への着手で一度だけ揮毫+4
            if (!st.ground[player] && st.ink[player] >= (P('kigo_min') || 5) && !SUZU.has(sIdx)) {
                st.ground[player] = true;
                st.score[player] += (P('kigo_pts') || 4);
            }`],
        K.CUE_GRID(`            // 硯: 四分区の3x3墨池を描く
            {
                const q_ = Math.floor(BOARD_SIZE / 3);
                [q_, BOARD_SIZE - q_ - 1].forEach(sx => [q_, BOARD_SIZE - q_ - 1].forEach(sy => {
                    const px = padding + sx * cellSize, py = padding + sy * cellSize;
                    ctx.fillStyle = 'rgba(51,65,85,0.30)';
                    ctx.fillRect(px - cellSize * 1.5, py - cellSize * 1.5, cellSize * 3, cellSize * 3);
                    ctx.fillStyle = 'rgba(15,23,42,0.8)';
                    ctx.beginPath();
                    ctx.ellipse(px, py, cellSize * 0.32, cellSize * 0.22, 0, 0, Math.PI * 2);
                    ctx.fill();
                }));
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'墨 黒' + st.ink[1] + ' / 白' + st.ink[2]`),
        [K.ONE, K.INFO_ALGO, `                        硯相碁: 四分区の星の周囲3x3は硯。硯に置くと墨+1 (星なら+2)。墨が5以上溜まると、硯の外への着手で一度だけ+4点。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '四分区の星を中心とする3x3の区域が「硯」。硯への着手で墨が溜まる (星の中心なら+2、他の点なら+1)。',
            '墨が5以上溜まった状態で硯の外に打つと「揮毫」: その局で一度だけ+4点。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '墨は自分だけの資源。対称ルールなので先後とも同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const q = Math.floor(BOARD_SIZE / 3);
        assert('硯は四分区の星周辺', SUZU.has(I(q, q)) && SUZU.size >= 16);
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        executeMove({ cells: [{ x: q, y: q }] }, 1);
        assert('硯の星で墨+2', st.ink[1] === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('硯の外では墨が溜まらない', st.ink[2] === 0);
        st.ink[1] = 5;
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 }] }, 1);
        assert('揮毫で一度だけ+4', st.ground[1] === true && st.score[1] === 4);
    `,
};
