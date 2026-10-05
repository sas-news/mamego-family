// DEFERGO — 延期碁: 着手を延期して貯蓄。貯蓄には着手毎に利子が付き、3点で1手の引出連打ができる
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 75) / 100))) {
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
const ST_INIT = `{ save: { 1: 0, 2: 0 }, burst: { 1: false, 2: false } }`;
module.exports = {
    file: 'defergo.html',
    en: 'DEFERGO',
    jp: '延期碁',
    prefix: 'defergo',
    desc: '着手を延期して貯蓄。利子が付き、貯蓄3点で1手の引出連打ができる。',
    kind: 'stone',
    icon: 'defergo',
    spec: [
        ...K.rb('DEFERGO', '延期碁', 'defergo'),
        K.params([
            { key: 'save_max', label: '貯蓄の上限', min: 4, max: 30, def: 12, unit: '点' },
            { key: 'draw_cost', label: '引出の消費点', min: 1, max: 6, def: 3, unit: '点' },
            { key: 'defer_gain', label: '預けるの貯蓄', min: 1, max: 5, def: 2, unit: '点' },
            { key: 'interest', label: '利子', min: 0, max: 3, def: 1, unit: '点' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        ...ST(ST_INIT),
        // 利子: 自分の着手ごとに貯蓄+1 (上限12)。引出モード中は貯蓄3点で手番継続
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 延期の利子: 着手ごとに貯蓄+1 (上限12)
            st.save[player] = Math.min((P('save_max') || 12), st.save[player] + (P('interest') ?? 1));

            // 引出: 貯蓄3点を消費して手番を継続
            if (st.burst[player] && st.save[player] >= (P('draw_cost') || 3)) {
                st.save[player] -= (P('draw_cost') || 3);
                turn = player;
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '引出!', '#34d399', 900);
            } else {
                turn = opponent;
            }`],
        // 「預ける」(延期=パス+貯蓄2点) 「引出」ボタン
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnDefer" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-emerald-500/50 text-emerald-600 rounded-xl hover:bg-emerald-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                預ける
            </button>
            <button id="btnDraw" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-teal-500/50 text-teal-600 rounded-xl hover:bg-teal-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                引出
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnDefer = document.getElementById('btnDefer');
        const btnDraw = document.getElementById('btnDraw');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnDefer.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            const p = turn;
            handlePass(); // 延期 = パス + 貯蓄2点
            st.save[p] = Math.min((P('save_max') || 12), st.save[p] + (P('defer_gain') || 2));
            updateUI();
        });
        btnDraw.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.burst[turn] = !st.burst[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`'貯蓄 ' + st.save[turn] + '/' + (P('save_max') || 12) + (st.burst[turn] ? ' / 引出中' : '')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            延期碁: 「預ける」で着手を延期し貯蓄。着手毎に利子が付き、3点で1手を引出せる<br>
            PC: クリックで配置 / 「預ける」=延期+貯蓄、「引出」=連打モード<br>
            スマホ: 同様にボタン操作`],
        [K.ONE, K.RV_BASE, K.rv([
            '「預ける」: その手番を延期して貯蓄+2 (上限12)。手番は相手に渡る。',
            '自分が着手するたび貯蓄に利子+1。普通に打ち続けても貯まる。',
            '「引出」をONにすると、貯蓄3点を消費するごとにもう1手続けて打てる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.save = { 1: 0, 2: 0 }; st.burst = { 1: false, 2: false };
        st.save[1] = 5; st.burst[1] = true;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('利子+1後に3点消費', st.save[1] === 3); // 5+1-3=3
        assert('引出で手番が続く', turn === 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('利子+1で4点→3点消費→1点', st.save[1] === 1); // 3+1-3=1
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1);
        assert('貯蓄不足で通常交代', turn === 2);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('利子は相手にも付く', st.save[2] === 1);
        assert('白の後は黒番', turn === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
