// TEMIZUGO — 手水碁: 上下辺中央の手水舎で手を清めると、つながる自石すべてが清められ終局に+1/石
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ clean: {} }`;
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
module.exports = {
    file: 'temizugo.html',
    en: 'TEMIZUGO',
    jp: '手水碁',
    prefix: 'temizugo',
    desc: '上下辺中央は手水舎。そこに打つとつながる自石すべてが清められ、終局に1石ごと+1点。',
    kind: 'stone',
    icon: 'temizugo',
    spec: [
        ...K.rb('TEMIZUGO', '手水碁', 'temizugo'),
        K.params([
            { key: 'purify', label: '清められた石1個あたりの得点', min: 0, max: 5, def: 1, unit: '点' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.75, hint: '交点数比' },
        ]),
        ...ST(ST_INIT),
        // 手水舎一覧ヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 手水舎: 上下辺の中央
        function temizuBasins() {
            const m = Math.floor(BOARD_SIZE / 2);
            return [m, (BOARD_SIZE - 1) * BOARD_SIZE + m];
        }

        function endGameByScore() {`],
        // 採点に清められた石を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            let cleanB = 0, cleanW = 0;
            for (const k in st.clean) {
                const i = +k;
                if (board[i] === st.clean[k]) { if (board[i] === 1) cleanB += (P('purify') ?? 1); else cleanW += (P('purify') ?? 1); }
            }
            const blackTotal = territory.black + captures[1] + cleanB;
            const whiteTotal = territory.white + captures[2] + komi + cleanW;`],
        // 手水: 手水舎に打つと連全体が清められる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 手水: 手水舎への着手で、そこからつながる自石すべてを清める
            {
                const cell = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (temizuBasins().includes(cell) && board[cell] === player) {
                    const seen = new Set([cell]), stack = [cell], g = [cell];
                    while (stack.length) {
                        getNeighbors(stack.pop()).forEach(nb => {
                            if (!seen.has(nb) && board[nb] === player) { seen.add(nb); g.push(nb); stack.push(nb); }
                        });
                    }
                    g.forEach(i => { st.clean[i] = player; });
                    g.forEach(i => fxGlow(i, '#7dd3fc', 700));
                    fxText(cell, '清め +' + g.length, '#38bdf8', 1300);
                }
            }

            turn = opponent;`],
        // 手水舎に水盤を、清められた石に滴を描く
        ...K.STONE_MARKS_SPEC(`            // 手水: 手水舎の水盤と清められた石の滴
            {
                const now = fxNow();
                ctx.save();
                temizuBasins().forEach(i => {
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(56,189,248,0.9)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.34, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(125,211,252,0.5)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.2, 0, Math.PI * 2);
                    ctx.fill();
                });
                for (const k in st.clean) {
                    const i = +k;
                    if (board[i] !== st.clean[k]) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(125,211,252,' + (0.7 + 0.3 * Math.sin(now / 400 + i)) + ')';
                    ctx.beginPath();
                    ctx.arc(cx, cy - cellSize * 0.18, cellSize * 0.09, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            手水碁: 上下辺中央は手水舎。そこに打つとつながる自石すべてが清められ終局に+1/石<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の上下辺の中央は手水舎。手水舎に石を置くと、その石からつながる自分の連すべてが清められる。',
            '清められた石には滴の印が付き、終局時に盤上に残っていれば1石ごと+1点。取られた石は徳にならない。',
            '手水舎は双方が使える。後から連に石を足しても清めは広がらない — もう一度手水舎に打つ必要がある。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE; const m = Math.floor(B / 2);
        st.clean = {};
        const basins = temizuBasins();
        assert('手水舎は2か所', basins.length === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[B + m] = 1; board[B + m + 1] = 1; // 上辺手水舎の下に黒連
        executeMove({ cells: [{ x: m, y: 0 }] }, 1); // 手水舎に打つ
        assert('連全体が清められる', st.clean[m] === 1 && st.clean[B + m] === 1 && st.clean[B + m + 1] === 1);
        board[B + m] = 0; // 取られると清めは残るが得点対象外
        assert('清め印は残る', st.clean[B + m] === 1);
        board[(B - 2) * B + m] = 2;
        executeMove({ cells: [{ x: m, y: B - 1 }] }, 2); // 下辺手水舎
        assert('白も下辺で清められる', st.clean[(B - 1) * B + m] === 2 && st.clean[(B - 2) * B + m] === 2);
    `,
};
