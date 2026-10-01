// FACTORIZEGO — 素因数碁: 素数番地の交点は「素点」。素点に置くと +1目ボーナス
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 } }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'factorizego.html',
    en: 'FACTORIZEGO',
    jp: '素因数碁',
    prefix: 'factorizego',
    desc: '素数番地は「素点」。素点に置くたび +1目。素点は薄い◆印。',
    kind: 'stone',
    icon: 'factorizego',
    spec: [
        ...K.rb('FACTORIZEGO', '素因数碁', 'factorizego'),
        K.params([
            { key: 'prime_pts', label: '素点ボーナス', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 素数番地の着手は +1目 (両者対象・対称)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 素因数碁: 素数番地に置くと +1目ボーナス
            {
                const __pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                let __isp = st.primes;
                if (!__isp || __isp.length !== board.length) {
                    __isp = Array(board.length).fill(false);
                    for (let i = 2; i < board.length; i++) {
                        let pr = true;
                        for (let d = 2; d * d <= i; d++) if (i % d === 0) { pr = false; break; }
                        __isp[i] = pr;
                    }
                    st.primes = __isp;
                }
                if (__isp[__pi]) {
                    st.bonus[player] = (st.bonus[player] || 0) + (P('prime_pts') || 1);
                    fxText(__pi, '+' + (P('prime_pts') || 1) + ' 素点', '#a78bfa', 900);
                    fxGlow(__pi, '#a78bfa', 700);
                }
            }

            turn = opponent;`],
        // 素点を盤面に薄く描画
        K.CUE_STARS(`            // 素点マーカー: 素数番地に小さな◆
            {
                const __p = (typeof st !== 'undefined' && st.primes) ? st.primes : [];
                ctx.save();
                ctx.fillStyle = 'rgba(139, 92, 246, 0.30)';
                for (let __y = 0; __y < BOARD_SIZE; __y++) for (let __x = 0; __x < BOARD_SIZE; __x++) {
                    const __i = __y * BOARD_SIZE + __x;
                    if (!__p[__i]) continue;
                    const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize, __r = cellSize * 0.10;
                    ctx.beginPath();
                    ctx.moveTo(__cx, __cy - __r);
                    ctx.lineTo(__cx + __r, __cy);
                    ctx.lineTo(__cx, __cy + __r);
                    ctx.lineTo(__cx - __r, __cy);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }`),
        // ボーナスを合計点に加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        ...K.EVENT_CHIP_SPEC(`'素点 +' + ((st.bonus && st.bonus[turn]) || 0) + '目'`),
        [K.ONE, K.INFO_ALGO, `            素因数碁: 素数番地 (◆) に置くたび +1目ボーナス<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤面の交点番地 (0起点) が素数の点は「素点」。どちらが置いても +1目。',
            '素点は薄い◆で表示。約4割の点が素点なので狙いすぎなくても当たる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 } };
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1); // idx 2 は素数
        assert('素点で+1目', st.bonus[1] === 1);
        executeMove({ cells: [{ x: 4, y: 0 }] }, 2); // idx 4 は非素数
        assert('非素点はボーナスなし', st.bonus[2] === 0);
        executeMove({ cells: [{ x: 5, y: 0 }] }, 2); // idx 5 は素数
        assert('白も素点で+1目', st.bonus[2] === 1);
    `,
};
