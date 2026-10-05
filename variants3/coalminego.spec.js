// COALMINEGO — 炭鉱碁: 炭脈に置くと石炭が採れる。3石炭で「爆破」— 最も弱い敵石1個を吹き飛ばす
const K = require('../gen_kit.js');
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
const ST_INIT = `{ coal: { 1: 0, 2: 0 } }`; // 採った石炭
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
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
];
module.exports = {
    file: 'coalminego.html',
    en: 'COALMINEGO',
    jp: '炭鉱碁',
    prefix: 'coalminego',
    desc: '炭脈に置くと石炭+1。3石炭で爆破 — 最も呼吸の浅い敵石1個を吹き飛ばす。',
    kind: 'stone',
    icon: 'coalminego',
    spec: [
        ...K.rb('COALMINEGO', '炭鉱碁', 'coalminego'),
        K.params([
            { key: 'blast_cost', label: '爆破に必要な石炭', min: 1, max: 8, def: 3, unit: '個' },
            { key: 'coal_yield', label: '石炭の採取量', min: 1, max: 3, def: 1, unit: '個/手' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 炭脈: 盤下に走る炭の鉱脈 (斜めのライン上)
        const VEIN_SET = new Set();
        for (let x = 2; x < BOARD_SIZE - 2; x++) {
            const y = Math.round(BOARD_SIZE * 0.78 - x * 0.35);
            if (y >= 1 && y < BOARD_SIZE - 1) VEIN_SET.add(y * BOARD_SIZE + x);
        }
        // 爆破: 3石炭で最も呼吸の浅い敵石1個を吹き飛ばす (手番を1つ消費)
        function coalBlast(player) {
            if (st.coal[player] < (P('blast_cost') || 3)) { fxText((BOARD_SIZE * BOARD_SIZE / 2) | 0, '石炭不足', '#fbbf24', 800); return; }
            const opp = player === 1 ? 2 : 1;
            let best = -1, bestLib = Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== opp) continue;
                const l = getLiberties(board, i);
                if (l < bestLib) { bestLib = l; best = i; }
            }
            if (best < 0) return;
            st.coal[player] -= (P('blast_cost') || 3);
            board[best] = 0;
            captures[player]++;
            fxBurst(best, '#f97316', 16);
            fxShake(7, 420);
            fxText(best, '爆破!', '#f97316', 1100);
            cleanUpPieces();
            consecutivePasses = 0;
            turn = opp;
            updateUI();
            if (gameMode === 'online' && onlineRoomId) syncOnlineState();
            saveState();
            if (!gameOver && gameMode === 'ai' && turn === aiPlayer) triggerAiMove();
        }`],
        // 炭脈に置くと石炭+1
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => {
                const vi = p.y * BOARD_SIZE + p.x;
                if (VEIN_SET.has(vi)) { st.coal[player] += (P('coal_yield') || 1); fxBurst(vi, '#78350f', 10); fxText(vi, '+石炭', '#fbbf24', 900); }
            });`],
        // 「爆破」ボタン (3石炭で最も弱い敵石を吹き飛ばす)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnBlast" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-orange-500/50 text-orange-500 rounded-xl hover:bg-orange-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                爆破 (3石炭)
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnBlast = document.getElementById('btnBlast');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnBlast.textContent = '爆破 (' + (P('blast_cost') || 3) + '石炭)';
        btnBlast.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            coalBlast(turn);
        });`],
        // 炭脈の描画
        K.CUE_GRID(`            // 炭脈: 黒い脈ラインと輝点
            {
                ctx.save();
                VEIN_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillStyle = 'rgba(40, 30, 20, 0.5)';
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                    ctx.fillStyle = 'rgba(250, 180, 60, 0.8)';
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.12, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'石炭 黒' + st.coal[1] + ' / 白' + st.coal[2]`),
        [K.ONE, K.INFO_BASE, `            炭鉱碁: 炭脈に置くと石炭+1。3石炭で「爆破」— 最も弱い敵石を吹き飛ばす<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤下に炭脈が走る。炭脈の点に置くと石炭が1個採れる。',
            '石炭3個で「爆破」ボタン — 最も呼吸の浅い敵石1個を吹き飛ばす (1手消費)。',
            '採掘は手数を使う。脈を押さえるか地を取るか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('炭脈がある', VEIN_SET.size > 3);
        const vi = [...VEIN_SET][0];
        board[vi] = 0;
        executeMove({ cells: [{ x: vi % BOARD_SIZE, y: Math.floor(vi / BOARD_SIZE) }] }, 1);
        assert('炭脈に置くと石炭+1', st.coal[1] === 1);
        st.coal[1] = 3;
        board[I(6, 6)] = 2;
        const t0 = turn;
        coalBlast(1);
        assert('爆破で敵石が飛ぶ', board[I(6, 6)] === 0 && captures[1] === 1);
        assert('爆破は石炭3個消費', st.coal[1] === 0);
    `,
};
