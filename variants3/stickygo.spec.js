// STICKYGO — 粘着碁: 敵石に隣接して「粘着」した石は呼吸を吸い取られる (接触は互いに窒息させる)
const K = require('../gen_kit.js');
module.exports = {
    file: 'stickygo.html',
    en: 'STICKYGO',
    jp: '粘着碁',
    prefix: 'stickygo',
    desc: '敵石に接着した石は呼吸を吸い取られる。接触は互いを窒息させる粘着戦。',
    kind: 'stone',
    icon: 'stickygo',
    spec: [
        ...K.rb('STICKYGO', '粘着碁', 'stickygo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 粘着: 敵石に隣接する石は呼吸点を提供しない
        function isEnemyCell(boardState, idx, player) {
            const v = boardState[idx];
            return v !== 0 && v !== 3 && v !== player;
        }
        function touchesEnemy(boardState, idx, player) {
            return getNeighbors(idx).some(n => isEnemyCell(boardState, n, player));
        }`],
        // 呼吸判定: 敵に接着した石は呼吸点を提供しない
        [K.ONE, `        function getCapturedStones(boardState, player) {
            const deadMask = computeDeadMask(boardState);
            const visited = Array(boardState.length).fill(false);
            const captured = [];

            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {
                    const group = [];
                    let hasLiberty = false;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);

                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });
                    }

                    if (!hasLiberty) {
                        captured.push(...group);
                    }
                }
            }
            return captured;
        }`,
`        function getCapturedStones(boardState, player) {
            const deadMask = computeDeadMask(boardState);
            const visited = Array(boardState.length).fill(false);
            const captured = [];

            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {
                    const group = [];
                    let hasLiberty = false;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);

                        const neighbors = getNeighbors(curr);
                        const glued = neighbors.some(n => isEnemyCell(boardState, n, player));
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n] && !glued) {
                                hasLiberty = true; // 粘着した石は呼吸できない
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });
                    }

                    if (!hasLiberty) {
                        captured.push(...group);
                    }
                }
            }
            return captured;
        }`],
        // getLiberties も同じ判定に (AI見積もり用)
        [K.ONE, `        function getLiberties(boardState, idx) {
            const player = boardState[idx];
            if (player === 0) return 0;

            const deadMask = computeDeadMask(boardState);
            const visited = Array(boardState.length).fill(false);
            const queue = [idx];
            visited[idx] = true;
            let liberties = 0;

            while (queue.length > 0) {
                const curr = queue.shift();
                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;
                    } else if (boardState[n] === player && !visited[n]) {
                        visited[n] = true;
                        queue.push(n);
                    }
                });
            }
            return liberties;
        }`,
`        function getLiberties(boardState, idx) {
            const player = boardState[idx];
            if (player === 0) return 0;

            const deadMask = computeDeadMask(boardState);
            const visited = Array(boardState.length).fill(false);
            const queue = [idx];
            visited[idx] = true;
            let liberties = 0;

            while (queue.length > 0) {
                const curr = queue.shift();
                const neighbors = getNeighbors(curr);
                const glued = neighbors.some(n => isEnemyCell(boardState, n, player));
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n] && !glued) {
                        liberties++; // 粘着した石は呼吸点を提供しない
                    } else if (boardState[n] === player && !visited[n]) {
                        visited[n] = true;
                        queue.push(n);
                    }
                });
            }
            return liberties;
        }`],
        // 粘着の描画: 隣接する異色石の間に糊
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                ctx.fillStyle = 'rgba(250,204,21,0.55)';
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    getNeighbors(i).forEach(n => {
                        if (n > i && (board[n] === 1 || board[n] === 2) && board[n] !== board[i]) {
                            const nx = n % BOARD_SIZE, ny = (n / BOARD_SIZE) | 0;
                            const cx = padding + (x + nx) * cellSize / 2, cy = padding + (y + ny) * cellSize / 2;
                            ctx.beginPath();
                            ctx.arc(cx, cy, cellSize * 0.10, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    });
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            粘着碁: 敵石に接着 (黄点) した石は呼吸を吸い取られる。取り合いは互いを窒息させる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵石に隣接した石は「粘着」し、その石からの呼吸点は0になる (黄点は接着印)。',
            '接着は相互に働く。囲んで取れば接着は解けて通常の呼吸に戻る。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
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
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[I(5, 5)] = 1; board[I(6, 5)] = 2;
        assert('接着した石は呼吸を吸われる', getCapturedStones(board, 1).includes(I(5, 5)));
        assert('白も相互に吸われる', getCapturedStones(board, 2).includes(I(6, 5)));
        board.fill(0); board[I(5, 5)] = 1;
        board[I(4, 5)] = 2; board[I(6, 5)] = 2; board[I(5, 4)] = 2; board[I(5, 6)] = 2;
        assert('囲まれた黒は取られる', getCapturedStones(board, 1).includes(I(5, 5)));
        assert('接着した包囲白も吸われる', getCapturedStones(board, 2).length === 4);
        board.fill(0);
        assert('離れた着手は普通に有効', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('着手できた', board[I(4, 4)] === 1);
    `,
};
