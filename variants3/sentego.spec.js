// SENTEGO — 先手碁: アタリをかけた側が「先手」を握り、次の自着手が +2目
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 }, sente: 0 }`;
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
    file: 'sentego.html',
    en: 'SENTEGO',
    jp: '先手碁',
    prefix: 'sentego',
    desc: 'アタリをかけた側が先手権を握る。先手権を持って打つ次の一手は +2目。',
    kind: 'stone',
    icon: 'sentego',
    spec: [
        ...K.rb('SENTEGO', '先手碁', 'sentego'),
        ...ST(ST_INIT),
        // 先手権: アタリ作成で獲得、先手権を持つ着手は +2目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 先手碁: 先手権を持つ側の着手は +2目。アタリ作成で先手権を奪取
            {
                const __pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (st.sente === player) {
                    st.bonus[player] = (st.bonus[player] || 0) + 2;
                    st.sente = 0; // 先手権を消費
                    fxText(__pi, '先手の効き +2', '#fb923c', 1100);
                    fxGlow(__pi, '#fb923c', 800);
                }
                // アタリ (呼吸1の敵連) を作った側が先手権を握る
                const __opp = opponent;
                let __atari = false;
                const __seenG = new Set();
                getNeighbors(__pi).forEach(__n => {
                    if (board[__n] !== __opp || __seenG.has(__n)) return;
                    const __q = [__n]; const __seen = new Set([__n]); let __root = __n;
                    while (__q.length > 0) {
                        const __c = __q.shift();
                        if (__c < __root) __root = __c;
                        getNeighbors(__c).forEach(__m => {
                            if (board[__m] === __opp && !__seen.has(__m)) { __seen.add(__m); __q.push(__m); }
                        });
                    }
                    __seenG.add(__root);
                    if (getLiberties(board, __root) <= 1) __atari = true;
                });
                if (__atari) st.sente = player;
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        ...K.EVENT_CHIP_SPEC(`st.sente ? (st.sente === 1 ? '先手権:黒' : '先手権:白') : ''`),
        [K.ONE, K.INFO_ALGO, `            先手碁: アタリで先手権を獲得、先手権の着手は +2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '相手の連をアタリにした側が「先手権」を握る。',
            '先手権を持って打つ次の一手は +2目 — 主導権を握り続けるほど得する。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, sente: 0 };
        // 白石(4,4)の呼吸点を2つに絞る
        board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1;
        board[4 * BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // アタリ → 先手権獲得
        assert('アタリで先手権', st.sente === 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1); // 先手権の着手
        assert('先手権の着手で+2目', st.bonus[1] === 2 && st.sente === 0);
        executeMove({ cells: [{ x: 9, y: 1 }] }, 2); // 先手権なし
        assert('先手権なしは無ボーナス', st.bonus[2] === 0);
    `,
};
