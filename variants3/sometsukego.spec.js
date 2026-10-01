// SOMETSUKEGO — 青花碁: 盤に染付の文様点。白地に呉須(敵)を取り囲むと文様が描けて得点
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'sometsukego.html',
    en: 'SOMETSUKEGO',
    jp: '青花碁',
    prefix: 'sometsukego',
    desc: '文様点を敵石で彩ると+2目。染付文様は終局まで青く残る。',
    kind: 'stone',
    icon: 'sometsukego',
    spec: [
        ...K.rb('SOMETSUKEGO', '青花碁', 'sometsukego'),
        K.params([
            { key: 'motif_pts', label: '文様点1個の呉須ボーナス', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 染付の文様点: 盤上の8点 (回転対称の花菱)
        function isMotifPoint(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            const c = (BOARD_SIZE - 1) / 2;
            const pts = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            const r = Math.round(c * 0.6);
            for (const [dx, dy] of pts) {
                if (x === Math.round(c + dx * r) && y === Math.round(c + dy * r)) return true;
            }
            const cr = Math.round(c * 0.9);
            if (x === Math.round(c - cr) && y === Math.round(c - cr)) return true;
            if (x === Math.round(c + cr) && y === Math.round(c - cr)) return true;
            if (x === Math.round(c - cr) && y === Math.round(c + cr)) return true;
            if (x === Math.round(c + cr) && y === Math.round(c + cr)) return true;
            return false;
        }`],
        // 文様の色づき: 文様点の敵石を取るごとに+2目ボーナス — 取り時に加算
        [K.ONE, `            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;`,
`            if (captured.length > 0) {
                let mot = 0;
                captured.forEach(idx => { if (isMotifPoint(idx)) mot++; board[idx] = 0; });
                captures[player] += captured.length + mot * (P('motif_pts') ?? 2);
                if (mot > 0) fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '染付 +' + (mot * (P('motif_pts') ?? 2)), '#1d4ed8', 1200);`],
        // 文様点の青い花菱を描く
        K.CUE_GRID(`            // 染付の文様点: 青い花菱の印
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(29,78,216,0.55)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                for (let i = 0; i < board.length; i++) {
                    if (!isMotifPoint(i)) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const r = cellSize * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
                    ctx.closePath(); ctx.stroke();
                    ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2); ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            青花碁: 盤上の文様点 (青い花菱) にある敵石を取ると1個につき追加+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤には染付の文様点 (青い花菱) が8ヶ所。',
            '文様点の上にある敵石を捕ると、1個につき追加で+2目の呉須ボーナス。',
            '文様を描くために敵を文様点へ誘い込め — 青花の器を彩る得点戦。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const c = (BOARD_SIZE - 1) / 2;
        const mp = Math.round(c - Math.round(c * 0.9)) * BOARD_SIZE + Math.round(c - Math.round(c * 0.9));
        assert('文様点が検出される', isMotifPoint(mp) === true);
        assert('中心は文様点でない', isMotifPoint(I(6, 6)) === false);
        // 文様点上の敵石は周囲を埋めると取れる
        board.fill(0);
        board[mp] = 2;
        for (const n of getNeighbors(mp)) board[n] = 1;
        assert('文様点の敵石は取られる', getCapturedStones(board, 2).includes(mp));
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
