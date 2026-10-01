// DOMGO — 半球碁: 中央が高いドーム盤。孤立した石は外側へ転がり落ちる
const K = require('../gen_kit.js');
module.exports = {
    file: 'domgo.html',
    en: 'DOMGO',
    jp: '半球碁',
    prefix: 'domgo',
    desc: '中央が高いドーム盤。連に繋がらない孤立石は外へ向かって転がる。',
    kind: 'stone',
    icon: 'domgo',
    spec: [
        ...K.rb('DOMGO', '半球碁', 'domgo'),
        K.params([
            { key: 'roll_max', label: '転がる最大歩数', min: 0, max: 16, def: 0, hint: '0で無制限' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 90, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // ドーム: 中央からのマンハッタン距離が「高さ」。孤立石は外へ転がる
        const DOME_C = (BOARD_SIZE - 1) / 2;
        function domeDist(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            return Math.abs(x - DOME_C) + Math.abs(y - DOME_C);
        }
        function rollStone(i, player) {
            let cur = i;
            for (let step = 0; step < (P('roll_max') || BOARD_SIZE); step++) {
                if (board[cur] !== player) break;
                // 連に繋がっていれば固定される
                if (getNeighbors(cur).some(n => board[n] === player)) break;
                const d0 = domeDist(cur);
                let best = -1, bd = d0;
                getNeighbors(cur).forEach(n => {
                    if (board[n] !== 0) return;
                    const dd = domeDist(n);
                    if (dd > bd) { bd = dd; best = n; }
                });
                if (best < 0) break;
                board[best] = player;
                board[cur] = 0;
                fxSlide(cur, best, 260);
                cur = best;
            }
        }`],
        // 着手後: 置いた孤立石が外へ転がる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            move.cells.forEach(p => rollStone(p.y * BOARD_SIZE + p.x, player));
            cleanUpPieces();
            turn = opponent;`],
        // ドームの等高線
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                ctx.strokeStyle = 'rgba(161,98,7,0.28)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                for (let d = 2; d <= DOME_C; d += 3) {
                    ctx.strokeRect(
                        padding + (DOME_C - d) * cellSize - cellSize * 0.5,
                        padding + (DOME_C - d) * cellSize - cellSize * 0.5,
                        (d * 2 + 1) * cellSize,
                        (d * 2 + 1) * cellSize
                    );
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            半球碁: 中央が高いドーム盤 (等高線)。連に繋がらない孤立石は外へ転がる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '中央が「高い」ドーム盤。味方に隣接しない孤立石は外側へ転がり落ちて止まる。',
            '連に繋げば固定される。中央に単騎で置いても裾野まで滑り落ちる。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 90) / 100))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = [];
        const c = (BOARD_SIZE - 1) / 2;
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('孤立石は転がって隅へ', board[I(c, c)] === 0 && board[I(0, 0)] === 1);
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1); // 隅の石に隣接して打つ
        assert('連に繋がった石は転がらない', board[I(0, 0)] === 1 && board[I(1, 0)] === 1);
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('縁の孤立石は転がらない', board[I(0, 0)] === 1);
    `,
};
