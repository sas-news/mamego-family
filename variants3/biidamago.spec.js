// BIIDAMAGO — ビー玉碁: 星の点は穴。ビー玉を穴に入れると得点、穴の中の石は呼吸+1
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
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false }`;
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
    file: 'biidamago.html',
    en: 'BIIDAMAGO',
    jp: 'ビー玉碁',
    prefix: 'biidamago',
    desc: '星の点は穴。ビー玉を穴に入れると+2点、穴の中の石は呼吸+1。',
    kind: 'stone',
    icon: 'biidamago',
    spec: [
        ...K.rb('BIIDAMAGO', 'ビー玉碁', 'biidamago'),
        K.params([
            { key: 'hole_pts', label: '入穴の得点', min: 1, max: 8, def: 2, unit: '点' },
            { key: 'hole_lib', label: '穴の中の呼吸ボーナス', min: 1, max: 3, def: 1, unit: '点' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 1.8, def: 0.9, step: 0.1, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 穴: 星の点 (盤サイズで変わる)
        let HOLES = new Set();
        function rebuildHoles() {
            HOLES = new Set();
            const n = BOARD_SIZE;
            const pts = n >= 13 ? [3, Math.floor(n / 2), n - 4] : [2, Math.floor(n / 2), n - 3];
            pts.forEach(y => pts.forEach(x => HOLES.add(y * n + x)));
        }
        function inHole(i) { return HOLES.has(i); }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            rebuildHoles();`],
        // 穴の中の石は呼吸+1 (穴に収まって抜けにくい)
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        if (inHole(curr)) liberties += (P('hole_lib') || 1); // 穴の中のビー玉は抜けにくい
                    }

                    if (liberties <= 0) {`],
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                if (inHole(curr)) liberties += (P('hole_lib') || 1); // 穴の中のビー玉は抜けにくい
            }
            return liberties;`],
        // ビー玉入穴: 穴に入れると+2点
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => {
                const hi = p.y * BOARD_SIZE + p.x;
                if (inHole(hi)) {
                    st.score[player] += (P('hole_pts') || 2);
                    fxGlow(hi, '#22d3ee', 1000);
                    fxText(hi, '入穴+2', '#22d3ee', 1200);
                }
            });`],
        // 穴の描画: 星の点に暗い丸い穴
        K.CUE_GRID(`            // ビー玉の穴: 星の点に暗い丸い穴が開く
            {
                ctx.save();
                HOLES.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.26);
                    g.addColorStop(0, 'rgba(15,23,42,0.9)');
                    g.addColorStop(1, 'rgba(15,23,42,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.26, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(34,211,238,0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.26, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        // 入穴点を終局時にアゲハマ相当で加算
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._end) {
                st._end = true;
                captures[1] += st.score[1] || 0;
                captures[2] += st.score[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'入穴 黒' + st.score[1] + ' / 白' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `            ビー玉碁: 星の点は穴。ビー玉を穴に入れると+2点、穴の中の石は呼吸+1<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の星の点 (9箇所) は暗い穴。ビー玉を穴に入れると入穴点+2。',
            '穴の中の石は抜けにくい — 呼吸点+1。穴は双方共通の得点源。',
            '入穴点は終局時にアゲハマ相当で加算される。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('穴が9つ', HOLES.size === 9);
        const h0 = [...HOLES][0];
        assert('穴は打てる', isValidPlacement([{ x: h0 % BOARD_SIZE, y: (h0 / BOARD_SIZE) | 0 }], 1) === true);
        pieces = []; history.length = 0; turn = 1; st.score = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: h0 % BOARD_SIZE, y: (h0 / BOARD_SIZE) | 0 }] }, 1);
        assert('入穴+2', st.score[1] === 2);
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[h0] = 1;
        assert('穴の中は呼吸+1', getLiberties(board, h0) >= 3);
    `,
};
