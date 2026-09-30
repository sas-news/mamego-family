// BANKEDTURNGO — 保留碁: 「貯める」で手番を銀行に預け、「連打」で貯めた分だけ連続着手
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
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
const ST_INIT = `{ bank: { 1: 0, 2: 0 }, burst: { 1: false, 2: false } }`;
module.exports = {
    file: 'bankedturngo.html',
    en: 'BANKEDTURNGO',
    jp: '保留碁',
    prefix: 'bankedturngo',
    desc: '手番を「貯める」で銀行預け。「連打」で貯蓄分だけ連続着手できる。',
    kind: 'stone',
    icon: 'bankedturngo',
    spec: [
        ...K.rb('BANKEDTURNGO', '保留碁', 'bankedturngo'),
        ...ST(ST_INIT),
        // 連打モード: 貯蓄があれば着手後も自分の手番が続く (貯蓄を消費)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 連打: 貯蓄を1つ消費して手番を継続
            if (st.burst[player] && st.bank[player] > 0) {
                st.bank[player]--;
                turn = player;
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '連打!', '#f97316', 900);
            } else {
                turn = opponent;
            }`],
        // 「貯める」(=手番を預けるパス) 「連打」ボタン
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnBank" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-orange-500/50 text-orange-600 rounded-xl hover:bg-orange-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                貯める
            </button>
            <button id="btnBurst" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-red-500/50 text-red-600 rounded-xl hover:bg-red-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                連打
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnBank = document.getElementById('btnBank');
        const btnBurst = document.getElementById('btnBurst');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnBank.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            const p = turn;
            handlePass(); // パスとして手番を渡し、貯蓄に変換
            st.bank[p] = Math.min(9, st.bank[p] + 1);
            updateUI();
        });
        btnBurst.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.burst[turn] = !st.burst[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`'貯蓄 ' + st.bank[turn] + (st.burst[turn] ? ' / 連打中' : '')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            保留碁: 「貯める」で手番を預け、「連打」で貯蓄分だけ連続着手<br>
            PC: クリックで配置 / 「貯める」=パス+預金、「連打」=連続着手モード<br>
            スマホ: 同様にボタン操作`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「貯める」: その手番を放棄する代わりに貯蓄が+1 (上限9)。手番は相手に渡る。',
            '「連打」をONにすると、貯蓄がある限り着手後も自分の手番が続く (1手毎に貯蓄-1)。',
            '貯蓄は1手:1手の等価交換。まとめて打てるタイミング調整のゲーム。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.bank = { 1: 0, 2: 0 }; st.burst = { 1: false, 2: false };
        st.bank[1] = 2; st.burst[1] = true;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('連打で手番が続く', turn === 1);
        assert('貯蓄を消費', st.bank[1] === 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('貯蓄が続く限り連打', turn === 1 && st.bank[1] === 0);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1);
        assert('貯蓄切れで手番交代', turn === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
