// GLASSWAREGO — 硝子碁: 硝子の石は透明で位置が読めない。8手で曇り、色が確定する
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
// clear[idx] = 置いたときの手数。8手経つと曇って確定する
const ST_INIT = `{ clear: {} }`;
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
    file: 'glasswarego.html',
    en: 'GLASSWAREGO',
    jp: '硝子碁',
    prefix: 'glasswarego',
    desc: '硝子の石は置いてから8手の間「透明」: 取れず、隣の敵連に呼吸を見せる。',
    kind: 'stone',
    icon: 'glasswarego',
    spec: [
        ...K.rb('GLASSWAREGO', '硝子碁', 'glasswarego'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 硝子: 透明期 (8手) の石。敵にも味方にも「空点」に見える
        const GLASS_FOG = 8;
        function glassClear(i) { return st.clear[i] !== undefined; }`],
        // 着いた石は透明になる
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => { st.clear[p.y * BOARD_SIZE + p.x] = history.length; });`],
        // 透明な石は取り判定から外れる
        [K.ONE, `                if (boardState[i] === player && !visited[i]) {`,
`                if (boardState[i] === player && !visited[i] && !glassClear(i)) {`],
        [K.ALL, `} else if (boardState[n] === player && !visited[n]) {`,
`} else if (boardState[n] === player && !visited[n] && !glassClear(n)) {`],
        // 透明な石はどの連にも「空点」に見える (呼吸が読めない)
        [K.ALL, `                            if (boardState[n] === 0 && !deadMask[n]) {`,
`                            if ((boardState[n] === 0 || glassClear(n)) && !deadMask[n]) {`],
        [K.ONE, `                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;`,
`                    if ((boardState[n] === 0 || glassClear(n)) && !deadMask[n]) {
                        liberties++;`],
        // 毎手、透明期を過ぎた石が曇る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 硝子碁: 透明期 (8手) を過ぎた石が曇って確定する
            Object.keys(st.clear).forEach(k => {
                if (history.length - st.clear[k] >= GLASS_FOG || board[k] === 0) {
                    if (board[k] !== 0) { fxGlow(+k, '#93c5fd', 600); fxText(+k, '曇り', '#93c5fd', 800); }
                    delete st.clear[k];
                }
            });

            turn = opponent;`],
        // 透明な石の描画: 薄い輪郭だけ
        ...K.STONE_MARKS_SPEC(`            // 透明な石: 硝子の輪郭と光の筋
            Object.keys(st.clear).forEach(k => {
                const i = +k;
                if (board[i] !== 1 && board[i] !== 2) return;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(220, 240, 255, 0.9)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.36, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.moveTo(cx - cellSize * 0.18, cy - cellSize * 0.24);
                ctx.lineTo(cx - cellSize * 0.02, cy - cellSize * 0.1);
                ctx.stroke();
                ctx.restore();
            });`),
        ...K.EVENT_CHIP_SPEC(`Object.keys(st.clear).length + ' 透明'`),
        [K.ONE, K.INFO_ALGO, `            硝子碁: 硝子の石は8手の間「透明」。曇ると確定する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着いたばかりの石は8手の間「透明」(白い輪郭)。',
            '透明な石は取れない — その代わり、隣の敵連にも「空点」に見えて呼吸を与えてしまう。',
            '8手経つと曇って色が確定。透明の間だけ自殺点にも置ける。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        st.clear = {};
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('着いた石は透明', glassClear(I(0, 0)));
        // 透明な石は取られない
        board.fill(0); st.clear = { [I(1, 1)]: history.length };
        board[I(1, 1)] = 1;
        getNeighbors(I(1, 1)).forEach(n => board[n] = 2);
        assert('透明な石は取られない', !getCapturedStones(board, 1).includes(I(1, 1)));
        // 敵連には空点に見える: 白石の唯一の呼吸が透明石なら生きている
        board.fill(0); st.clear = { [I(1, 1)]: history.length };
        board[I(1, 1)] = 1; board[I(2, 1)] = 2;
        board[I(1, 0)] = 1; board[I(1, 2)] = 1; board[I(2, 0)] = 1; board[I(2, 2)] = 1; board[I(3, 1)] = 1;
        assert('透明石は呼吸に見える', getCapturedStones(board, 2).length === 0);
        // 曇ると確定する
        board.fill(0); pieces = []; history.length = 0; st.clear = {};
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        st.clear[I(0, 0)] = history.length - GLASS_FOG - 1;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2);
        assert('8手で曇る', !glassClear(I(0, 0)) && glassClear(I(1, 0)));
    `,
};
