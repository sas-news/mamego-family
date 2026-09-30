// TOSSENGO — 投扇碁: 扇 (石) を的に近づけて投げる遊び。8手ごとに的に最も近い石の持ち主が+1目
const K = require('../gen_kit.js');
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
const ST_INIT = `{ fan: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'tossengo.html',
    en: 'TOSSENGO',
    jp: '投扇碁',
    prefix: 'tossengo',
    desc: '的に最も近い石の持ち主が、8手ごとの審判で+1目を得る投扇興。',
    kind: 'stone',
    icon: 'tossengo',
    spec: [
        ...K.rb('TOSSENGO', '投扇碁', 'tossengo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 的: 中央の縦筋の上下2箇所
        const MATO_PTS = (() => {
            const m = Math.floor(BOARD_SIZE / 2);
            const mc = Math.floor(BOARD_SIZE / 4);
            return [mc * BOARD_SIZE + m, (BOARD_SIZE - 1 - mc) * BOARD_SIZE + m];
        })();`],
        // 審判: 8手ごとに的に最も近い石の持ち主が+1目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 投扇興: 8手ごとに的への最近石を審判
            if (history.length > 0 && history.length % 8 === 0) {
                MATO_PTS.forEach(mp => {
                    const mx = mp % BOARD_SIZE, my = (mp / BOARD_SIZE) | 0;
                    let best = -1, bestD = 1e9;
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] !== 1 && board[i] !== 2) continue;
                        const dx = Math.abs(i % BOARD_SIZE - mx);
                        const dy = Math.abs((i / BOARD_SIZE | 0) - my);
                        if (dx + dy < bestD) { bestD = dx + dy; best = i; }
                    }
                    if (best >= 0) {
                        st.fan[board[best]]++;
                        fxGlow(best, '#f59e0b', 800);
                        fxText(best, '的中!', '#f59e0b', 1100);
                    }
                });
            }

            turn = opponent;`],
        // 加点
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 投扇ルール: 審判の加点
            territory.black += st.fan[1];
            territory.white += st.fan[2];`],
        // 的の描画: 朱い的
        K.CUE_STARS(`            // 的: 朱い円形の的マーク
            {
                ctx.save();
                MATO_PTS.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(220, 38, 38, 0.8)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.36, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.10, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'審判まで ' + (8 - (history.length % 8)) + ' 手 / 的 黒' + (st.fan ? st.fan[1] : 0) + ' 白' + (st.fan ? st.fan[2] : 0)`),
        [K.ONE, K.INFO_ALGO, `            投扇碁: 8手ごとの審判で的に最も近い石の持ち主が+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央に2つの「的」がある (朱い円)。8手ごとの審判で、的に最も近い石の持ち主が+1目を得る。',
            '審判のたびに扇を投げ合う。的の近くを制しながら地も稼ぐ二兎追い。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('的は2箇所', MATO_PTS.length === 2);
        board.fill(0); pieces = []; history.length = 0; st.fan = { 1: 0, 2: 0 };
        const mp = MATO_PTS[0];
        const mx = mp % BOARD_SIZE, my = (mp / BOARD_SIZE) | 0;
        board[I(mx - 1, my)] = 1; // 的の隣に黒
        board[I(0, BOARD_SIZE - 1)] = 2; // 遠くに白
        history.push({}, {}, {}, {}, {}, {}, {});
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // history=8 → 審判
        assert('的に近い黒が加点', st.fan[1] >= 1);
        assert('遠い白は加点なし', st.fan[2] === 0);
        board.fill(0); pieces = []; history.length = 0;
        assert('通常着手は合法', isValidPlacement([{ x: 2, y: 2 }], 1) === true);
    `,
};
