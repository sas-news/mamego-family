// FOODCHAINGO — 捕食碁: 石は草→虫→鳥→獣の順に供給され、置いた石は隣の下位の敵石を喰う (草は獣を分解)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= (P('cap_moves') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
const TIER_COLORS = ['#65a30d', '#a16207', '#0284c7', '#dc2626'];
module.exports = {
    file: 'foodchaingo.html',
    en: 'FOODCHAINGO',
    jp: '捕食碁',
    prefix: 'foodchaingo',
    desc: '石は草→虫→鳥→獣の順に供給。置いた石は隣の下位の敵石を喰う。',
    kind: 'stone',
    icon: 'foodchaingo',
    spec: [
        ...K.rb('FOODCHAINGO', '捕食碁', 'foodchaingo'),
        K.params([
            { key: 'cap_moves', label: '打ち切り手数', min: 50, max: 400, def: 150, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { cnt: { 1: 0, 2: 0 }, tier: {} }; // 各プレイヤーの着手数・石の階層 (0草 1虫 2鳥 3獣)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { cnt: { 1: 0, 2: 0 }, tier: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { cnt: { 1: 0, 2: 0 }, tier: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { cnt: { 1: 0, 2: 0 }, tier: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { cnt: { 1: 0, 2: 0 }, tier: {} };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 捕食: 供給された階層の石は、隣接する下位階層の敵石を全て喰う
            {
                const NAMES = ['草', '虫', '鳥', '獣'];
                const EATS = [3, 0, 1, 2]; // 草は獣を分解、虫は草、鳥は虫、獣は鳥を喰う
                st.cnt[player]++;
                const p = move.cells[0];
                const li = p.y * BOARD_SIZE + p.x;
                const tier = (st.cnt[player] - 1) % 4;
                st.tier[li] = tier;
                const eaten = [];
                getNeighbors(li).forEach(n => {
                    if (board[n] === opponent && st.tier[n] === EATS[tier]) eaten.push(n);
                });
                eaten.forEach(n => {
                    board[n] = 0;
                    captures[player]++;
                    delete st.tier[n];
                    fxBurst(n, '#84cc16', 9, 1.6);
                });
                if (eaten.length) {
                    fxText(li, NAMES[tier] + 'が捕食!', '#84cc16', 1100);
                    cleanUpPieces();
                }
                // 死んだ石の階層情報を掃除
                Object.keys(st.tier).forEach(i => { if (board[i] === 0) delete st.tier[i]; });
            }

            turn = opponent;`],
        // 階層マーク: 草=緑点 虫=茶点 鳥=青点 獣=赤環
        ...K.STONE_MARKS_SPEC(`            // 捕食石の階層マーク
            {
                const TC = ${JSON.stringify(TIER_COLORS)};
                ctx.save();
                Object.keys(st.tier || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const mx = i % BOARD_SIZE, my = Math.floor(i / BOARD_SIZE);
                    const cx = padding + mx * cellSize, cy = padding + my * cellSize;
                    const t = st.tier[i];
                    if (t === 3) {
                        ctx.strokeStyle = TC[t];
                        ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                        ctx.stroke();
                    } else {
                        ctx.fillStyle = TC[t];
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * (0.09 + t * 0.02), 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`['次は草','次は虫','次は鳥','次は獣'][(st.cnt[turn] || 0) % 4]`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            捕食碁: 石は草→虫→鳥→獣の順に供給。隣の下位の敵石を喰う<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の着手は草→虫→鳥→獣の順で供給される (石のマークが階層)。',
            '置いた石は隣接する1つ下の階層の敵石を全て喰う: 獣は鳥を、鳥は虫を、虫は草を、草は獣を分解する。',
            '通常の取りも有効。食物連鎖の巡りを読んで上位階層で襲いかかれ。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { cnt: { 1: 0, 2: 0 }, tier: {} };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);      // 黒1: 草
        executeMove({ cells: [{ x: 4, y: 3 }] }, 2);      // 白1: 草
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);      // 黒2: 虫
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2);      // 白2: 虫
        assert('階層が記録される', st.tier[I(4, 4)] === 1 && st.tier[I(0, 0)] === 0);
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);      // 黒3: 鳥 → 隣の白虫を捕食
        assert('鳥が虫を喰う', board[I(4, 4)] === 0 && captures[1] === 1);
        assert('捕食した鳥は生きる', board[I(4, 5)] === 1 && st.tier[I(4, 5)] === 2);
        board.fill(0); st = { cnt: { 1: 0, 2: 0 }, tier: {} };
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
    `,
};
