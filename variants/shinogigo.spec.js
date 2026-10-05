// SHINOGIGO — シノギ碁: アタリの連をあえて放置して自分の手番を回すとシノギ +1目
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 }, threat: {}, shinogiDone: {} }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'shinogigo.html',
    en: 'SHINOGIGO',
    jp: 'シノギ碁',
    prefix: 'shinogigo',
    desc: 'アタリの連をあえて放置して手番を回すとシノギ +1目 — 救出すれば放棄 (連ごとに1回)。',
    kind: 'stone',
    icon: 'shinogigo',
    spec: [
        ...K.rb('SHINOGIGO', 'シノギ碁', 'shinogigo'),
        K.params([
            { key: 'shinogi_pts', label: 'シノギ得点', min: 0, max: 5, def: 1, unit: '目' },
        ]),
        ...ST(ST_INIT),
        // シノギ: (a) 着手側が呼吸1のまま連を残して手番を回したら +1目 (b) 新たに呼吸1の相手連を脅威登録
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // シノギ碁(a): 呼吸1の連を放置して自分の手番を回すと +1目
            for (const __k of Object.keys(st.threat)) {
                const __r = Number(__k);
                if (board[__r] !== st.threat[__k]) { delete st.threat[__k]; continue; }
                if (st.threat[__k] !== player) continue;
                delete st.threat[__k];
                if (getLiberties(board, __r) <= 1) {
                    st.shinogiDone[__r] = 1;
                    st.bonus[player] = (st.bonus[player] || 0) + (P('shinogi_pts') ?? 1);
                    fxText(__r, 'シノギ +' + (P('shinogi_pts') ?? 1), '#2dd4bf', 1000);
                    fxGlow(__r, '#2dd4bf', 700);
                }
            }
            // シノギ碁(b): 着手の結果、呼吸1になった相手連を脅威として登録
            {
                const __counted = new Set();
                for (let __i = 0; __i < board.length; __i++) {
                    if (board[__i] !== opponent || __counted.has(__i)) continue;
                    const __q = [__i]; const __seen = new Set([__i]); let __root = __i;
                    while (__q.length > 0) {
                        const __c = __q.shift();
                        if (__c < __root) __root = __c;
                        getNeighbors(__c).forEach(__m => {
                            if (board[__m] === opponent && !__seen.has(__m)) { __seen.add(__m); __q.push(__m); }
                        });
                    }
                    __seen.forEach(__c => __counted.add(__c));
                    if (getLiberties(board, __root) <= 1 && !st.shinogiDone[__root]) {
                        st.threat[__root] = opponent;
                    }
                }
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        [K.ONE, K.INFO_BASE, `            シノギ碁: アタリの連を放置して手番を回すと +1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '呼吸点1に追い込まれた連をあえて救出せず、自分の手番を回しきると「シノギ」 +1目。',
            '救出すれば安全だが得点はなし — 危険に手を付けるか、我慢して稼ぐかの駆け引き。連ごとに1回。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, threat: {}, shinogiDone: {} };
        // 白(4,4)を呼吸1に追い込む
        board[4 * BOARD_SIZE + 4] = 2;
        board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1; board[5 * BOARD_SIZE + 4] = 1;
        const G = 4 * BOARD_SIZE + 4;
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1); // 黒の着手で白連が呼吸1 → 脅威登録
        assert('脅威登録される', st.threat[G] === 2);
        executeMove({ cells: [{ x: 9, y: 8 }] }, 2); // 白が救出せず手番を回す → シノギ
        assert('シノギで+1目', st.bonus[2] === 1);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        executeMove({ cells: [{ x: 9, y: 7 }] }, 2); // 同一連は1回のみ
        assert('連ごとに1回のみ', st.bonus[2] === 1);
    `,
};
