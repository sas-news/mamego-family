// LACQUERGO — 漆器碁: 石は漆器。6手ごとに塗りが重なり、3重で打たれても取れない堅さになる
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
const ST_INIT = `{ coat: {} }`; // idx -> 漆の塗り重ね数
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
    file: 'lacquergo.html',
    en: 'LACQUERGO',
    jp: '漆器碁',
    prefix: 'lacquergo',
    desc: '漆の塗りが6手ごとに重なる。3重に塗り上がった石は堅く、二度と取られない。',
    kind: 'stone',
    icon: 'lacquergo',
    spec: [
        ...K.rb('LACQUERGO', '漆器碁', 'lacquergo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 漆の塗り: 6手ごとに全石が1重ずつ塗り重ねられる。3重で不動の堅さ
        const LACQ_MAX = 3;
        function lacqArmored(i) { return (st.coat[i] || 0) >= LACQ_MAX; }`],
        // 塗り上がった石は取り判定から外れる
        [K.ONE, `                if (boardState[i] === player && !visited[i]) {`,
`                if (boardState[i] === player && !visited[i] && !lacqArmored(i)) {`],
        [K.ALL, `} else if (boardState[n] === player && !visited[n]) {`,
`} else if (boardState[n] === player && !visited[n] && !lacqArmored(n)) {`],
        // 6手ごとの塗り重ね
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 漆器碁: 6手ごとに全ての石が一塗りされる
            if (history.length > 0 && history.length % 6 === 0) {
                for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                    if (board[i] === 1 || board[i] === 2) {
                        if (!lacqArmored(i)) {
                            st.coat[i] = (st.coat[i] || 0) + 1;
                            if (lacqArmored(i)) { fxGlow(i, '#fbbf24', 700); fxText(i, '艶出!', '#fbbf24', 900); }
                        }
                    } else if (st.coat[i]) delete st.coat[i];
                }
            }

            turn = opponent;`],
        // 塗り重ねの輪
        ...K.STONE_MARKS_SPEC(`            // 漆の塗り: 重ねごとに金の輪が増える
            Object.keys(st.coat).forEach(k => {
                const i = +k;
                if (board[i] !== 1 && board[i] !== 2) return;
                const n = Math.min(LACQ_MAX, st.coat[i]);
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = n >= LACQ_MAX ? 'rgba(251, 191, 36, 0.95)' : 'rgba(202, 138, 4, 0.7)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                for (let r = 0; r < n; r++) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * (0.16 + r * 0.09), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            });`),
        ...K.EVENT_CHIP_SPEC(`'艶出石 ' + Object.keys(st.coat).filter(k => lacqArmored(+k)).length + '個'`),
        [K.ONE, K.INFO_ALGO, `            漆器碁: 6手ごとに塗りが重なり、3重で取れなくなる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は6手ごとに漆を一塗りされる (金の輪が増える)。',
            '3重に塗り上がった石は「艶出」となり二度と取られない — 両者同じ速さ。',
            '若い石のうちに取るか、塗り上がるまで逃げ切るか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        st.coat = {};
        // 6手で一塗り
        board.fill(0); pieces = []; history.length = 0;
        board[I(3, 3)] = 1;
        for (let k = 0; k < 6; k++) executeMove({ cells: [{ x: k % BOARD_SIZE, y: BOARD_SIZE - 1 }] }, 1);
        assert('6手で一塗り', (st.coat[I(3, 3)] || 0) >= 1);
        // 3重で艶出
        st.coat[I(3, 3)] = LACQ_MAX;
        getNeighbors(I(3, 3)).forEach(n => { if (board[n] !== 1 || n === I(3, 3)) board[n] = 2; });
        assert('艶出の石は取られない', !getCapturedStones(board, 1).includes(I(3, 3)));
        // 未塗りの石は取られる
        st.coat = {};
        getNeighbors(I(3, 3)).forEach(n => board[n] = 2);
        assert('未塗りは普通に取れる', getCapturedStones(board, 1).includes(I(3, 3)));
    `,
};
