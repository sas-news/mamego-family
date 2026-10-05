// TAGGO — 組手碁: 左の手・右の手のタッグ戦。Lの手は左半分・Rの手は右半分にしか打てない
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
const ST_INIT = `{ hand: { 1: 'L', 2: 'L' }, swapped: {} }`;
module.exports = {
    file: 'taggo.html',
    en: 'TAGGO',
    jp: '組手碁',
    prefix: 'taggo',
    desc: '左の手(L)・右の手(R)のタッグ戦。Lは左半分・Rは右半分にしか打てない (中央列は共用)。',
    kind: 'stone',
    icon: 'taggo',
    spec: [
        ...K.rb('TAGGO', '組手碁', 'taggo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2, def: 0.75, step: 0.1, hint: '交点数の倍率' },
        ]),
        ...ST(ST_INIT),
        // 組手: 現在の「手」で打てる範囲が決まる (L→左半分・R→右半分・中央列は共用)
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function isValidPlacement(cells, player) {
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const hand = (st.hand || {})[player] || 'L';
                for (const p of cells) {
                    if (hand === 'L' && p.x > c) return false;
                    if (hand === 'R' && p.x < c) return false;
                }
            }`],
        // 着手ごとに手を交替
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 組手: 着手ごとにL⇄Rの手が交替し、タッグ交代権も復活する
            st.hand[player] = st.hand[player] === 'L' ? 'R' : 'L';
            st.swapped = {};

            turn = opponent;`],
        // 「タッグ」ボタン: 1手番に1回、出す手をL⇄R入れ替えられる
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnTag" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-cyan-500/50 text-cyan-600 rounded-xl hover:bg-cyan-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                タッグ
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnTag = document.getElementById('btnTag');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnTag.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if ((st.swapped || {})[turn]) return;
            st.swapped[turn] = true;
            st.hand[turn] = st.hand[turn] === 'L' ? 'R' : 'L';
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`'手 ' + ((st.hand || {})[turn] || 'L') + ((st.hand || {})[turn] === 'L' ? '(左半分)' : '(右半分)')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            組手碁: Lの手は左半分・Rの手は右半分にしか打てないタッグ戦 (中央列は共用)<br>
            PC: クリックで配置 / 「タッグ」ボタンで手を入れ替え<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分のチームは「左の手(L)」と「右の手(R)」の2人組。着手ごとに手が交替する。',
            'Lは盤の左半分・Rは右半分にしか打てない (中央列は共用)。',
            '「タッグ」ボタンで1手番に1回、出す手を入れ替えられる (パートナーに手を渡す)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.hand = { 1: 'L', 2: 'L' }; st.swapped = {};
        const c = Math.floor(BOARD_SIZE / 2);
        assert('Lの手は右半分に打てない', isValidPlacement([{ x: c + 1, y: 0 }], 1) === false);
        assert('Lの手は左半分に打てる', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('着手で手が交替', st.hand[1] === 'R');
        assert('Rの手は左端に打てない', isValidPlacement([{ x: 0, y: 1 }], 1) === false);
        assert('Rの手は右半分に打てる', isValidPlacement([{ x: BOARD_SIZE - 1, y: 1 }], 1) === true);
    `,
};
