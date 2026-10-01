// HIJACKGO — 逆手碁: 相手が打ちたい点を先に指定。そこに打たれると隣に反撃の石を置ける
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
const ST_INIT = `{ trap: { 1: -1, 2: -1 }, armed: { 1: false, 2: false } }`;
module.exports = {
    file: 'hijackgo.html',
    en: 'HIJACKGO',
    jp: '逆手碁',
    prefix: 'hijackgo',
    desc: '相手の着手点を先に指定。そこに打たれると隣接へ反撃の石を無料で置ける。',
    kind: 'stone',
    icon: 'hijackgo',
    spec: [
        ...K.rb('HIJACKGO', '逆手碁', 'hijackgo'),
        K.params([
            { key: 'counter_count', label: '反撃で置ける石の数', min: 1, max: 3, def: 1, unit: '個' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.3, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 逆手: 相手が仕掛けた点に打つと、隣接空点に反撃の自石を無料で配置
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 逆手発動: 仕掛けた側 (=着手した側の相手) の点なら隣接空点に反撃石を無料で置く
            {
                const ti = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if ((st.trap[3 - player] || -1) === ti) {
                    st.trap[3 - player] = -1;
                    const free = getNeighbors(ti).filter(n => board[n] === 0);
                    if (free.length > 0) {
                        free.slice(0, Math.max(1, P('counter_count') || 1)).forEach(ci => {
                            board[ci] = 3 - player; // 仕掛けた側の反撃石
                            fxText(ci, '逆手!', '#fb923c', 1200);
                        });
                        fxBurst(ti, '#fb923c', 10, 1.8);
                    } else {
                        // 反撃の余地がない (四方敵石) — 相手の石ごと捕まえる
                        board[ti] = 0;
                        captures[3 - player]++;
                        fxText(ti, '完全逆手!', '#f43f5e', 1200);
                    }
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 「逆手」ボタン → 空点クリックで仕掛け (1手を消費)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnTrap" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-orange-500/50 text-orange-600 rounded-xl hover:bg-orange-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                逆手
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnTrap = document.getElementById('btnTrap');`],
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 逆手モード: 空点をクリックして仕掛け (1手を消費 = 手番を渡す)
            if (st.armed[turn]) {
                st.armed[turn] = false;
                const gi = Math.round(anchor.v) * BOARD_SIZE + Math.round(anchor.u);
                if (gi >= 0 && gi < board.length && board[gi] === 0) {
                    st.trap[turn] = gi;
                    fxGlow(gi, '#fb923c', 800);
                    handlePass(); // 仕掛けは1手を消費
                }
                render();
                updateUI();
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnTrap.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.trap[turn] >= 0 ? '逆手仕掛け中' : (st.armed[turn] ? '仕掛け点を選んで' : '')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            逆手碁: 「逆手」→空点をクリックで仕掛け (1手を消費)。相手が打てば隣に反撃石<br>
            PC: クリックで配置 / 「逆手」→点をクリック<br>
            スマホ: 同様にボタン→点をタップ`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「逆手」ボタン→空点をクリックで、相手が打ちそうな点に仕掛ける (1手を消費)。',
            '相手がその点に着手すると、隣接する空点に反撃の自石を無料で置ける。',
            '四方が敵石で反撃の余地がなければ、相手の石ごと捕まえる (完全逆手)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.trap = { 1: -1, 2: -1 }; st.armed = { 1: false, 2: false };
        // 黒が (6,6) に逆手を仕掛ける
        st.trap[1] = 6 * BOARD_SIZE + 6;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2); // 仕掛けた点に着手 → 反撃発動
        assert('相手の石は置かれる', board[6 * BOARD_SIZE + 6] === 2);
        const counter = getNeighbors(6 * BOARD_SIZE + 6).filter(n => board[n] === 1);
        assert('隣に反撃の黒石', counter.length === 1);
        assert('仕掛けは消費される', st.trap[1] === -1);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 0 }], 1) === true);
    `,
};
