// FUKANGO — 封緘碁: 8手ごとの石は蝋印 — 隣の空点を封じ、誰も打てなくなる。封じた点は持ち主の得点
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
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
const ST_INIT = `{ cnt: { 1: 0, 2: 0 }, seals: {} }`; // seals: 蝋印石 idx → 持ち主
module.exports = {
    file: 'fukango.html',
    en: 'FUKANGO',
    jp: '封緘碁',
    prefix: 'fukango',
    desc: '8手ごとの石は蝋印 — 隣の空点を封じて打てなくする。封じた点は持ち主の得点。印を取れば開封。',
    kind: 'stone',
    icon: 'fukango',
    spec: [
        ...K.rb('FUKANGO', '封緘碁', 'fukango'),
        K.params([
            { key: 'seal_interval', label: '蝋印の間隔', min: 2, max: 30, def: 8, unit: '手' },
            { key: 'seal_pts', label: '封印点1つの得点', min: 0.1, max: 2, step: 0.1, def: 0.5, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        ...ST(ST_INIT),
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            st.cnt[player]++;`],
        // 蝋印: 8手ごとの石は印になる — 隣の空点は封じられて誰も打てない
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 封緘碁: 8手ごとの石は蝋印 — 印が取られたら封も解ける
            if (st.cnt[player] % Math.max(1, P('seal_interval') || 8) === 0) {
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (board[ci] === player) {
                    st.seals[ci] = player;
                    fxGlow(ci, '#ef4444', 900);
                    fxText(ci, '封緘!', '#fca5a5', 1100);
                }
            }
            Object.keys(st.seals).forEach(k => {
                if (board[+k] !== st.seals[k]) delete st.seals[k]; // 印が消えれば封も解ける
            });

            turn = opponent;`],
        // 封じられた空点には着手不可 (どちらの蝋印でも封じる)
        [K.ONE, `            if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;`,
`            if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            if (getNeighbors(p.y * BOARD_SIZE + p.x).some(n => st.seals[n] !== undefined && board[n] === st.seals[n])) return false; // 封緘`],
        [K.ONE, `        function endGameByScore() {`,
`        // 封緘の得点: 封じた空点は持ち主+0.5目 (両者の印が接する点は折半)
        function fukanBonus(player) {
            let b = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) continue;
                const owners = new Set();
                getNeighbors(i).forEach(n => {
                    if (st.seals[n] !== undefined && board[n] === st.seals[n]) owners.add(st.seals[n]);
                });
                if (owners.size === 1 && owners.has(player)) b += (P('seal_pts') || 0.5);
                else if (owners.size === 2) b += (P('seal_pts') || 0.5) / 2;
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + fukanBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + fukanBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>封緘の得点:</span> <strong>黒 \${fukanBonus(1)} / 白 \${fukanBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...K.STONE_MARKS_SPEC(`            // 蝋印: 印の石に赤い蝋、封じた空点に薄い蝋痕
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    if (st.seals[i] !== undefined && board[i] === st.seals[i]) {
                        ctx.fillStyle = 'rgba(220,38,38,0.85)';
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.18, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (board[i] === 0 && getNeighbors(i).some(n => st.seals[n] !== undefined && board[n] === st.seals[n])) {
                        ctx.fillStyle = 'rgba(220,38,38,0.30)';
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.10, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            封緘碁: 8手ごとの石は蝋印 — 隣の空点を封じて誰も打てなくする。封じた点は持ち主+0.5目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '8手ごとに置く石は蝋印になる。蝋印に隣接する空点は封じられて誰も着手できず、終局時に印の持ち主+0.5目。',
            '蝋印の石が取られると封は解ける。両者同じ周期で印が出る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.cnt = { 1: 0, 2: 0 }; st.seals = {};
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        for (let i = 0; i < 7; i++) executeMove({ cells: [{ x: i, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 8手目 → 蝋印
        assert('8手目は蝋印になる', st.seals[4 * BOARD_SIZE + 4] === 1);
        assert('封じた空点は着手不可', isValidPlacement([{ x: 5, y: 4 }], 2) === false);
        assert('離れた点は打てる', isValidPlacement([{ x: 9, y: 9 }], 2) === true);
        assert('封じた点は+0.5目', fukanBonus(1) >= 0.5);
        board[4 * BOARD_SIZE + 4] = 0; // 印が消える
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('印が消えれば開封', isValidPlacement([{ x: 5, y: 4 }], 1) === true);
    `,
};
