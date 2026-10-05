// GOLFGO — 球碁: 盤上の旗マスを自分の石で押さえればホールインワン
const K = require('../gen_kit.js');
module.exports = {
    file: 'golfgo.html',
    en: 'GOLFGO',
    jp: '球碁',
    prefix: 'golfgo',
    desc: '盤上の旗を石で押さえればホールインワン。手数がそのままスコア。',
    kind: 'stone',
    spec: [
        ...K.rb('GOLFGO', '球碁', 'golfgo'),
        K.params([
            { key: 'hole_edge', label: 'ホールの端からの距離', min: 0, max: 0.45, def: 0.2, step: 0.05, hint: '盤面に対する割合' },
            { key: 'hole_band', label: 'ホール出現範囲の広さ', min: 0.1, max: 1, def: 0.6, step: 0.05, hint: '盤面に対する割合' },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
        let holeIdx = -1; // 旗(ホール)の位置`],
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 球碁: ホールは盤の中腹あたりに毎回立つ
            holeIdx = Math.floor(board.length * (P('hole_edge') || 0.2)) + Math.floor(Math.random() * Math.floor(board.length * (P('hole_band') || 0.6)));`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 球碁: 旗マスを自分の石で押さえればホールインワン
            if (holeIdx >= 0 && board[holeIdx] === player) {
                // カップイン: 紙吹雪と歓声の表示
                fxGlow(holeIdx, '#facc15', 1000);
                fxBurst(holeIdx, '#86efac', 12, 1.6);
                fxBurst(holeIdx, '#facc15', 8, 1.2);
                fxShake(5, 340);
                fxText(holeIdx, 'IN ONE!', '#facc15', 1500);
                winByRule(player, 'ホールインワン', '旗を' + history.length + '打で制しました');
                return;
            }

            turn = opponent;`],
        // 旗描画
        K.CUE_STARS(`            if (holeIdx >= 0) {
                const hx = holeIdx % BOARD_SIZE, hy = Math.floor(holeIdx / BOARD_SIZE);
                const cx = padding + hx * cellSize, cy = padding + hy * cellSize;
                ctx.save();
                ctx.strokeStyle = '#3a3a3a';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                ctx.moveTo(cx, cy + cellSize * 0.38);
                ctx.lineTo(cx, cy - cellSize * 0.38);
                ctx.stroke();
                ctx.fillStyle = '#d23c3c';
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.38);
                ctx.lineTo(cx + cellSize * 0.42, cy - cellSize * 0.24);
                ctx.lineTo(cx, cy - cellSize * 0.1);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            球碁: 盤上の旗を石で押さえればホールインワン勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '対局ごとに盤上へ旗 (ホール) が1本立つ。先に自分の石で旗マスを押さえた側の勝ち。',
            '旗マスへ直接打つのが最短。相手石に取られれば旗も空く — カップ周りの攻防が勝負。',
            '決着しなければ通常の地取り勝負になる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        holeIdx = 3 * BOARD_SIZE + 4;
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1);
        assert('旗を押さえれば勝ち', gameOver === true);
        assert('結果はホールインワン', !!gameResultData && gameResultData.title.includes('ホール'));
        resetGame();
        assert('旗は盤内に立つ', holeIdx >= 0 && holeIdx < board.length);
    `,
};
