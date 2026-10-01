// ZIGGURATGO — 神殿碁: 自分の石の上に石を積み上げ (最大4段)、Lv4の頂点に到達した側が即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'zigguratgo.html',
    en: 'ZIGGURATGO',
    jp: '神殿碁',
    prefix: 'zigguratgo',
    desc: '自分の石の上に積み上げて神殿を建てる。Lv4の頂点に到達した側が即勝ち。',
    kind: 'stone',
    icon: 'zigguratgo',
    spec: [
        ...K.rb('ZIGGURATGO', '神殿碁', 'zigguratgo'),
        K.params([
            { key: 'zig_max', label: '神殿の高さ (頂点)', min: 2, max: 8, def: 4, unit: '段' },
            { key: 'cap', label: '打ち切り手数', min: 40, max: 400, def: 140, unit: '手' },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 神殿の高さ上限=頂点 (設定で調整可能)
        function zigMax() { return Math.max(2, P('zig_max') || 4); }

        function endGameByScore() {`],
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let lv = []; // 各マスの積層レベル (0=なし/1-4)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            lv = Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                lv: [...lv],
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            lv = snap.lv ? [...snap.lv] : Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    lv,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            lv = s.lv ? [...s.lv] : Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                lv,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            lv = data.lv ? [...data.lv] : Array(BOARD_SIZE * BOARD_SIZE).fill(0);`],
        // 自分の石の上 (lv<上限) には積層着手できる
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                const vi = p.y * BOARD_SIZE + p.x;
                if (board[vi] !== 0 && !(board[vi] === player && lv[vi] < zigMax())) return false;
            }`],
        // 積層着手では新しいピースを積まない (積層で lv>1 になった着手はピース追加をスキップ)
        [K.ONE, K.PIECES_PUSH, `            if ((lv[move.cells[0].y * BOARD_SIZE + move.cells[0].x] || 0) <= 1) {
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });
            }`],
        // 積層石が取られる時はレベル分まとめてアゲハマに
        [K.ONE, `                captures[player] += captured.length;`,
`                captures[player] += captured.reduce((a, i) => a + Math.max(1, lv[i] || 0), 0);
                captured.forEach(i => { lv[i] = 0; });`],
        // 積層: 自分の石の上なら配置せずLv+1
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => {
                const ii = p.y * BOARD_SIZE + p.x;
                if (board[ii] === player && lv[ii] < zigMax()) {
                    lv[ii]++;
                    fxBurst(ii, '#fbbf24', 6, 1.2);
                } else {
                    board[ii] = player;
                    lv[ii] = 1;
                }
            });`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 神殿ルール: 頂点に到達した側が即勝ち
            {
                const zi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (lv[zi] >= zigMax()) {
                    fxGlow(zi, '#fbbf24', 1100);
                    fxText(zi, '登頂!', '#d97706', 1500);
                    fxShake(7, 420);
                    winByRule(player, '登頂勝ち', '神殿の頂点 (Lv' + zigMax() + ') に到達しました'); return;
                }
            }
            // 長期戦防止: 一定手数経過でその時点の地数判定
            if (history.length >= (P('cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        // 積層レベルのピップ描画
        ...K.STONE_MARKS_SPEC(`            for (let i = 0; i < board.length; i++) {
                const l = lv[i] || 0;
                if (l < 2 || board[i] === 0) continue;
                const dx = i % BOARD_SIZE, dy = Math.floor(i / BOARD_SIZE);
                const cx = padding + dx * cellSize, cy = padding + dy * cellSize;
                ctx.save();
                for (let k = 0; k < l - 1; k++) {
                    ctx.strokeStyle = 'rgba(251,191,36,0.95)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.045);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * (0.42 + k * 0.09), 0, Math.PI * 2);
                    ctx.stroke();
                }
                if (l >= 3) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.font = 'bold ' + Math.floor(cellSize * 0.34) + 'px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('殿', cx, cy);
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石の上に石を積み上げられる (最大Lv4)。積層1回でLv+1。',
            'Lv4の頂点に到達した側が即勝ち。積層石はLv分まとめてアゲハマになる。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; lv = Array(BOARD_SIZE * BOARD_SIZE).fill(0); history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('新規石はLv1', lv[6 * BOARD_SIZE + 6] === 1);
        assert('積層着手は合法', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('積層でLv2', lv[6 * BOARD_SIZE + 6] === 2);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('頂点Lv4で即勝ち', gameOver === true);
        assert('登頂勝ち表示', !!gameResultData && gameResultData.title.includes('登頂'));
    `,
};
