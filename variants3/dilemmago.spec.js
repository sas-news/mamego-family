// DILEMMAGO — 囚人碁: 各プレイヤーは協力/裏切りを宣言。12手ごとにペイオフが解決される
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
// stance: 'C'=協力 'D'=裏切り。period: ペイオフ周期 (手数)
const ST_INIT = `{ bonus: { 1: 0, 2: 0 }, stance: { 1: 'C', 2: 'C' }, lastResolve: 0 }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 90) / 100))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'dilemmago.html',
    en: 'DILEMMAGO',
    jp: '囚人碁',
    prefix: 'dilemmago',
    desc: '12手ごとに囚人のジレンマ: 協力/裏切りの組合せで双方にボーナスが出る。',
    kind: 'stone',
    icon: 'dilemmago',
    spec: [
        ...K.rb('DILEMMAGO', '囚人碁', 'dilemmago'),
        K.params([
            { key: 'payoff_cycle', label: '精算の周期', min: 4, max: 30, def: 12, unit: '手' },
            { key: 'coop_pt', label: '協力×協力の得点', min: 0, max: 8, def: 3, unit: '目' },
            { key: 'dd_pt', label: '裏切り×裏切りの得点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'betray_pt', label: '裏切り側の得点', min: 0, max: 10, def: 5, unit: '目' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 90, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        ...ST(ST_INIT),
        // 12手ごとのペイオフ解決: C/C=両者+3、D/D=両者+1、片方D=裏切り側+5・協力側+0
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 囚人のジレンマ: 12手周期で姿勢の組合せを精算
            if (history.length % Math.max(1, P('payoff_cycle') || 12) === 0 && st.lastResolve !== history.length) {
                st.lastResolve = history.length;
                const __b = st.stance[1] === 'D', __w = st.stance[2] === 'D';
                if (!__b && !__w) { const pt = P('coop_pt') ?? 3; st.bonus[1] += pt; st.bonus[2] += pt; }
                else if (__b && __w) { const pt = P('dd_pt') ?? 1; st.bonus[1] += pt; st.bonus[2] += pt; }
                else if (__b) { st.bonus[1] += (P('betray_pt') ?? 5); }
                else { st.bonus[2] += (P('betray_pt') ?? 5); }
                st.stance = { 1: 'C', 2: 'C' };
                const __c = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
                fxText(__c, __b === __w ? '両者' + (__b ? '裏切り' : '協力') + '!' : '裏切り発生!', '#e879f9', 1400);
            }

            turn = opponent;`],
        // 「姿勢」ボタン: 自分の宣言を 協力⇄裏切り で切替 (次の精算まで有効)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnStance" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-fuchsia-500/50 text-fuchsia-600 rounded-xl hover:bg-fuchsia-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                姿勢: 協力
            </button>`],
        [K.ONE, `        const btnPass = document.getElementById('btnPass');`,
`        const btnPass = document.getElementById('btnPass');
        const btnStance = document.getElementById('btnStance');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnStance.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.stance[turn] = st.stance[turn] === 'D' ? 'C' : 'D';
            btnStance.textContent = '姿勢: ' + (st.stance[turn] === 'D' ? '裏切り' : '協力');
            updateUI();
        });`],
        [K.ONE, `            turnIndicator.textContent = turn === 1 ? '黒 (1P)' : '白 (2P)';`,
`            turnIndicator.textContent = turn === 1 ? '黒 (1P)' : '白 (2P)';
            if (btnStance) btnStance.textContent = '姿勢: ' + (st.stance[turn] === 'D' ? '裏切り' : '協力');`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        ...K.EVENT_CHIP_SPEC(`'精算まで ' + ((P('payoff_cycle') || 12) - (history.length % (P('payoff_cycle') || 12))) + '手'`),
        [K.ONE, K.INFO_ALGO, `            囚人碁: 12手ごとに協力/裏切りを精算。「姿勢」ボタンで宣言を切替<br>
            PC: クリックで配置 / 「姿勢」ボタンで協力⇄裏切り<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '12手ごとに両者の「姿勢」が精算される (デフォルトは協力)。',
            '協力×協力 = 両者 +3目。裏切り×裏切り = 両者 +1目。片方だけ裏切り = 裏切り側 +5目・相手 +0。',
            '精算後は両者「協力」に戻る。「姿勢」ボタンで次の精算への宣言を切り替える。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, stance: { 1: 'C', 2: 'C' }, lastResolve: 0 };
        // 12手目で精算が走る (両者協力 → +3ずつ)
        for (let i = 0; i < 11; i++) executeMove({ cells: [{ x: i % BOARD_SIZE, y: (i / BOARD_SIZE) | 0 }] }, i % 2 + 1);
        executeMove({ cells: [{ x: 11, y: 0 }] }, 2);
        assert('12手で協力精算', st.bonus[1] === 3 && st.bonus[2] === 3);
        assert('精算後は協力に戻る', st.stance[1] === 'C' && st.stance[2] === 'C');
        // 裏切りシナリオ: 黒D・白C → 黒+5 白+0
        st.stance = { 1: 'D', 2: 'C' };
        for (let i = 12; i < 23; i++) executeMove({ cells: [{ x: (i + 3) % BOARD_SIZE, y: ((i + 3) / BOARD_SIZE) | 0 + 2 }] }, i % 2 + 1);
        executeMove({ cells: [{ x: 8, y: 2 }] }, 1);
        assert('裏切り側だけ+5', st.bonus[1] === 8 && st.bonus[2] === 3);
    `,
};
