// IAIDOGO — 居合碁: 各者1回の「抜刀」。抜刀手は四方の直線上で最初に出会う敵石を斬り落とす
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
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
module.exports = {
    file: 'iaidogo.html',
    en: 'IAIDOGO',
    jp: '居合碁',
    prefix: 'iaidogo',
    desc: '各者1回の「抜刀」。抜刀手は四方の直線上で最初に出会う敵石を斬って取る。',
    kind: 'stone',
    icon: 'iaidogo',
    spec: [
        ...K.rb('IAIDOGO', '居合碁', 'iaidogo'),
        K.params([
            { key: 'blade_mode', label: '抜刀の届き', options: [{ v: 'first', l: '最初の敵石のみ' }, { v: 'all', l: '直線上の全敵石' }], def: 'first' },
        ]),
        ...ST('{ iai: { 1: 0, 2: 0 } }'),
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnIai" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-amber-500/50 text-amber-600 rounded-xl hover:bg-amber-500/10 active:scale-95 transition-all shadow-sm">
                抜刀
            </button>`],
        [K.ONE, `        const btnPass = document.getElementById('btnPass');`,
`        const btnPass = document.getElementById('btnPass');
        const btnIai = document.getElementById('btnIai');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        // 居合碁: 抜刀は各者1回 — 次の着手で四方の敵を斬る
        btnIai.addEventListener('click', () => {
            if (gameOver || st.iai[turn] !== 0) return;
            st.iai[turn] = 1;
            btnIai.textContent = '抜刀構え';
            fxShake();
        });`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 居合碁: 抜刀が構えられていれば四方の最初の敵石を斬る
            {
                if (st.iai[player] === 1) {
                    st.iai[player] = 2;
                    const mx = move.cells[0].x, my = move.cells[0].y;
                    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => {
                        let x = mx + d[0], y = my + d[1];
                        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
                            const t = y * BOARD_SIZE + x;
                            if (board[t] !== 0) {
                                if (board[t] === opponent) {
                                    board[t] = 0;
                                    captures[player]++;
                                    fxBurst(t, '#fbbf24', 16);
                                    fxText(t, '斬', '#f59e0b', 1100);
                                    if ((P('blade_mode') || 'first') === 'all') { x += d[0]; y += d[1]; continue; }
                                }
                                break;
                            }
                            x += d[0]; y += d[1];
                        }
                    });
                    fxShake();
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC('(st.iai[1] === 0 ? "黒抜刀可" : st.iai[1] === 1 ? "黒抜刀構" : "黒抜刀済") + " / " + (st.iai[2] === 0 ? "白抜刀可" : st.iai[2] === 1 ? "白抜刀構" : "白抜刀済")'),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            居合碁: 「抜刀」ボタンは各者1回。次の着手で四方の最初の敵石を斬る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '「抜刀」ボタンで抜刀を構える (各者1回)。構えた次の着手は四方の直線を斬る。',
            '各方向で最初に出会う敵石を斬り落としてアゲハマにする (味方は刃を止める)。',
            '敵連のど真ん中を両断する決定打。撃つ手を逃さないこと。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st = { iai: { 1: 0, 2: 0 } };
        board[I(4, 4)] = 2; // (4,2)の下の直線上の敵
        st.iai[1] = 1; // 抜刀を構える
        executeMove({ cells: [{ x: 4, y: 2 }] }, 1);
        assert('直線上の敵を斬る', board[I(4, 4)] === 0 && captures[1] === 1);
        assert('抜刀は使い切り', st.iai[1] === 2);
        assert('相手の抜刀は温存', st.iai[2] === 0);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 2回目は発動しない
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
