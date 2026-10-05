// EXCAVATEGO — 発掘碁: 盤下の5つの埋蔵品マスに石を置いて掘り当てる。先に3つで発掘勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'excavatego.html',
    en: 'EXCAVATEGO',
    jp: '発掘碁',
    prefix: 'excavatego',
    desc: '盤下に埋まる5つの埋蔵品マス。石を置いて掘り当て、先に3つ掘れば発掘勝ち。',
    kind: 'stone',
    icon: 'excavatego',
    spec: [
        ...K.rb('EXCAVATEGO', '発掘碁', 'excavatego'),
        K.params([
            { key: 'win_digs', label: '発掘勝ちに必要な数', options: [{ v: 2, l: '2個' }, { v: 3, l: '3個' }, { v: 4, l: '4個' }, { v: 5, l: '5個 (全部)' }], def: 3 },
            { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 600, def: 140, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { buried: [], found: { 1: 0, 2: 0 } }; // 埋蔵品の位置と発掘数`],
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 埋蔵品を5箇所に配置 (両対角の内側と中央)
            {
                const q = Math.floor(BOARD_SIZE / 4), m = Math.floor(BOARD_SIZE / 2), r = BOARD_SIZE - 1 - q;
                st = { buried: [q * BOARD_SIZE + q, q * BOARD_SIZE + r, m * BOARD_SIZE + m, r * BOARD_SIZE + q, r * BOARD_SIZE + r], found: { 1: 0, 2: 0 } };
            }`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { buried: [], found: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { buried: [], found: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { buried: [], found: { 1: 0, 2: 0 } };`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 発掘: 埋蔵品マスに石を置いた側が掘り当てる
            {
                const last = move.cells[0];
                const li = last.y * BOARD_SIZE + last.x;
                const bi = st.buried.indexOf(li);
                if (bi >= 0) {
                    st.buried.splice(bi, 1);
                    st.found[player]++;
                    fxBurst(li, '#eab308', 12, 2);
                    fxGlow(li, '#eab308', 900);
                    fxText(li, '埋蔵品!', '#eab308', 1300);
                }
                if (st.found[player] >= Math.min(5, Math.max(1, P('win_digs') || 3))) {
                    winByRule(player, '発掘勝ち', '埋蔵品を' + Math.min(5, Math.max(1, P('win_digs') || 3)) + 'つ掘り当てました'); return;
                }
            }

            // 打ち切り終局
            if (history.length >= Math.max(1, P('ply_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 埋蔵品マスに土中のキラキラを描く
        K.CUE_STARS(`            // 埋蔵品マス: 土色の印と金色の光
            {
                st.buried.forEach(bi => {
                    const bx = bi % BOARD_SIZE, by = Math.floor(bi / BOARD_SIZE);
                    const cx = padding + bx * cellSize, cy = padding + by * cellSize;
                    ctx.save();
                    ctx.fillStyle = 'rgba(120,72,20,0.35)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(234,179,8,0.9)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.22);
                    ctx.lineTo(cx + cellSize * 0.07, cy - cellSize * 0.07);
                    ctx.lineTo(cx + cellSize * 0.22, cy);
                    ctx.lineTo(cx + cellSize * 0.07, cy + cellSize * 0.07);
                    ctx.lineTo(cx, cy + cellSize * 0.22);
                    ctx.lineTo(cx - cellSize * 0.07, cy + cellSize * 0.07);
                    ctx.lineTo(cx - cellSize * 0.22, cy);
                    ctx.lineTo(cx - cellSize * 0.07, cy - cellSize * 0.07);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.restore();
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`'発掘 ' + st.found[1] + '-' + st.found[2]`),
        [K.ONE, K.INFO_BASE, `            発掘碁: 土の印の5マスに石を置いて埋蔵品を掘る。先に3つで発掘勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤下に5つの埋蔵品 (土色の印) が眠る。その上に石を置いた側が掘り当てる。',
            '先に3つ掘り当てれば発掘勝ち。埋蔵品マスは普通の着手点なので攻防と兼ね合いになる。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame(); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('埋蔵品は5つ', st.buried.length === 5);
        const m = Math.floor(BOARD_SIZE / 2);
        assert('中央に埋蔵品', st.buried.includes(m * BOARD_SIZE + m));
        executeMove({ cells: [{ x: m, y: m }] }, 1);
        assert('掘り当てた', st.found[1] === 1 && !st.buried.includes(m * BOARD_SIZE + m));
        st.found = { 1: 2, 2: 0 };
        const next = st.buried[0];
        executeMove({ cells: [{ x: next % BOARD_SIZE, y: Math.floor(next / BOARD_SIZE) }] }, 1);
        assert('3つ目で発掘勝ち', gameOver === true && gameResultData && gameResultData.title.includes('発掘'));
    `,
};
