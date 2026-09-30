// SHADOWGO — 影碁: 石は南東に影を落とし、影のマスは敵の呼吸点にならない
const K = require('../gen_kit.js');
module.exports = {
    file: 'shadowgo.html',
    en: 'SHADOWGO',
    jp: '影碁',
    prefix: 'shadowgo',
    desc: '北西の光源に照らされ、石は南東へ影を落とす。影のマスは敵の呼吸点にならない。',
    kind: 'stone',
    icon: 'shadowgo',
    spec: [
        ...K.rb('SHADOWGO', '影碁', 'shadowgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 光源は北西 — 石の南東 (x+1,y+1) に影が落ちる
        function isShadowedBy(i, caster, boardState) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            if (x === 0 || y === 0) return false;
            return boardState[i - BOARD_SIZE - 1] === caster;
        }`],
        // 影のマスは敵の呼吸点にならない
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
            const enemy = player === 1 ? 2 : 1;
            const visited = Array(boardState.length).fill(false);
            const captured = [];

            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {
                    const group = [];
                    let liberties = 0;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);

                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                if (!isShadowedBy(n, enemy, boardState)) liberties++; // 敵の影は呼吸点にならない
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });
                    }

                    if (liberties <= 0) {
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
            const enemy = player === 1 ? 2 : 1;

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
                        if (!isShadowedBy(n, enemy, boardState)) liberties++; // 敵の影は呼吸点にならない
                    } else if (boardState[n] === player && !visited[n]) {
                        visited[n] = true;
                        queue.push(n);
                    }
                });
            }
            return liberties;
        }`],
        // 影の描画
        ...K.STONE_MARKS_SPEC(`            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                if (x + 1 < BOARD_SIZE && y + 1 < BOARD_SIZE && board[i + BOARD_SIZE + 1] === 0) {
                    const cx = padding + (x + 1) * cellSize, cy = padding + (y + 1) * cellSize;
                    ctx.fillStyle = v === 1 ? 'rgba(0,0,0,0.20)' : 'rgba(148,163,184,0.30)';
                    ctx.fillRect(cx - cellSize * 0.3, cy - cellSize * 0.3, cellSize * 0.6, cellSize * 0.6);
                }
            }`),
        [K.ONE, K.INFO_ALGO, `            影碁: 北西の光源。石は南東に影を落とし、影のマスは敵の呼吸点にならない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各石は南東の隣に影を落とす。影のマスは敵の呼吸点にならない (自分の呼吸点にはなる)。',
            '石の南東を塞ぐだけで敵を追い込める。自石の影は自石を苦しめない。',
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
        pieces = [];
        resetGame();
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 2);
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1);
        assert('影のマスは敵の呼吸点にならない', isShadowedBy(I(5, 5), 1, board) && getLiberties(board, I(5, 4)) === 1);
        executeMove({ cells: [{ x: 5, y: 3 }] }, 1);
        assert('影に潰された白は取られた', board[I(5, 4)] === 0);
        assert('アゲハマは1個', captures[1] === 1);
        assert('影の発生源が残っている', board[I(4, 4)] === 1);
    `,
};
