// FENGSHUIGO — 風水碁: 気の井戸(星の点)に立つ石は気に護られ、捕獲されても盤に残る
const K = require('../gen_kit.js');
module.exports = {
    file: 'fengshuigo.html',
    en: 'FENGSHUIGO',
    jp: '風水碁',
    prefix: 'fengshuigo',
    desc: '気の井戸 (星の点) に立つ石は良い気に護られ、取られても盤に残る聖地となる。',
    kind: 'stone',
    icon: 'fengshuigo',
    spec: [
        ...K.rb('FENGSHUIGO', '風水碁', 'fengshuigo'),
        K.params([
            { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 600, def: 140, unit: '手' },
        ]),
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function qiWells() { return getStarPoints(BOARD_SIZE).map(pt => pt.y * BOARD_SIZE + pt.x); }

        function isValidPlacement(cells, player) {`],
        // 気の井戸の石は捕獲を免れる
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                const wells = qiWells();
                const doomed = captured.filter(i => !wells.includes(i));
                const spared = captured.length - doomed.length;
                doomed.forEach(i => { board[i] = 0; });
                captures[player] += doomed.length;
                if (spared > 0) {
                    captured.filter(i => wells.includes(i)).forEach(i => {
                        fxGlow(i, '#34d399', 900);
                        fxText(i, '気の守り', '#34d399', 900);
                    });
                }
                if (doomed.length > 0) fxShake(Math.min(6, doomed.length), 300);
                cleanUpPieces();
            }`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り終局
            if (history.length >= Math.max(1, P('ply_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 気の井戸に渦を描く
        K.CUE_STARS(`            // 気の井戸: 翠の渦巻
            {
                qiWells().forEach(wi => {
                    const wx = wi % BOARD_SIZE, wy = Math.floor(wi / BOARD_SIZE);
                    const cx = padding + wx * cellSize, cy = padding + wy * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(52,211,153,0.8)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    for (let a = 0; a < Math.PI * 3.4; a += 0.35) {
                        const r = cellSize * 0.06 + (a / (Math.PI * 3.4)) * cellSize * 0.32;
                        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
                        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                    ctx.restore();
                });
            }`),
        [K.ONE, K.INFO_BASE, `            風水碁: 気の井戸 (星の点) の石は気に護られ、取られても盤に残る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '星の点は「気の井戸」。その上に立つ石は良い気に護られ、捕獲されてもその場に残る (周りの石は普通に取られる)。',
            '井戸を押さえれば盤上に抜けない拠点ができるが、井戸の周囲を封鎖されると孤立した聖地になる。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const wells = qiWells();
        assert('井戸は5箇所', wells.length === 5);
        const w = wells[4]; // 右下の井戸
        const wx = w % BOARD_SIZE, wy = Math.floor(w / BOARD_SIZE);
        board[w] = 2;
        getNeighbors(w).slice(0, 3).forEach(n => { board[n] = 1; });
        const lastN = getNeighbors(w)[3];
        executeMove({ cells: [{ x: lastN % BOARD_SIZE, y: Math.floor(lastN / BOARD_SIZE) }] }, 1);
        assert('井戸の石は気に護られる', board[w] === 2);
        // 井戸でない石は普通に取られる
        board.fill(0); captures = { 1: 0, 2: 0 }; gameOver = false;
        board[2 * BOARD_SIZE + 2] = 2;
        board[2 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 3] = 1;
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1);
        assert('通常石は取られる', board[2 * BOARD_SIZE + 2] === 0 && captures[1] === 1);
    `,
};
