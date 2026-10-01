// CANDLEGO — 蝋燭碁: 石は蝋燭。灯り(隣の空点)が1つしか無い孤立の蝋燭は12手ごとの風で燃え尽きる
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
const ST_INIT = `{ ply: 0 }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'candlego.html',
    en: 'CANDLEGO',
    jp: '蝋燭碁',
    prefix: 'candlego',
    desc: '石は蝋燭。灯り(隣の空点)が1つしか無い孤立の蝋燭は、12手ごとの風で燃え尽きる。',
    kind: 'stone',
    icon: 'candlego',
    spec: [
        ...K.rb('CANDLEGO', '蝋燭碁', 'candlego'),
        K.params([
            { key: 'wind_every', label: '風の間隔', min: 4, max: 30, def: 12, unit: '手' },
            { key: 'wind_max', label: '風で燃える各軍の本数', min: 1, max: 4, def: 1 },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.9, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 灯り判定: 隣接する空点の数 (蝋燭の火が灯る範囲)
        function lightCount(i) {
            return getNeighbors(i).filter(n => board[n] === 0).length;
        }
        // 孤立判定: 同じ色の隣が無い1石の蝋燭
        function isLone(i, v) {
            return !getNeighbors(i).some(n => board[n] === v);
        }`],
        // 燃え尽き: 12手ごとに灯りが1つしか無い孤立の蝋燭が各軍1本ずつ燃え尽きる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 風: 12手ごとに灯り1つの孤立蝋燭が各軍1本まで燃え尽きる
            st.ply++;
            if (st.ply % (P('wind_every') || 12) === 0) {
                let blown = 0;
                const wmax = Math.max(1, P('wind_max') || 1);
                [1, 2].forEach(v => {
                    let n = 0;
                    for (let i = 0; i < board.length && n < wmax; i++) {
                        if (board[i] !== v) continue;
                        if (isLone(i, v) && lightCount(i) <= 1) {
                            board[i] = 0;
                            captures[v === 1 ? 2 : 1]++;
                            blown++; n++;
                            fxSplash(i, '#f59e0b', 9);
                            fxText(i, '燃え尽き', '#fb923c', 1100);
                        }
                    }
                });
                if (blown > 0) {
                    pieces = pieces.filter(pc => pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === pc.player));
                    fxShake(3, 240);
                }
            }

            turn = opponent;`],
        // 蝋燭の灯り: 空点に隣接する石は炎の輪を帯びる
        ...K.STONE_MARKS_SPEC(`            // 灯りのある蝋燭: 小さな炎の輪が灯る
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    if (lightCount(i) < 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(251,146,60,0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.045);
                    ctx.beginPath();
                    ctx.ellipse(cx, cy - cellSize * 0.30, cellSize * 0.08, cellSize * 0.13, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'風まで ' + ((P('wind_every') || 12) - (st.ply % (P('wind_every') || 12))) + '手'`),
        [K.ONE, K.INFO_ALGO, `            蝋燭碁: 石は蝋燭。灯り(隣の空点)が1つしか無い孤立石は12手ごとの風で燃え尽きる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は蝋燭。隣接する空点 (灯り) が2つ以上あれば燃え続け、石の周りに炎の輪が灯る。',
            '12手ごとの風で、灯りが1つしか無い孤立石 (隣に同じ色の石も無い) が各軍1本ずつ燃え尽きる。',
            '孤立した隙だらけの蝋燭は風に弱い。風の間隔はチップで読める。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('灯り判定', lightCount(I(5, 5)) === 4);
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.ply = 0;
        // 灯り1つの孤立白: 3方を黒で囲み1方だけ空ける (まだ取られない)
        board[I(6, 6)] = 2;
        board[I(5, 6)] = 1; board[I(7, 6)] = 1; board[I(6, 5)] = 1;
        assert('孤立白の灯りは1', lightCount(I(6, 6)) === 1 && isLone(I(6, 6), 2));
        st.ply = 11;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 12手目の風
        assert('風で燃え尽きる', board[I(6, 6)] === 0 && captures[1] === 1);
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.ply = 11;
        board[I(6, 6)] = 2; // 灯りのある孤立白 (周囲は空)
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('灯りがあれば燃えない', board[I(6, 6)] === 2);
    `,
};
