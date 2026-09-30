// WINDINSTGO — 管楽碁: 行が音域。上段(高音)は息が続かず孤立石が置けず、下段(低音)は響きが太く得点
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
    file: 'windinstgo.html',
    en: 'WINDINSTGO',
    jp: '管楽碁',
    prefix: 'windinstgo',
    desc: '行が音域。上2段 (高音) には孤立石は置けない。最下2段 (低音) の連は響きが太く+1目。',
    kind: 'stone',
    icon: 'windinstgo',
    spec: [
        ...K.rb('WINDINSTGO', '管楽碁', 'windinstgo'),
        // 高音域制限: 上2段への孤立着手は不可 (息が続かない) — 既存の連に接続するなら可
        [K.ONE, K.VALID_BOUNDS, `        for (const p of cells) {
            const x = p.x, y = p.y;
            if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return false;
            if (board[y * BOARD_SIZE + x] !== 0) return false;
        }
        // 高音域は息が続かない: 上2段には孤立石を置けない (自分の連に接するなら可)
        {
            const y = cells[0].y;
            if (y < 2) {
                const idx = y * BOARD_SIZE + cells[0].x;
                const ownAdj = getNeighbors(idx).some(n => board[n] === player);
                if (!ownAdj) return false;
            }
        }`],
        // 低音の響き: 最下2段 (または最上2段 — 盤は対称ではないので両端) に連が3石以上で響き+1
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 低音の響き: 上2段・下2段の「端の音域」に3石以上の自連が完成すると響いて+1目
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const y = move.cells[0].y;
                if (board[mi] === player && (y < 2 || y >= BOARD_SIZE - 2)) {
                    const g = getConnectedGroup(mi, player);
                    if (g.length >= 3) {
                        captures[player]++;
                        g.forEach(j => fxGlow(j, '#a5b4fc', 700));
                        fxText(mi, '低音の響き +1', '#818cf8', 1200);
                    }
                }
            }

            turn = opponent;`],
        // 音域ガイド: 上下2段に薄い帯
        ...K.CUE_GRID(`            // 音域ガイド: 上下2段に帯 (上=高音で孤立不可、下=低音で響き)
            {
                ctx.save();
                ctx.fillStyle = 'rgba(165,180,252,0.12)';
                ctx.fillRect(padding - cellSize * 0.5, padding - cellSize * 0.5, BOARD_SIZE * cellSize, 2 * cellSize);
                ctx.fillRect(padding - cellSize * 0.5, padding + (BOARD_SIZE - 2 - 0.5) * cellSize, BOARD_SIZE * cellSize, 2 * cellSize);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'上2段=高音(孤立不可) / 端の連3石で+1'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            管楽碁: 行が音域。上2段 (高音) は息が続かず孤立石は置けない。上下2段の連が3石になると響き+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '行が楽器の音域。最上2段 (高音) には孤立した石は置けない — 自分の連に接する着手のみ可。',
            '上端・下端の音域に3石以上の連が完成すると響いて+1目。高音は繋ぎ手、端は響き手。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('高音域に孤立石は置けない', isValidPlacement([{ x: 5, y: 0 }], 1) === false);
        board[0] = 1; // 高音域に自石
        assert('自分の連に接するなら可', isValidPlacement([{ x: 1, y: 0 }], 1) === true);
        board.fill(0); captures = { 1: 0, 2: 0 };
        board[(BOARD_SIZE - 1) * BOARD_SIZE + 3] = 1; board[(BOARD_SIZE - 1) * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 5, y: BOARD_SIZE - 1 }] }, 1); // 下端3連 → 響き
        assert('端の3連で響き+1', captures[1] === 1);
        assert('中段は普通', isValidPlacement([{ x: 6, y: 6 }], 2) === true);
    `,
};
