// BATTERYGO — 電池碁: 石に充電量(1-3)。隣接敵石に放電して弱め、切れたら死滅
const K = require('../gen_kit.js');
module.exports = {
    file: 'batterygo.html',
    en: 'BATTERYGO',
    jp: '電池碁',
    prefix: 'batterygo',
    desc: '石は充電3で着弾。敵に隣接して打つと放電し、切れた石は死滅する。',
    kind: 'stone',
    icon: 'batterygo',
    spec: [
        ...K.rb('BATTERYGO', '電池碁', 'batterygo'),
        K.params([
            { key: 'chg_init', label: '初期充電量', min: 1, max: 6, def: 3 },
            { key: 'chg_loss', label: '放電量', min: 1, max: 3, def: 1 },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 1.8, def: 0.9, step: 0.1, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { chg: {} }; // 充電量 idx -> 0..3`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { chg: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { chg: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { chg: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { chg: {} };`],
        // 死んだ石の充電を掃除
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; delete st.chg[idx]; });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 着弾で充電3。敵に隣接して打ったら双方放電、切れたら死滅
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            move.cells.forEach(p => { st.chg[p.y * BOARD_SIZE + p.x] = (P('chg_init') || 3); });
            move.cells.forEach(p => {
                const mi = p.y * BOARD_SIZE + p.x;
                if (board[mi] !== player) return;
                const foes = getNeighbors(mi).filter(n => board[n] === opponent);
                if (foes.length === 0) return;
                st.chg[mi] -= (P('chg_loss') || 1);
                foes.forEach(n => {
                    st.chg[n] = (st.chg[n] || 0) - (P('chg_loss') || 1);
                    if (st.chg[n] <= 0 && board[n] === opponent) {
                        board[n] = 0; delete st.chg[n]; captures[player]++;
                        fxBurst(n, '#facc15', 10);
                    } else {
                        fxGlow(n, '#facc15', 350);
                    }
                });
                if (st.chg[mi] <= 0) {
                    board[mi] = 0; delete st.chg[mi]; captures[opponent]++;
                    fxBurst(mi, '#facc15', 10);
                }
                cleanUpPieces();
            });
            turn = opponent;`],
        // 充電の描画: 充電量に応じた稲妻ピップ
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (const k in st.chg) {
                    const i = +k, x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    if (board[i] === 0) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const lv = st.chg[i];
                    for (let j = 0; j < lv; j++) {
                        ctx.fillStyle = ['#facc15', '#fde047', '#fef9c3'][Math.min(2, lv - 1 - j)] || '#facc15';
                        ctx.fillRect(cx - cellSize * 0.24 + j * cellSize * 0.18, cy - cellSize * 0.05, cellSize * 0.10, cellSize * 0.10);
                    }
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            電池碁: 石は充電3 (黄ピップ)。敵に隣接して打つと放電して互いに-1、切れた石は死滅<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は充電3で着弾する。敵石に隣接して打つと自分と全ての隣接敵石が-1充電。',
            '充電0の石は即死して相手のアゲハマになる。敵陣への特攻で相手も道連れにできる。',
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
        board.fill(0); pieces = []; st.chg = {}; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        const bi = I(5, 5);
        assert('充電3で着弾', st.chg[bi] === 3);
        executeMove({ cells: [{ x: 6, y: 5 }] }, 2);
        assert('敵に隣接で双方放電', st.chg[bi] === 2 && st.chg[I(6, 5)] === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 2);
        assert('再度放電で黒は残り1', st.chg[bi] === 1);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 6 }] }, 2);
        assert('充電切れの黒は死滅', board[bi] === 0 && captures[2] === 1);
    `,
};
