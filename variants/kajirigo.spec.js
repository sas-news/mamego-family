// KAJIRIGO — 祝由碁: 「祝由」で次の着手に呪力を込める。着手点に隣接する弱った敵連 (呼吸≤2) を祓う (各側1回)
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
const ST_INIT = `{ used: { 1: false, 2: false }, armed: { 1: false, 2: false } }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kajirigo.html',
    en: 'KAJIRIGO',
    jp: '祝由碁',
    prefix: 'kajirigo',
    desc: '「祝由」で次の着手に呪力。隣接する弱った敵連 (呼吸≤2) を祓う (各側1回)。',
    kind: 'stone',
    icon: 'kajirigo',
    spec: [
        ...K.rb('KAJIRIGO', '祝由碁', 'kajirigo'),
        K.params([
            { key: 'exor_libs', label: '祓える連の最大呼吸', min: 1, max: 4, def: 2 },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 祝由の祓い: 着点に隣接する敵連で呼吸2以下のものを除去 (1回の着手につき1連まで)
        function exorcise(player, ci) {
            const opponent = player === 1 ? 2 : 1;
            const seen = new Set();
            for (const n of getNeighbors(ci)) {
                if (board[n] !== opponent || seen.has(n)) continue;
                const grp = getConnectedGroup(n, opponent);
                grp.forEach(g => seen.add(g));
                if (getLiberties(board, n) <= (P('exor_libs') || 2)) {
                    grp.forEach(g => { board[g] = 0; captures[player]++; fxBurst(g, '#c4b5fd', 8, 1.4); });
                    fxText(ci, '祓!', '#a78bfa', 1200);
                    fxShake(4, 300);
                    cleanUpPieces();
                    return true;
                }
            }
            return false;
        }`],
        // 呪力発動: 祓える対象がいる時のみ消費
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (st.armed[player] && !st.used[player]) {
                st.armed[player] = false;
                if (exorcise(player, move.cells[0].y * BOARD_SIZE + move.cells[0].x)) st.used[player] = true;
            }

            turn = opponent;`],
        // 「祝由」ボタン
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnKajiri" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-violet-500/50 text-violet-600 rounded-xl hover:bg-violet-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                祝由
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnKajiri = document.getElementById('btnKajiri');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        if (btnKajiri) btnKajiri.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.used[turn]) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.used[turn] ? '祝由済' : (st.armed[turn] ? '呪力充填中' : '祝由可')`),
        [K.ONE, K.INFO_BASE, `            祝由碁: 「祝由」で次の着手に呪力を込める。隣接する弱った敵連 (呼吸≤2) を祓う (各側1回)<br>
            PC: クリックで配置 / 「祝由」→着手で発動<br>
            スマホ: 同様にボタン→タップ`],
        [K.ONE, K.RV_BASE, K.rv([
            '「祝由」ボタンで次の着手に呪力を込める。着点に隣接する敵の連で呼吸点2以下のものを1連だけ祓う (消滅しアゲハマに)。',
            '健な連 (呼吸3以上) は祓えない。対象がなければ呪力は残る (消費されない)。',
            '各側1回切りの奥の手 — 敵の大病巣を一撃で祓う。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.used = { 1: false, 2: false }; st.armed = { 1: true, 2: false };
        // 呼吸2の敵連: (5,5)(5,6) — 周囲を囲み残る呼吸は (6,6)(5,7)
        board[I(5, 5)] = 2; board[I(5, 6)] = 2;
        board[I(5, 4)] = 1; board[I(4, 5)] = 1; board[I(6, 5)] = 1; board[I(4, 6)] = 1;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 敵連に隣接して着手 → 祓い発動
        assert('祝由を消費', st.used[1] === true);
        assert('弱った敵連は祓われる', board[I(5, 5)] === 0 && board[I(5, 6)] === 0);
        assert('祓いはアゲハマに', captures[1] === 2);
        // 健な連は祓えない: 呼吸3以上
        board.fill(0); pieces = []; history.length = 0; captures = { 1: 0, 2: 0 };
        st.used = { 1: false, 2: false }; st.armed = { 1: true, 2: false };
        board[I(5, 5)] = 2; // 呼吸4の健康な連
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        assert('健な連は祓えず呪力は残る', st.used[1] === false && board[I(5, 5)] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
