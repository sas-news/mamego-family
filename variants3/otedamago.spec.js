// OTEDAMAGO — 手玉碁: 石はお手玉。前の着手点に接して打ち続けると連続投げ上げ回数が伸びて得点
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
const ST_INIT = `{ last: { 1: -1, 2: -1 }, streak: { 1: 0, 2: 0 }, best: { 1: 0, 2: 0 }, _end: false }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'otedamago.html',
    en: 'OTEDAMAGO',
    jp: '手玉碁',
    prefix: 'otedamago',
    desc: '石はお手玉。前回の着手点に接して打ち続けると投げ上げ連続回数が伸び、最高回数が得点。',
    kind: 'stone',
    icon: 'otedamago',
    spec: [
        ...K.rb('OTEDAMAGO', '手玉碁', 'otedamago'),
        K.params([
            { key: 'link_dist', label: '連続とみなす距離', min: 1, max: 3, def: 1, unit: 'マス' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 投げ上げ: 前回の自分の着手点に接していれば連続回数+1、離れればリセット
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 手玉: 前回の着手点に接していれば投げ上げ継続 (+1)、離れれば落とす
            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const px = pi % BOARD_SIZE, py = (pi / BOARD_SIZE) | 0;
                const lx = st.last[player] % BOARD_SIZE, ly = (st.last[player] / BOARD_SIZE) | 0;
                const __ld = P('link_dist') || 1;
                const near = st.last[player] >= 0
                    && Math.abs(px - lx) <= __ld && Math.abs(py - ly) <= __ld && !(px === lx && py === ly);
                st.streak[player] = near ? st.streak[player] + 1 : 1;
                if (st.streak[player] > st.best[player]) {
                    st.best[player] = st.streak[player];
                    if (st.streak[player] >= 3) {
                        fxGlow(pi, '#f9a8d4', 900);
                        fxText(pi, '手玉 x' + st.streak[player], '#f9a8d4', 1100);
                    }
                }
                st.last[player] = pi;
            }

            turn = opponent;`],
        // 手玉の印: 直前の着手点とその石を結ぶ糸
        ...K.STONE_MARKS_SPEC(`            // 手玉の軌跡: 連続投げ上げ中の石にピンクの輪
            {
                ctx.save();
                [1, 2].forEach(v => {
                    if (st.streak[v] < 3 || st.last[v] < 0) return;
                    const i = st.last[v];
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(249,168,212,0.8)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.33, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        // 最高連続回数を終局時にアゲハマ相当で加算
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._end) {
                st._end = true;
                captures[1] += st.best[1] || 0;
                captures[2] += st.best[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'手玉 黒x' + st.streak[1] + ' / 白x' + st.streak[2]`),
        [K.ONE, K.INFO_ALGO, `            手玉碁: 前回の着手点に接して打ち続けると連続投げ上げ。最高連続回数が得点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石はお手玉。前回の自分の着手点に接する位置 (周囲8マス) に打ち続けると投げ上げ継続。',
            '連続回数はストリークとして記録され、最高回数が終局時にアゲハマ相当で得点になる。',
            '離れた所に打つと玉を落として1からやり直し。3連以上で印が付く。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.last = { 1: -1, 2: -1 }; st.streak = { 1: 0, 2: 0 }; st.best = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('1投目は1', st.streak[1] === 1);
        executeMove({ cells: [{ x: 6, y: 5 }] }, 1); // 前回に接している
        assert('接して2連', st.streak[1] === 2 && st.best[1] === 2);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1); // 離れて落とす
        assert('離れると落ちる', st.streak[1] === 1 && st.best[1] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
    `,
};
