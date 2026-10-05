// EXCHANGEGO — 両替碁: 「両替」で自石1個を最大3個に分解できる (1手を消費)
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
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
const ST_INIT = `{ armed: { 1: false, 2: false } }`;
module.exports = {
    file: 'exchangego.html',
    en: 'EXCHANGEGO',
    jp: '両替碁',
    prefix: 'exchangego',
    desc: '「両替」で自石1個を最大3個に分解。呼吸点の確保に役立つ。',
    kind: 'stone',
    icon: 'exchangego',
    spec: [
        ...K.rb('EXCHANGEGO', '両替碁', 'exchangego'),
        K.params([
            { key: 'split_extra', label: '両替の追加石数', min: 1, max: 4, def: 2, unit: '個' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 「両替」ボタン → 自石クリックで分解 (1手を消費 = 着手として実行)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnExch" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-amber-500/50 text-amber-600 rounded-xl hover:bg-amber-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                両替
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnExch = document.getElementById('btnExch');`],
        // 両替モード中は自石クリックで分解: その点+隣接空点(最大2)に自石を配置する着手として実行
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 両替モード: 自石をクリックすると最大3個に分解 (1手を消費)
            if (st.armed[turn]) {
                st.armed[turn] = false;
                const gx = Math.round(anchor.u), gy = Math.round(anchor.v);
                const gi = gy * BOARD_SIZE + gx;
                if (gi >= 0 && gi < board.length && board[gi] === turn) {
                    const free = getNeighbors(gi).filter(n => board[n] === 0);
                    if (free.length > 0) {
                        const cells = [{ x: gx, y: gy }]
                            .concat(free.slice(0, Math.max(1, P('split_extra') || 2)).map(n => ({ x: n % BOARD_SIZE, y: Math.floor(n / BOARD_SIZE) })));
                        executeMove({ cells: cells, type: currentPieceType, rot: 0 }, turn);
                        fxText(gi, '両替!', '#f59e0b', 1100);
                    } else {
                        fxText(gi, '空きがない', '#ef4444', 900);
                    }
                }
                render();
                updateUI();
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnExch.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.armed[turn] ? '両替: 自石を選んで' : ''`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            両替碁: 「両替」ボタン→自石をクリックで1個を最大3個に分解 (1手を消費)<br>
            PC: クリックで配置 / 「両替」→自石をクリック<br>
            スマホ: 同様にボタン→石をタップ`],
        [K.ONE, K.RV_BASE, K.rv([
            '「両替」ボタンを押してから自分の石をクリックすると、その石は分解される。',
            '元の石の位置+隣接する空点 (最大2点) に新しい石が置かれる。1手を消費する。',
            '呼吸点が少ない連の延命や、薄い地の補強に使える。両者同じ条件で何度でも可。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.armed = { 1: false, 2: false };
        board[4 * BOARD_SIZE + 4] = 1; // 両替元の黒石
        // 両替をシミュレート: (4,4) の石を分解 → (4,4)+隣接空点2点に着手
        const free = getNeighbors(4 * BOARD_SIZE + 4).filter(n => board[n] === 0);
        const cells = [{ x: 4, y: 4 }].concat(free.slice(0, 2).map(n => ({ x: n % BOARD_SIZE, y: Math.floor(n / BOARD_SIZE) })));
        executeMove({ cells: cells, type: 'STONE', rot: 0 }, 1);
        assert('分解で3石になる', cells.length === 3 && board[4 * BOARD_SIZE + 4] === 1);
        assert('隣接に新石が置かれる', free.slice(0, 2).every(n => board[n] === 1));
        assert('着手で手番が進む', turn === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
