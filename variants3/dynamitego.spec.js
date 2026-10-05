// DYNAMITEGO — 爆破解碁: 「点火」ボタンで次の着手がダイナマイトになる。着弾点の3x3を爆破 (各側1回)
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
const ST_INIT = `{ used: { 1: false, 2: false }, armed: { 1: false, 2: false } }`;
module.exports = {
    file: 'dynamitego.html',
    en: 'DYNAMITEGO',
    jp: '爆破解碁',
    prefix: 'dynamitego',
    desc: '「点火」で次の着手がダイナマイト化。着弾3x3の石を全て吹き飛ばす (各側1回)。',
    kind: 'stone',
    icon: 'dynamitego',
    spec: [
        ...K.rb('DYNAMITEGO', '爆破解碁', 'dynamitego'),
        K.params([
            { key: 'blast_r', label: '爆破半径', min: 1, max: 2, def: 1, hint: '1=3x3、2=5x5' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        ...ST(ST_INIT),

        // 起爆: armed状態で置いた石は3x3を爆破する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 爆破解碁: 点火済みの着手はダイナマイト — 着弾3x3を爆破 (各側1回)
            if (st.armed[player] && !st.used[player]) {
                st.armed[player] = false;
                st.used[player] = true;
                const bc = move.cells[0];
                const ci = bc.y * BOARD_SIZE + bc.x;
                fxGlow(ci, '#fbbf24', 700);
                fxShake(8, 380);
                fxText(ci, 'BOOM!', '#fb923c', 900);
                const br = P('blast_r') || 1;
                for (let dy = -br; dy <= br; dy++) {
                    for (let dx = -br; dx <= br; dx++) {
                        const nx = bc.x + dx, ny = bc.y + dy;
                        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                        const i0 = ny * BOARD_SIZE + nx;
                        fxBurst(i0, '#f97316', 10, 1.8);
                        fxBurst(i0, '#fbbf24', 5, 1.2);
                        if (board[i0] === opponent) captures[player]++;
                        board[i0] = 0;
                    }
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        // 「点火」ボタン
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnIgnite" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-orange-500/50 text-orange-600 rounded-xl hover:bg-orange-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                点火
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnIgnite = document.getElementById('btnIgnite');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnIgnite.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.used[turn]) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.used[turn] ? '爆破済' : (st.armed[turn] ? '点火中!' : '点火可')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            爆破解碁: 「点火」ボタンで次の着手がダイナマイト化。着弾3x3の石を全て吹き飛ばす (各側1回)<br>
            PC: クリックで配置 / 「点火」→着手で爆破<br>
            スマホ: 同様にボタン→タップ`],
        [K.ONE, K.RV_BASE, K.rv([
            '「点火」ボタンを押すと次の着手がダイナマイトになる。着弾点の3x3の石を全て吹き飛ばす。',
            '敵石はアゲハマに。自分の石やダイナマイト自身も巻き込む。各側1回切り。',
            '点火は次の着手まで有効。解除して様子見もできる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.used = { 1: false, 2: false }; st.armed = { 1: true, 2: false };
        board[4 * BOARD_SIZE + 5] = 2; board[4 * BOARD_SIZE + 3] = 2; // (5,4)と(3,4)
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1); // 爆破
        assert('爆破済みになる', st.used[1] === true);
        assert('範囲内の敵石は消滅', board[4 * BOARD_SIZE + 5] === 0 && board[4 * BOARD_SIZE + 3] === 0);
        assert('敵石はアゲハマに', captures[1] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
