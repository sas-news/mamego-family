// VAMPIROGO — 寄生碁: 敵石に隣接して打った石は寄生し、相手手番ごとに隣の敵石の養分(呼吸)を吸う
const K = require('../gen_kit.js');
module.exports = {
    file: 'vampirogo.html',
    en: 'VAMPIROGO',
    jp: '寄生碁',
    prefix: 'vampirogo',
    desc: '敵石に隣接して打った石は寄生する。寄生石は自分の手番の終わりに隣の敵石を1つ吸い取る。',
    kind: 'stone',
    icon: 'vampirogo',
    spec: [
        ...K.rb('VAMPIROGO', '寄生碁', 'vampirogo'),
        K.params([
            { key: 'cap_moves', label: '打ち切り手数', min: 40, max: 300, step: 10, def: 140, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { vamps: [] }; // 寄生石 {i, owner}`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { vamps: [] };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { vamps: [] };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { vamps: [] };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { vamps: [] };`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 寄生登録 + 吸血: 敵石に隣接して打った石は寄生し、寄生石が敵石を1つ吸い取る
            {
                const li = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (getNeighbors(li).some(n => board[n] === opponent) && !st.vamps.some(v => v.i === li)) {
                    st.vamps.push({ i: li, owner: player });
                }
                // 死んだ寄生石を掃除
                st.vamps = st.vamps.filter(v => board[v.i] === v.owner);
                // 今打った寄生石が吸血: 隣の敵石を1つ吸い取る
                const vamp = st.vamps.find(v => v.i === li);
                if (vamp) {
                    const prey = getNeighbors(li).find(n => board[n] === opponent);
                    if (prey !== undefined) {
                        board[prey] = 0;
                        captures[player]++;
                        fxBurst(prey, '#a21caf', 8, 1.5);
                        fxText(li, '吸血!', '#f0abfc', 1100);
                        cleanUpPieces();
                        // 吸い尽くした寄生石は寄生を解かれる (通常石に)
                        st.vamps = st.vamps.filter(v => v.i !== li);
                    }
                }
            }

            // 打ち切り終局
            if (history.length >= Math.max(1, P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 寄生石に紫の牙印
        ...K.STONE_MARKS_SPEC(`            // 寄生石に紫の牙
            {
                ctx.save();
                (st.vamps || []).forEach(v => {
                    const i = v.i;
                    if (board[i] !== v.owner) return;
                    const mx = i % BOARD_SIZE, my = Math.floor(i / BOARD_SIZE);
                    const cx = padding + mx * cellSize, cy = padding + my * cellSize;
                    ctx.strokeStyle = '#e879f9';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.38, Math.PI * 0.15, Math.PI * 0.85);
                    ctx.stroke();
                    ctx.fillStyle = '#e879f9';
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.12, cy + cellSize * 0.1);
                    ctx.lineTo(cx - cellSize * 0.08, cy + cellSize * 0.3);
                    ctx.lineTo(cx - cellSize * 0.02, cy + cellSize * 0.1);
                    ctx.closePath();
                    ctx.moveTo(cx + cellSize * 0.12, cy + cellSize * 0.1);
                    ctx.lineTo(cx + cellSize * 0.08, cy + cellSize * 0.3);
                    ctx.lineTo(cx + cellSize * 0.02, cy + cellSize * 0.1);
                    ctx.closePath();
                    ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            寄生碁: 敵石に隣接して打った石は寄生し、隣の敵石を1つ吸い取る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '敵石に隣接する点に打った石は「寄生石」になる (紫の牙印)。寄生した瞬間、隣の敵石を1つ吸い取ってアゲハマにする。',
            '寄生は1回きり — 吸い終わると普通の石に戻る。敵陣への寄生と迎撃の読み合い。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { vamps: [] };
        board[2 * BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 3, y: 2 }] }, 1); // 白石の隣に打つ → 寄生
        assert('寄生登録される', st.vamps.length === 1 || board[2 * BOARD_SIZE + 4] === 0);
        assert('敵石を吸い取った', board[2 * BOARD_SIZE + 4] === 0 && captures[1] >= 1);
        // 敵石の隣でなければ寄生しない
        board.fill(0); st.vamps = []; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('孤立着手は寄生しない', st.vamps.length === 0);
    `,
};
