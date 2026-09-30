// LINKGO — 架橋碁: Hex方式。黒は上下・白は左右を自石で結んだら即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'linkgo.html',
    en: 'LINKGO',
    jp: '架橋碁',
    prefix: 'linkgo',
    desc: '黒は上下・白は左右の辺を自石で結んだら即勝ち (Hexルール)。',
    kind: 'link',
    spec: [
        ...K.rb('LINKGO', '架橋碁', 'linkgo'),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 黒は上下(y=0↔y=末), 白は左右(x=0↔x=末) を連結したか
        function linkedEdges(player) {
            const visited = Array(board.length).fill(false);
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || visited[i]) continue;
                let minP = BOARD_SIZE, maxP = -1;
                const queue = [i];
                visited[i] = true;
                while (queue.length > 0) {
                    const cur = queue.shift();
                    const pos = player === 1 ? Math.floor(cur / BOARD_SIZE) : cur % BOARD_SIZE;
                    if (pos < minP) minP = pos; if (pos > maxP) maxP = pos;
                    getNeighbors(cur).forEach(n => {
                        if (board[n] === player && !visited[n]) { visited[n] = true; queue.push(n); }
                    });
                }
                if (minP === 0 && maxP === BOARD_SIZE - 1) return true;
            }
            return false;
        }

        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 架橋ルール: 着手した側が自分の両辺を結べば即勝ち
            if (linkedEdges(player)) {
                // 架橋した連を全体発光させる
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    const seen = new Set([i]); const q = [i];
                    let lo = BOARD_SIZE, hi = -1;
                    while (q.length) {
                        const cur = q.pop();
                        const pos = player === 1 ? Math.floor(cur / BOARD_SIZE) : cur % BOARD_SIZE;
                        if (pos < lo) lo = pos;
                        if (pos > hi) hi = pos;
                        getNeighbors(cur).forEach(n => { if (board[n] === player && !seen.has(n)) { seen.add(n); q.push(n); } });
                    }
                    if (lo === 0 && hi === BOARD_SIZE - 1) {
                        seen.forEach(idx => fxGlow(idx, '#facc15', 950));
                        break;
                    }
                }
                fxShake(5, 360);
                if (lastMove && lastMove.cells[0]) {
                    fxText(lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x, '架橋!', '#facc15', 1400);
                }
                winByRule(player, '架橋勝ち', '自分の担当する両辺を連結しました'); return;
            }

            turn = opponent;`],
        // 担当辺を色で示す (黒=上下, 白=左右)
        K.CUE_GRID(`            // 担当ゴール辺: 上下=黒帯, 左右=白帯
            {
                const bw = width - padding * 2;
                const t = cellSize * 0.22;
                ctx.save();
                ctx.fillStyle = 'rgba(30,30,30,0.22)';
                ctx.fillRect(padding, padding - t / 2, bw, t);
                ctx.fillRect(padding, width - padding - t / 2, bw, t);
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fillRect(padding - t / 2, padding, t, bw);
                ctx.fillRect(width - padding - t / 2, padding, t, bw);
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '黒は上辺↔下辺、白は左辺↔右辺を自分の石の連で結んだら即勝ち (Hex)。',
            '囲碁の取り・呼吸ルールも有効: 相手の連を切るには取るしかない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        for (let y = 0; y < BOARD_SIZE - 1; y++) executeMove({ cells: [{ x: 3, y }] }, 1);
        assert('黒: 未連結では続行', gameOver === false);
        executeMove({ cells: [{ x: 3, y: BOARD_SIZE - 1 }] }, 1);
        assert('黒: 上下連結で即勝ち', gameOver === true && gameResultData.title.includes('架橋'));
    `,
};
