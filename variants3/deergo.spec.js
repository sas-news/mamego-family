// DEERGO — 鹿苑碁: 星の上の石は鹿。角のある鹿は単独で襲いかかる敵石を跳ね返す
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
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'deergo.html',
    en: 'DEERGO',
    jp: '鹿苑碁',
    prefix: 'deergo',
    desc: '星の上の石は角のある鹿。単独で鹿に隣接した敵石は角で跳ね返される。',
    kind: 'stone',
    icon: 'deergo',
    spec: [
        ...K.rb('DEERGO', '鹿苑碁', 'deergo'),
        // 鹿苑ルール: 星の上の石は鹿 — 孤立した敵石が隣に置かれると角で跳ね返す
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 鹿苑: 星の上の敵石(鹿)に孤立して隣接すると角で跳ね返される
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const stillOnBoard = board[mi] === player;
                const isolated = getNeighbors(mi).every(i => board[i] !== player);
                if (stillOnBoard && isolated) {
                    const stars = getStarPoints(BOARD_SIZE);
                    const deer = stars.some(pt => board[pt.y * BOARD_SIZE + pt.x] === opponent &&
                        getNeighbors(mi).includes(pt.y * BOARD_SIZE + pt.x));
                    if (deer) {
                        board[mi] = 0;
                        captures[opponent]++;
                        fxBurst(mi, '#a3e635', 12, 1.7);
                        fxText(mi, '角で跳ね返された!', '#a3e635', 1200);
                        fxShake(4, 280);
                        cleanUpPieces();
                    }
                }
            }

            turn = opponent;`],
        // 鹿の印: 星の上の石に角マーク
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                getStarPoints(BOARD_SIZE).forEach(pt => {
                    const i = pt.y * BOARD_SIZE + pt.x;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + pt.x * cellSize;
                    const cy = padding + pt.y * cellSize;
                    ctx.strokeStyle = '#d9a02c';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.16, cy - cellSize * 0.12);
                    ctx.lineTo(cx - cellSize * 0.26, cy - cellSize * 0.34);
                    ctx.moveTo(cx - cellSize * 0.21, cy - cellSize * 0.24);
                    ctx.lineTo(cx - cellSize * 0.32, cy - cellSize * 0.28);
                    ctx.moveTo(cx + cellSize * 0.16, cy - cellSize * 0.12);
                    ctx.lineTo(cx + cellSize * 0.26, cy - cellSize * 0.34);
                    ctx.moveTo(cx + cellSize * 0.21, cy - cellSize * 0.24);
                    ctx.lineTo(cx + cellSize * 0.32, cy - cellSize * 0.28);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'星上の石は鹿 — 孤立接近は角に注意'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            鹿苑碁: 星の上の石は鹿。味方のない孤立した敵石が鹿に隣接すると角で跳ね返される<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '星の点に置いた石は「鹿」(角マーク)。味方と繋がらない孤立した敵石が鹿の隣に置かれると角で跳ね返され、アゲハマになる。',
            '連で近づけば角は効かない。星を巡る守りと単騎突入の読み合い。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const sp = getStarPoints(BOARD_SIZE)[0]; // 星の1つ
        board[sp.y * BOARD_SIZE + sp.x] = 2; // 白の鹿
        executeMove({ cells: [{ x: sp.x, y: sp.y + 1 }] }, 1); // 孤立して隣接 → 角
        assert('孤立した侵入者は跳ね返される', board[(sp.y + 1) * BOARD_SIZE + sp.x] === 0 && captures[2] === 1);
        board[sp.y * BOARD_SIZE + sp.x + 2] = 1; // 連になる予備の味方石
        executeMove({ cells: [{ x: sp.x + 1, y: sp.y }] }, 1); // 鹿に隣接だが孤立ではない
        assert('連で近づけば角は効かない', board[sp.y * BOARD_SIZE + sp.x + 1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
