// FIREATTACKGO — 火計碁: 「火計」ボタンで構えた着手は焔石。隣接する敵連を全て焼き払う (各側1回)
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
const ST_INIT = `{ used: { 1: false, 2: false }, arm: { 1: false, 2: false }, burns: { 1: 0, 2: 0 } }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'fireattackgo.html',
    en: 'FIREATTACKGO',
    jp: '火計碁',
    prefix: 'fireattackgo',
    desc: '「火計」ボタンで構えた着手は焔石。隣接する敵連を全て焼き払う (各側1回)。',
    kind: 'stone',
    icon: 'fireattackgo',
    spec: [
        ...K.rb('FIREATTACKGO', '火計碁', 'fireattackgo'),
        K.params([
            { key: 'fire_uses', label: '火計の使用回数', options: [{ v: 1, l: '1回' }, { v: 2, l: '2回' }, { v: 3, l: '3回' }], def: 1 },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 火計ルール: 構え中の着手で隣接する敵連を全て焼き払う (実際に燃やせたときのみ使用済)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 火計: 構え中の着手は焔石 — 隣接する敵連を全て焼き払う
            if (st.arm[player] && !st.used[player]) {
                st.arm[player] = false;
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const seenF = {};
                let burned = 0;
                getNeighbors(mi).forEach(n => {
                    if (board[n] !== opponent || seenF[n]) return;
                    const g = getConnectedGroup(n, opponent);
                    g.forEach(j => { seenF[j] = true; });
                    g.forEach(j => {
                        board[j] = 0;
                        captures[player]++;
                        burned++;
                        fxBurst(j, '#f97316', 10, 1.8);
                        fxBurst(j, '#fbbf24', 5, 1.2);
                    });
                });
                if (burned > 0) {
                    st.burns[player] = (st.burns[player] || 0) + 1;
                    if (st.burns[player] >= Math.max(1, P('fire_uses') || 1)) st.used[player] = true;
                    fxGlow(mi, '#fbbf24', 800);
                    fxShake(9, 420);
                    fxText(mi, '火計! +' + burned, '#fb923c', 1400);
                    cleanUpPieces();
                } else {
                    fxText(mi, '空振りの火種…', '#fbbf24', 900);
                }
            }

            turn = opponent;`],
        // 「火計」ボタン (タッチ操作可)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnFire" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-orange-600/50 text-orange-700 rounded-xl hover:bg-orange-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                火計
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnFire = document.getElementById('btnFire');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnFire.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.used[turn]) return;
            st.arm[turn] = !st.arm[turn];
            render();
            updateUI();
        });`],
        // 燃える兆し: 常時わずかに揺れる Ember
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 火の気配: 盤の縁から時々立ちのぼる火の粉
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let k = 0; k < 6; k++) {
                const t = (now / 3200 + k * 0.31) % 1;
                const fx = pad + ((k * 2.39) % 1) * (BOARD_SIZE - 1) * cs;
                const fy = pad + (BOARD_SIZE - 1) * cs - t * cs * 1.8;
                ctx2.globalAlpha = (1 - t) * 0.5;
                ctx2.fillStyle = k % 2 ? '#fbbf24' : '#f97316';
                ctx2.beginPath();
                ctx2.arc(fx, fy, cs * 0.07, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.used[turn] ? '火計使用済' : (st.arm[turn] ? '火計を放つ…' : '火計あり')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            火計碁: 「火計」ボタンで構えると次の着手は焔石 — 隣接する敵連を全て焼き払う (各側1回)<br>
            PC: 「火計」→クリックで焔石を設置<br>
            スマホ: 同様にボタン→タップ`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「火計」ボタンで構えてから置くと、その着手は焔石。隣接する敵連が全て焼き払われアゲハマになる。',
            '各側1回切りの切り札。敵に隣接して燃えなければ使用済にはならない。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.used = { 1: false, 2: false }; st.arm = { 1: true, 2: false };
        board[4 * BOARD_SIZE + 5] = 2; board[4 * BOARD_SIZE + 6] = 2; // 敵連 (2石)
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 焔石
        assert('敵連が全て燃える', board[4 * BOARD_SIZE + 5] === 0 && board[4 * BOARD_SIZE + 6] === 0);
        assert('焼いた石はアゲハマ', captures[1] === 2);
        assert('使用済になる', st.used[1] === true && st.arm[1] === false);
        st.arm = { 1: false, 2: true };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2); // 敵に隣接しない → 不発
        assert('燃えなければ不発 (使用済にならない)', st.used[2] === false);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
    `,
};
