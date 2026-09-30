// TRACEGO — 追跡碁: 自陣の基点から石の連鎖を伸ばし、中央の目標物にたどり着いたら勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'tracego.html',
    en: 'TRACEGO',
    jp: '追跡碁',
    prefix: 'tracego',
    desc: '自陣の基点から石の連鎖を伸ばし、中央の目標物まで繋げた側が追跡成功で勝ち。',
    kind: 'stone',
    icon: 'tracego',
    spec: [
        ...K.rb('TRACEGO', '追跡碁', 'tracego'),
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 基点: 黒は上端中央、白は下端中央
            {
                const mid = Math.floor(BOARD_SIZE / 2);
                board[mid] = 1;
                board[(BOARD_SIZE - 1) * BOARD_SIZE + mid] = 2;
            }`],
        // 追跡判定: 基点列に達する同色連鎖が中央を含むか
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function traceReached(player) {
            const mid = Math.floor(BOARD_SIZE / 2);
            const goal = mid * BOARD_SIZE + mid;
            if (board[goal] !== player) return false;
            const home = player === 1 ? 0 : BOARD_SIZE - 1;
            const seen = new Set([goal]);
            const queue = [goal];
            while (queue.length) {
                const i = queue.pop();
                if (Math.floor(i / BOARD_SIZE) === home) return true;
                for (const n of getNeighbors(i)) {
                    if (board[n] === player && !seen.has(n)) { seen.add(n); queue.push(n); }
                }
            }
            return false;
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 追跡判定: 基点からの連鎖が中央の目標物に到達したら勝ち
            if (traceReached(player)) {
                const mid = Math.floor(BOARD_SIZE / 2);
                fxGlow(mid * BOARD_SIZE + mid, '#facc15', 1200);
                fxText(mid * BOARD_SIZE + mid, '追跡成功!', '#facc15', 1400);
                fxShake(6, 380);
                winByRule(player, '追跡成功', '基点からの連鎖が目標物に到達しました'); return;
            }

            // 打ち切り終局
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 基点と目標物の描画
        K.CUE_STARS(`            // 基点 (旗) と中央の目標物 (足跡)
            {
                const mid = Math.floor(BOARD_SIZE / 2);
                [[mid, '#fca5a5'], [(BOARD_SIZE - 1) * BOARD_SIZE + mid, '#dbeafe']].forEach(([bi, col]) => {
                    const bx = bi % BOARD_SIZE, by = Math.floor(bi / BOARD_SIZE);
                    const cx = padding + bx * cellSize, cy = padding + by * cellSize;
                    ctx.save();
                    ctx.strokeStyle = col;
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.strokeRect(cx - cellSize * 0.42, cy - cellSize * 0.42, cellSize * 0.84, cellSize * 0.84);
                    ctx.restore();
                });
                const gx = padding + mid * cellSize, gy = padding + mid * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(250,204,21,0.9)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(gx, gy, cellSize * 0.36, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(gx, gy, cellSize * 0.1, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(250,204,21,0.9)';
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            追跡碁: 基点から石の連鎖を伸ばし中央の目標物に辿り着くと勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '黒は上端中央、白は下端中央の基点 (枠で表示) からスタート。基点に連なる自分の石の連鎖が盤中央の目標物 (金色の円) に届けば追跡成功で即勝ち。',
            '基点の石は取られると連鎖が絶たれる。中央を取り合いつつ、相手の連鎖は切り裂こう。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame(); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const mid = Math.floor(BOARD_SIZE / 2);
        assert('黒基点', board[mid] === 1);
        assert('白基点', board[(BOARD_SIZE - 1) * BOARD_SIZE + mid] === 2);
        assert('まだ未到達', traceReached(1) === false);
        // 黒の連鎖を上端から中央へ繋げる
        for (let y = 1; y <= mid; y++) board[y * BOARD_SIZE + mid] = 1;
        assert('連鎖が中央に到達', traceReached(1) === true);
        executeMove({ cells: [{ x: 0, y: 2 }] }, 1);
        assert('追跡成功で勝ち', gameOver === true && gameResultData && gameResultData.title.includes('追跡'));
    `,
};
