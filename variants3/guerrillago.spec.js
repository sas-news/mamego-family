// GUERRILLAGO — 遊撃碁: 敵陣 (相手側の半分) に置いた石は遊撃兵。次の自分の手番の最初に隣の敵石を1個襲撃する
const K = require('../gen_kit.js');
module.exports = {
    file: 'guerrillago.html',
    en: 'GUERRILLAGO',
    jp: '遊撃碁',
    prefix: 'guerrillago',
    desc: '敵陣に置いた石は遊撃兵。次の自分の手番の最初に隣接する敵石を1個襲う。',
    kind: 'stone',
    icon: 'guerrillago',
    spec: [
        ...K.rb('GUERRILLAGO', '遊撃碁', 'guerrillago'),
        K.params([
            { key: 'raid_count', label: '遊撃兵1人の襲撃数', min: 1, max: 4, def: 1, unit: '個' },
            { key: 'cap_moves', label: '打ち切り手数', min: 50, max: 500, def: 140, step: 10, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { guer: [] }; // 遊撃兵: {i:盤面idx, owner} — 持ち主の次手番の最初に襲撃`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { guer: [] };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { guer: [] };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { guer: [] };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { guer: [] };`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 敵陣侵入 → 遊撃兵登録 (黒は上半分、白は下半分が敵陣)
            {
                const mc = move.cells[0];
                const mid = (BOARD_SIZE - 1) / 2;
                const enemyHalf = player === 1 ? mc.y < mid : mc.y > mid;
                if (enemyHalf && board[mc.y * BOARD_SIZE + mc.x] === player) {
                    st.guer.push({ i: mc.y * BOARD_SIZE + mc.x, owner: player });
                    fxGlow(mc.y * BOARD_SIZE + mc.x, '#84cc16', 600);
                }
            }
            // 手番が回ってくる側 (opponent) の遊撃兵が起動: 隣の敵石を1個襲撃
            {
                let hit = false;
                st.guer.forEach(g => {
                    if (g.owner !== opponent || board[g.i] !== g.owner) return;
                    const vics = getNeighbors(g.i).filter(n => board[n] === player).slice(0, Math.max(1, P('raid_count') || 1));
                    vics.forEach(vic => {
                        board[vic] = 0; captures[g.owner]++;
                        fxBurst(vic, '#f97316', 9, 1.6);
                        fxText(g.i, '遊撃!', '#fb923c', 1000);
                        hit = true;
                    });
                });
                st.guer = st.guer.filter(g => g.owner !== opponent && board[g.i] === g.owner);
                if (hit) { fxShake(4, 260); cleanUpPieces(); }
            }

            // 打ち切り終局
            if (history.length >= (P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_MARKS_SPEC(`            // 待機中の遊撃兵に赤い目印
            {
                ctx.save();
                (st.guer || []).forEach(g => {
                    if (board[g.i] !== g.owner) return;
                    const dx = g.i % BOARD_SIZE, dy = Math.floor(g.i / BOARD_SIZE);
                    const cx = padding + dx * cellSize, cy = padding + dy * cellSize;
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.30, Math.PI * 0.2, Math.PI * 1.4);
                    ctx.stroke();
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.moveTo(cx + cellSize * 0.28, cy - cellSize * 0.34);
                    ctx.lineTo(cx + cellSize * 0.5, cy - cellSize * 0.42);
                    ctx.lineTo(cx + cellSize * 0.36, cy - cellSize * 0.18);
                    ctx.closePath();
                    ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            遊撃碁: 敵陣に置いた石は遊撃兵。次の自分の手番の最初に隣の敵石を襲う<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '敵陣側 (黒は上半分・白は下半分) に置いた石は遊撃兵になる (赤い目印)。',
            '次の自分の手番が回ってきた時点で、生き残っている遊撃兵は隣接する敵石を1個襲ってアゲハマにする (1回きり)。',
            '襲撃前に敵が遊撃兵を取れば不発。打ち切り: 140手で自動終局。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { guer: [] };
        assert('起動', Array.isArray(st.guer));
        board[3 * BOARD_SIZE + 2] = 2; // 白 (2,3) — 黒の遊撃兵の獲物
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1); // 黒、敵陣 (y<mid) → 遊撃兵
        assert('敵陣侵入で遊撃兵化', st.guer.length === 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2); // 白の手 → 黒の遊撃兵が起動
        assert('遊撃兵が敵石を襲う', board[3 * BOARD_SIZE + 2] === 0 && captures[1] === 1);
        assert('遊撃兵は通常石に戻る', board[2 * BOARD_SIZE + 2] === 1 && st.guer.filter(g => g.owner === 1).length === 0);
    `,
};
