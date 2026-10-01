// EMBERGO — 残火碁: 取られた石の跡は2手間「余燼」となり、取られた側はそのマスに置けない
const K = require('../gen_kit.js');
module.exports = {
    file: 'embergo.html',
    en: 'EMBERGO',
    jp: '残火碁',
    prefix: 'embergo',
    desc: '取られた石の跡は2手間「余燼」として熱を持ち、取られた側は置けない。',
    kind: 'stone',
    icon: 'embergo',
    spec: [
        ...K.rb('EMBERGO', '残火碁', 'embergo'),
        K.params([
            { key: 'ember_ttl', label: '余燼の残る手数', min: 1, max: 10, def: 4, unit: '手番' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { ember: {} }; // 余燼マス idx -> [残り手数, 置けない側]`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { ember: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { ember: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { ember: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { ember: {} };`],
        // 余燼の上には取られた側が置けない
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                const eb = st.ember[p.y * BOARD_SIZE + p.x];
                if (eb && eb[1] === player) return false; // 自分の石の余燼はまだ熱い
            }`],
        // 取った石は余燼を残す (取られた側がしばらく置けない)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; st.ember[idx] = [Math.max(1, P('ember_ttl') || 4), opponent]; fxGlow(idx, '#f97316', 500); });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 手番ごとに余燼が冷めていく
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            for (const k in st.ember) { if (--st.ember[k][0] <= 0) delete st.ember[k]; }
            turn = opponent;`],
        // 余燼の描画: 橙の残火 + 火花
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (const k in st.ember) {
                    const i = +k, x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const pulse = 0.30 + 0.12 * Math.sin(fxNow() / 140 + i * 2.1);
                    ctx.fillStyle = 'rgba(249,115,22,' + pulse.toFixed(3) + ')';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.34, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(254,215,170,0.85)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.10, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            残火碁: 取られた石の跡は2手間「余燼」となり、取られた側はそのマスに置けない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '取られた石の跡は「余燼」(橙) になり、取られた側はその後2手番のあいだ置けない。',
            '取った側はすぐ再利用できる。打ち返しの間引き + 再占領の遅延。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; st.ember = {}; captures = { 1: 0, 2: 0 };
        board[I(1, 0)] = 1; board[I(0, 1)] = 1; board[I(2, 1)] = 1;
        board[I(1, 1)] = 2;
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1);
        assert('白は取られた', board[I(1, 1)] === 0 && captures[1] === 1);
        assert('余燼が残る', st.ember[I(1, 1)] && st.ember[I(1, 1)][1] === 2);
        assert('取られた側は置けない', isValidPlacement([{ x: 1, y: 1 }], 2) === false);
        assert('取った側は置ける', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
    `,
};
