// PARLEYGO — 交渉碁: 「休戦」を提案し、相手も休戦を押せばその場で境界確定して採点終局
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
const ST_INIT = `{ parley: { 1: false, 2: false } }`;
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
    file: 'parleygo.html',
    en: 'PARLEYGO',
    jp: '交渉碁',
    prefix: 'parleygo',
    desc: '「休戦」を提案し、相手も応じればその場で境界確定。打てば破棄される。',
    kind: 'stone',
    icon: 'parleygo',
    spec: [
        ...K.rb('PARLEYGO', '交渉碁', 'parleygo'),
        ...ST(ST_INIT),
        // 休戦交渉: 双方が休戦を申し込めば境界確定して即採点。着手すると自分の申し出は撤回される
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 双方の休戦が成立していれば境界確定
            if (st.parley[1] && st.parley[2]) {
                fxShake(4, 300);
                endGameByScore();
                return;
            }
            // 着手 = 戦線継続: 自分の休戦申し出は撤回される
            st.parley[player] = false;

            turn = opponent;`],
        // 「休戦」ボタン: 押すと申し出。相手も押せば即終局
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnParley" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-sky-500/50 text-sky-600 rounded-xl hover:bg-sky-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                休戦
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnParley = document.getElementById('btnParley');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnParley.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.parley[turn] = true;
            if (st.parley[1] && st.parley[2]) {
                endGameByScore();
                return;
            }
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`(st.parley[1] ? '黒休戦中 ' : '') + (st.parley[2] ? '白休戦中' : '')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            交渉碁: 「休戦」で停戦を申し込む。相手も休戦を押せば、その時点の盤面で境界確定して採点終局<br>
            PC: クリックで配置 / 「休戦」ボタンで交渉<br>
            スマホ: 同様にボタン操作`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「休戦」ボタンで停戦を申し込む (手番は消費しない)。',
            '相手も「休戦」を押せば、その時点の盤面で境界が確定し即座に採点終局。',
            '自分が着手すると自分の休戦申し出は撤回される。有利か損かの読み合い。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.parley = { 1: false, 2: false };
        st.parley[1] = true;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 2);
        assert('片方だけなら終局しない', gameOver !== true);
        assert('申し出は撤回されず残る', st.parley[1] === true);
        st.parley[2] = true;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('双方の休戦で境界確定', gameOver === true);
        assert('起動して通常着手可', typeof endGameByScore === 'function');
    `,
};
