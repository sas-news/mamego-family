// RAFTGO — 筏碁: 4つの小盤 (筏) がロープ橋で繋がる。潮汐で筏の距離 (橋の有無) が変わる
const K = require('../gen_kit.js');
module.exports = {
    file: 'raftgo.html',
    en: 'RAFTGO',
    jp: '筏碁',
    prefix: 'raftgo',
    desc: '4つの筏がロープ橋で繋がる。5手ごとの潮汐で橋が架かったり沈んだりする。',
    kind: 'stone',
    icon: 'raftgo',
    spec: [
        ...K.rb('RAFTGO', '筏碁', 'raftgo'),
        K.params([
            { key: 'raft_size', label: '筏の一辺', min: 2, max: 5, def: 3, unit: '目' },
            { key: 'tide_period', label: '潮汐の周期', min: 2, max: 15, def: 5, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 4つの筏 (3x3) + ロープ橋 (潮汐で出没)
        let RAFT_F = Math.max(1, Math.floor(BOARD_SIZE / 5));
        let RAFT_S = 3;
        let RAFTS = [];
        let BRIDGE_CELLS = new Set();
        function rebuildRafts() {
            RAFT_F = Math.max(1, Math.floor(BOARD_SIZE / 5));
            RAFT_S = Math.max(2, Math.min(5, P('raft_size') || 3));
            RAFTS = [
                [RAFT_F, RAFT_F],
                [BOARD_SIZE - RAFT_F - RAFT_S, RAFT_F],
                [RAFT_F, BOARD_SIZE - RAFT_F - RAFT_S],
                [BOARD_SIZE - RAFT_F - RAFT_S, BOARD_SIZE - RAFT_F - RAFT_S],
            ];
            BRIDGE_CELLS = new Set();
            const N = BOARD_SIZE;
            const h = (y) => { for (let x = RAFT_F + RAFT_S; x < N - RAFT_F - RAFT_S; x++) BRIDGE_CELLS.add(y * N + x); };
            const v = (x) => { for (let y = RAFT_F + RAFT_S; y < N - RAFT_F - RAFT_S; y++) BRIDGE_CELLS.add(y * N + x); };
            h(RAFT_F + 1); h(N - RAFT_F - 2); v(RAFT_F + 1); v(N - RAFT_F - 2);
        }
        rebuildRafts();
        // 設定変更時に筏・橋を再構築
        function onVariantParam(p) { rebuildRafts(); }
        function isRaftCell(x, y) {
            return RAFTS.some(([rx, ry]) => x >= rx && x < rx + RAFT_S && y >= ry && y < ry + RAFT_S);
        }
        function isBridgeCell(i) { return BRIDGE_CELLS.has(i); }
        function tideClose() { return Math.floor(history.length / Math.max(1, P('tide_period') || 5)) % 2 === 0; } // 近い時だけ橋が架かる
        function isRaftPlayable(x, y) {
            const i = y * BOARD_SIZE + x;
            if (isRaftCell(x, y)) return true;
            if (isBridgeCell(i)) return tideClose();
            return false;
        }`],
        // 海と筏の初期化 (橋は潮汐に従う)
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let i = 0; i < board.length; i++) {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                if (!isRaftPlayable(x, y)) board[i] = 3;
            }`],
        // 手番ごとに潮汐を反映 (橋の石は海に呑まれる)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            const cl = tideClose();
            BRIDGE_CELLS.forEach(i => {
                const want = cl ? 0 : 3;
                if (board[i] !== want) {
                    const v = board[i];
                    if (v === 1 || v === 2) { captures[v === 1 ? 2 : 1]++; fxSplash(i, '#38bdf8', 8); }
                    board[i] = want;
                }
            });
            if (!cl) fxShake(3, 250);
            cleanUpPieces();
            turn = opponent;`],
        // 海の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        // ロープ橋の描画 (潮汐で架かる時だけ)
        ...K.STONE_MARKS_SPEC(`            {
                if (tideClose()) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(146,64,14,0.8)';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.09);
                    ctx.setLineDash([cellSize * 0.35, cellSize * 0.25]);
                    BRIDGE_CELLS.forEach(i => {
                        const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.beginPath();
                        ctx.moveTo(cx - cellSize * 0.3, cy);
                        ctx.lineTo(cx + cellSize * 0.3, cy);
                        ctx.stroke();
                    });
                    ctx.setLineDash([]);
                    ctx.restore();
                }
            }`),
        // 潮汐チップ
        ...K.EVENT_CHIP_SPEC(`tideClose() ? '満ち潮 (橋あり)' : '引き潮 (橋なし)'`),
        // 海を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_ALGO, `            筏碁: 4つの筏がロープ橋で繋がる。5手ごとの潮汐で橋が架かったり沈んだりする<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手できるのは4つの3x3筏と潮汐で架かるロープ橋だけ。橋は5手ごとに出没。',
            '引き潮で橋は沈み、橋の石は海に呑まれて相手のアゲハマになる。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
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
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('筏は打てる', isValidPlacement([{ x: RAFT_F, y: RAFT_F }], 1) === true);
        const bi = [...BRIDGE_CELLS][0];
        const bx = bi % BOARD_SIZE, by = (bi / BOARD_SIZE) | 0;
        assert('満ち潮で橋は打てる', tideClose() && isValidPlacement([{ x: bx, y: by }], 1) === true);
        // 5手進めると引き潮になり橋は沈む
        [[2, 2], [3, 2], [4, 2], [8, 2], [9, 2]].forEach(([x, y], k) => {
            executeMove({ cells: [{ x, y }] }, k % 2 === 0 ? 1 : 2);
        });
        assert('引き潮で橋は使えない', !tideClose() && isValidPlacement([{ x: bx, y: by }], 1) === false);
        assert('橋は海に沈んだ', board[bi] === 3);
        const sea = I(RAFT_F + RAFT_S + 1, RAFT_F);
        assert('筏の外は海', isRaftCell(RAFT_F + RAFT_S + 1, RAFT_F) === false && board[sea] === 3);
    `,
};
