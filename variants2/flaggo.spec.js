// FLAGGO — 旗碁: 自旗の連を敵陣端まで繋げる
const K = require('../gen_kit.js');
module.exports = {
    file: 'flaggo.html',
    en: 'FLAGGO',
    jp: '旗碁',
    prefix: 'flaggo',
    desc: '初手の石が旗。旗の連を敵陣端まで繋げば勝ち。旗を取られると負け。',
    kind: 'flag',
    spec: [
        ...K.rb('FLAGGO', '旗碁', 'flaggo'),
        // 状態: 各プレイヤーの旗石の位置
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let flagIdx = { 1: -1, 2: -1 }; // 各プレイヤーの旗石(初手)の位置`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            flagIdx = { 1: -1, 2: -1 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                flagIdx: { ...flagIdx }
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.flagIdx) flagIdx = { ...snap.flagIdx };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    flagIdx,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (s.flagIdx) flagIdx = s.flagIdx;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                flagIdx,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (data.flagIdx) flagIdx = data.flagIdx;`],
        // winByRule + 旗連の端判定ヘルパー
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 旗の連が敵陣端(黒=最下行, 白=最上行)に到達したか
        function flagReached(player) {
            const targetY = player === 1 ? BOARD_SIZE - 1 : 0;
            const start = flagIdx[player];
            if (start < 0 || board[start] !== player) return false;
            const visited = Array(board.length).fill(false);
            const queue = [start];
            visited[start] = true;
            while (queue.length > 0) {
                const cur = queue.shift();
                if (Math.floor(cur / BOARD_SIZE) === targetY) return true;
                getNeighbors(cur).forEach(n => {
                    if (board[n] === player && !visited[n]) { visited[n] = true; queue.push(n); }
                });
            }
            return false;
        }

        function endGameByScore() {`],
        // 手番交代直前: 旗の記録・奪取・到達判定
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 旗碁ルール: 初手の石が旗になる
            if (flagIdx[player] < 0) flagIdx[player] = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            // 敵旗が消えた → 奪取勝ち
            if (flagIdx[opponent] >= 0 && board[flagIdx[opponent]] !== opponent) {
                winByRule(player, '旗奪取勝ち', '敵の旗石を取りました'); return;
            }
            // 自旗の連が敵陣端に到達 → 旗到達勝ち
            if (flagReached(player)) {
                winByRule(player, '旗到達勝ち', '旗を敵陣の端まで運びました'); return;
            }

            turn = opponent;`],
        // 旗石に三角旗マーク
        ...K.STONE_MARKS_SPEC(`            for (const p of [1, 2]) {
                const fi = flagIdx[p];
                if (fi < 0 || board[fi] !== p) continue;
                const fx = fi % BOARD_SIZE, fy = Math.floor(fi / BOARD_SIZE);
                const cx = padding + fx * cellSize, cy = padding + fy * cellSize;
                ctx.save();
                ctx.strokeStyle = p === 1 ? '#f8fafc' : '#1a1a1a';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.30);
                ctx.lineTo(cx + cellSize * 0.22, cy - cellSize * 0.20);
                ctx.lineTo(cx, cy - cellSize * 0.10);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.30);
                ctx.lineTo(cx, cy + cellSize * 0.06);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの最初に置いた石が「旗」になる (旗印マーク付き)。',
            '旗を含む連が敵陣の端 (黒=下端, 白=上端) に到達した側が即勝ち。',
            '旗石を取られた側は即負け。通常の地取り勝負も残る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1); // 黒の旗
        assert('旗が記録される', flagIdx[1] === 2 * BOARD_SIZE + 2);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        assert('白の旗が記録される', flagIdx[2] === 5 * BOARD_SIZE + 5);
        for (let y = 3; y < BOARD_SIZE; y++) executeMove({ cells: [{ x: 2, y }] }, 1);
        assert('旗到達で即勝ち', gameOver === true && gameResultData.title.includes('旗'));
    `,
};
