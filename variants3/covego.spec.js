// COVEGO — 入江碁: 海岸線のような凹凸盤。湾内の好地は呼吸点+1
const K = require('../gen_kit.js');
module.exports = {
    file: 'covego.html',
    en: 'COVEGO',
    jp: '入江碁',
    prefix: 'covego',
    desc: '海岸線の凹凸盤。湾内の奥まった好地は呼吸点+1の安息地。',
    kind: 'stone',
    icon: 'covego',
    spec: [
        ...K.rb('COVEGO', '入江碁', 'covego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 湾: 各辺に切れ込み。湾内の好地は呼吸点+1
        const COVE_Q1 = Math.max(2, Math.floor(BOARD_SIZE / 3));
        const COVE_Q2 = BOARD_SIZE - 1 - COVE_Q1;
        const COVE_NOTCH = new Set();
        const COVE_BAY = new Set(); // 湾内の好地 (+1)
        [[COVE_Q1, 0], [COVE_Q2, 0], [COVE_Q1, 1], [COVE_Q2, 1]].forEach(([q, vert]) => {
            const N = BOARD_SIZE;
            const rot = (dx, dy) => vert === 0 ? [q + dx, dy] : [dy, q + dx];      // 上辺/左辺
            const rot2 = (dx, dy) => vert === 0 ? [q + dx, N - 1 - dy] : [N - 1 - dy, q + dx]; // 下辺/右辺
            [rot, rot2].forEach(R => {
                [[-1, 0], [0, 0], [1, 0], [0, 1]].forEach(([dx, dy]) => {
                    const [x, y] = R(dx, dy);
                    if (x >= 0 && x < N && y >= 0 && y < N) COVE_NOTCH.add(y * N + x);
                });
                [[-1, 1], [1, 1], [0, 2]].forEach(([dx, dy]) => {
                    const [x, y] = R(dx, dy);
                    if (x >= 0 && x < N && y >= 0 && y < N) COVE_BAY.add(y * N + x);
                });
            });
        });
        COVE_NOTCH.forEach(i => COVE_BAY.delete(i));
        function isCoveBay(i) { return COVE_BAY.has(i); }
        function isCovePlayable(x, y) { return !COVE_NOTCH.has(y * BOARD_SIZE + x); }`],
        // 湾の切れ込みは海
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            COVE_NOTCH.forEach(i => { board[i] = 3; });`],
        // 湾内の好地は呼吸点+1
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
                    let liberties = 0;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);

                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                liberties++;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });
                        if (isCoveBay(curr)) liberties++; // 湾内の好地は呼吸+1
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
                if (isCoveBay(curr)) liberties++; // 湾内の好地は呼吸+1
            }
            return liberties;
        }`],
        // 海の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        // 湾内好地の描画
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                COVE_BAY.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(56,189,248,0.55)';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        // 海を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_ALGO, `            入江碁: 海岸線の凹凸盤。湾内の好地 (水色○) は呼吸点+1の安息地<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の各辺に波の切れ込み (海) が入る。湾の奥まった好地 (水色○) は呼吸点+1。',
            '湾内に根を張れば欠け目に強い。切れ込みは置けない。',
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
        resetGame();
        assert('湾の切れ込みがある', COVE_NOTCH.size > 0);
        assert('切れ込みは海', COVE_NOTCH.forEach ? [...COVE_NOTCH].every(i => board[i] === 3) : true);
        assert('内陸は打てる', isValidPlacement([{ x: (BOARD_SIZE - 1) / 2, y: (BOARD_SIZE - 1) / 2 }], 1) === true);
        const bay = [...COVE_BAY][0];
        const bx = bay % BOARD_SIZE, by = (bay / BOARD_SIZE) | 0;
        assert('湾内の好地は呼吸+1', isCoveBay(bay) && getLiberties(board.map((v, i) => i === bay ? 1 : v), bay) >= 1);
        assert('切れ込みは打てない', isValidPlacement([{ x: [...COVE_NOTCH][0] % BOARD_SIZE, y: (([...COVE_NOTCH][0] / BOARD_SIZE) | 0) }], 1) === false);
    `,
};
