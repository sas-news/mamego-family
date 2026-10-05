// FEINTGO — 囮碁: 各1回「おとり」を使うと、その着手は幻の囮石になり4手後に消える
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
const ST_INIT = `{ armed: { 1: false, 2: false }, used: { 1: false, 2: false }, decoys: {} }`;
module.exports = {
    file: 'feintgo.html',
    en: 'FEINTGO',
    jp: '囮碁',
    prefix: 'feintgo',
    desc: '各1回「おとり」で幻の囮石を置ける。4手後に跡形もなく消える。',
    kind: 'stone',
    icon: 'feintgo',
    spec: [
        ...K.rb('FEINTGO', '囮碁', 'feintgo'),
        K.params([
            { key: 'decoy_ttl', label: '囮石が消えるまでの手数', min: 1, max: 16, def: 4, unit: '手' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 囮石: 配置時に記録 (見た目・性質は通常石と同じ)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 囮: 「おとり」で置いた石は記録され、4手後に幻のように消える
            if (st.armed[player]) {
                st.armed[player] = false;
                st.used[player] = true;
                const di = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.decoys[di] = history.length;
                fxText(di, 'おとり', '#e879f9', 1000);
            }`],
        // 4手経った囮石は消える
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 囮石の消滅: 配置から4手経つと消える
            Object.keys(st.decoys || {}).forEach(k => {
                const i = +k;
                if (history.length - st.decoys[i] >= Math.max(1, P('decoy_ttl') || 4) && (board[i] === 1 || board[i] === 2)) {
                    board[i] = 0;
                    fxText(i, '消えた!', '#e879f9', 1000);
                    delete st.decoys[i];
                    cleanUpPieces();
                }
                if (board[i] !== 1 && board[i] !== 2) delete st.decoys[i];
            });

            turn = opponent;`],
        // 「おとり」ボタン (各1回)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnDecoy" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-fuchsia-500/50 text-fuchsia-600 rounded-xl hover:bg-fuchsia-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                おとり
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnDecoy = document.getElementById('btnDecoy');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnDecoy.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.used[turn]) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.used[turn] ? 'おとり済' : (st.armed[turn] ? 'おとり待機' : 'おとり可')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            囮碁: 各1回「おとり」で幻の囮石を置ける。4手後に消える<br>
            PC: クリックで配置 / 「おとり」ボタンで囮モード<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '「おとり」ボタンを押してから置くと、その石は「囮石」になる (各1回・通常の1手)。',
            '囮石は見た目も性質も通常石と同じだが、配置から4手経つと跡形もなく消える。',
            '相手が囮を本気で攻めれば手数を稼げる。取られても4手以内に消えれば同じ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.armed = { 1: false, 2: false }; st.used = { 1: false, 2: false }; st.decoys = {};
        st.armed[1] = true;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('囮石が記録される', st.decoys[5 * BOARD_SIZE + 5] !== undefined);
        assert('見た目は通常石', board[5 * BOARD_SIZE + 5] === 1);
        history.length = st.decoys[5 * BOARD_SIZE + 5] + 4;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('4手後に消える', board[5 * BOARD_SIZE + 5] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 0 }], 1) === true);
    `,
};
