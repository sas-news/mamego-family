// BORROWTURNGO — 借用碁: 「借用」で2手連続で打てるが、次の相手番は相手も2手連続になる (前借り)
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
const ST_INIT = `{ borrow: { 1: false, 2: false }, debt: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'borrowturngo.html',
    en: 'BORROWTURNGO',
    jp: '借用碁',
    prefix: 'borrowturngo',
    desc: '「借用」で2手連続着手。ただし次の相手番は相手も2手連続になる前借り。',
    kind: 'stone',
    icon: 'borrowturngo',
    spec: [
        ...K.rb('BORROWTURNGO', '借用碁', 'borrowturngo'),
        K.params([
            { key: 'borrow_moves', label: '借用の追加手数', min: 1, max: 3, def: 1 },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        ...ST(ST_INIT),
        // 借用: 自分がもう1手 → その後、債権者 (相手) の番ももう1手続く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 借用中の着手: もう1手指せるが債務が発生。債権者の手番は債務分だけ連続する
            if (st.borrow[player]) {
                st.borrow[player] = (typeof st.borrow[player] === 'number' ? st.borrow[player] : 1) - 1;
                st.debt[player]++;
                turn = player; // 借用した手番: もう1手
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '借用!', '#38bdf8', 900);
            } else if (st.debt[opponent] > 0) {
                st.debt[opponent]--;
                turn = player; // 債権回収: 債権者の番がもう1手続く
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '返済!', '#38bdf8', 900);
            } else {
                turn = opponent;
            }`],
        // 「借用」ボタン (借りは一度に1件まで — 債務中は不可)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnBorrow" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-sky-500/50 text-sky-600 rounded-xl hover:bg-sky-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                借用
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnBorrow = document.getElementById('btnBorrow');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnBorrow.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.debt[turn] > 0 || st.borrow[turn]) return; // 債務中は借用不可
            st.borrow[turn] = P('borrow_moves') || 1;
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`(st.debt[turn] > 0 ? '債務返済中 ' : '') + (st.borrow[turn] ? '借用中' : (st.debt[3 - turn] > 0 ? '債権あり' : ''))`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            借用碁: 「借用」でこの手番がもう1手続く。ただし次の相手番は相手も2手連続 (前借り)<br>
            PC: クリックで配置 / 「借用」ボタンで借用モード<br>
            スマホ: 同様にボタン操作`],
        [K.ONE, K.RV_BASE, K.rv([
            '「借用」をONにして着手すると、もう1手続けて打てる (2手連続)。',
            'ただし借用には債務が付く: 次の相手番で相手も2手連続になる (返済)。',
            '債務中は再借用できない。タイミングを計る等価交換のゲーム。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.borrow = { 1: false, 2: false }; st.debt = { 1: 0, 2: 0 };
        st.borrow[1] = true;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('借用でもう1手', turn === 1);
        assert('債務が発生', st.debt[1] === 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('2手目で手番交代', turn === 2);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2);
        assert('相手の番が債権で続く', turn === 2);
        assert('債務は返済された', st.debt[1] === 0);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 2);
        assert('返済後は通常交代', turn === 1);
    `,
};
