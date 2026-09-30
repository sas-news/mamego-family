// RACEGO — 競走碁: どちらでもよいので対辺を自石で結んだ側が即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'racego.html',
    en: 'RACEGO',
    jp: '競走碁',
    prefix: 'racego',
    desc: '上下でも左右でも、対辺を自石で結んだ方が即勝ちの連結競走。',
    kind: 'link',
    spec: [
        ...K.rb('RACEGO', '競走碁', 'racego'),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 自色の連が対辺(上下or左右)を結んでいればその連のidx配列を返す
        function connectedOppositeEdges(player) {
            const visited = Array(board.length).fill(false);
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || visited[i]) continue;
                let minX = BOARD_SIZE, maxX = -1, minY = BOARD_SIZE, maxY = -1;
                const queue = [i]; const comp = [];
                visited[i] = true;
                while (queue.length > 0) {
                    const cur = queue.shift(); comp.push(cur);
                    const cx = cur % BOARD_SIZE, cy = Math.floor(cur / BOARD_SIZE);
                    if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
                    if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
                    getNeighbors(cur).forEach(n => {
                        if (board[n] === player && !visited[n]) { visited[n] = true; queue.push(n); }
                    });
                }
                if ((minY === 0 && maxY === BOARD_SIZE - 1) || (minX === 0 && maxX === BOARD_SIZE - 1)) return comp;
            }
            return null;
        }

        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 競走ルール: 着手した側の連が対辺を結べば即勝ち (縦横どちらでも)
            const chain = connectedOppositeEdges(player);
            if (chain) {
                // 勝ち筋の連を金光でなぞる
                chain.forEach(i => fxGlow(i, '#facc15', 1100));
                fxShake(6, 400);
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, 'GOAL!', '#facc15', 1500);
                winByRule(player, '対辺連結勝ち', '自分の石で対辺を結びました'); return;
            }

            turn = opponent;`],
        // 四辺のゴール帯を薄く染める
        K.CUE_GRID(`            // 競走ゴール帯: 四辺を薄く染める
            {
                const bw = width - padding * 2;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.10);
                const t = cellSize * 0.22;
                ctx.fillRect(padding, padding - t / 2, bw, t);
                ctx.fillRect(padding, width - padding - t / 2, bw, t);
                ctx.fillRect(padding - t / 2, padding, t, bw);
                ctx.fillRect(width - padding - t / 2, padding, t, bw);
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石の連が盤の対辺同士 (上↔下 または 左↔右) を結んだ時点で即勝ち。',
            '取り・地取りの通常ルールもそのまま有効。繋げる側と切る側の競走。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        for (let y = 0; y < BOARD_SIZE - 1; y++) executeMove({ cells: [{ x: 3, y }] }, 1);
        assert('未連結では続行', gameOver === false);
        executeMove({ cells: [{ x: 3, y: BOARD_SIZE - 1 }] }, 1);
        assert('縦連結で即勝ち', gameOver === true && gameResultData.title.includes('連結'));
    `,
};
