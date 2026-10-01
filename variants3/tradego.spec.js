// TRADEGO — 交易碁: 盤の4つの港に石を置くと資金+1。2金で「大船石」(2連石)を買える
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
const ST_INIT = `{ gold: { 1: 0, 2: 0 }, armed: { 1: false, 2: false } }`;
// 港セル (盤サイズに比例した4箇所) を計算する挿入関数
const PORTS_FN = `        // 港セル: 盤の四辺中腹に4つの港
        function tradePorts() {
            const m = BOARD_SIZE - 1;
            return [
                [Math.round(0.18 * m), Math.round(0.5 * m)],
                [Math.round(0.82 * m), Math.round(0.5 * m)],
                [Math.round(0.5 * m), Math.round(0.18 * m)],
                [Math.round(0.5 * m), Math.round(0.82 * m)],
            ].map(([x, y]) => y * BOARD_SIZE + x);
        }
`;
module.exports = {
    file: 'tradego.html',
    en: 'TRADEGO',
    jp: '交易碁',
    prefix: 'tradego',
    desc: '4つの港に石を置くと資金+1。2金で2連「大船石」を買える。',
    kind: 'stone',
    icon: 'tradego',
    spec: [
        ...K.rb('TRADEGO', '交易碁', 'tradego'),
        K.params([
            { key: 'port_gold', label: '港ごとの資金', min: 1, max: 4, def: 1, unit: '金' },
            { key: 'ship_cost', label: '大船石の価格', min: 1, max: 6, def: 2, unit: '金' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.75, hint: '交点数比' },
        ]),
        ...ST(ST_INIT),
        // 港座標の計算関数を挿入
        [K.ONE, '        function updateUI() {', PORTS_FN + `
        function updateUI() {`],
        // 港に置くと資金+1 / 大船石 (armed) は2連配置
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 交易: 港に置くと資金+1
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (tradePorts().includes(mi)) {
                    st.gold[player] += (P('port_gold') || 1);
                    fxText(mi, '+1金', '#fbbf24', 1000);
                }
                // 大船石: 購入済みなら隣の空点にもう1石 (生存可能な点のみ)
                if (st.armed[player]) {
                    st.armed[player] = false;
                    for (const nb of getNeighbors(mi)) {
                        if (board[nb] !== 0) continue;
                        board[nb] = player;
                        if (getCapturedStones(board, player).length === 0) {
                            pieces.push({ id: Date.now() + Math.random(), player, type: move.type, rot: move.rot, cells: [{ x: nb % BOARD_SIZE, y: Math.floor(nb / BOARD_SIZE) }] });
                            fxGlow(nb, '#fbbf24', 700);
                            break;
                        }
                        board[nb] = 0;
                    }
                }
            }`],
        // 「大船石を買う」ボタン (2金)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnShip" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-amber-500/50 text-amber-600 rounded-xl hover:bg-amber-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                大船石 (2金)
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnShip = document.getElementById('btnShip');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnShip.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.armed[turn] || st.gold[turn] < (P('ship_cost') || 2)) return;
            st.gold[turn] -= (P('ship_cost') || 2);
            st.armed[turn] = true;
            render();
            updateUI();
        });`],
        ...K.STONE_MARKS_SPEC(`            // 港: 錨のマーク (円+縦棒+鉤)
            {
                ctx.save();
                tradePorts().forEach(i => {
                    if (board[i] === 3) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = 'rgba(30,120,180,0.85)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.055);
                    ctx.beginPath(); ctx.arc(cx, cy - cellSize * 0.16, cellSize * 0.09, 0, Math.PI * 2); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(cx, cy - cellSize * 0.07); ctx.lineTo(cx, cy + cellSize * 0.26); ctx.stroke();
                    ctx.beginPath(); ctx.arc(cx, cy - cellSize * 0.04, cellSize * 0.28, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'金 ' + (st.gold[turn] || 0) + (st.armed[turn] ? ' 大船待機' : '')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            交易碁: 4つの港に石を置くと資金+1。2金で2連「大船石」を買える<br>
            PC: クリックで配置 / 「大船石」ボタンで購入<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の四辺中腹に4つの「港」。自分の石を港に置くと資金が+1貯まる。',
            '「大船石を買う」ボタン (2金): 次の着手で隣の空点にもう1石置ける (2連石)。',
            '港の争奪と資金運用が絡む。両者に同じ港とレート。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        captures = { 1: 0, 2: 0 }; st.gold = { 1: 0, 2: 0 }; st.armed = { 1: false, 2: false };
        const ports = tradePorts();
        assert('港は4箇所', ports.length === 4);
        const px = ports[0] % BOARD_SIZE, py = Math.floor(ports[0] / BOARD_SIZE);
        executeMove({ cells: [{ x: px, y: py }] }, 1);
        assert('港に置くと資金+1', st.gold[1] === 1);
        // 大船石: 購入済みの着手は隣にもう1石
        st.gold[1] = 2; st.armed[1] = true;
        const t2x = 6, t2y = 6;
        executeMove({ cells: [{ x: t2x, y: t2y }] }, 1);
        assert('大船石は2連になる', board[t2y * BOARD_SIZE + t2x] === 1 && getNeighbors(t2y * BOARD_SIZE + t2x).some(n => board[n] === 1));
        assert('購入フラグは消費される', st.armed[1] === false);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
