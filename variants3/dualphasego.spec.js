// DUALPHASEGO — 二相碁: 白マスの石は呼吸点2倍・黒マスの石は呼吸点半分の市松盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'dualphasego.html',
    en: 'DUALPHASEGO',
    jp: '二相碁',
    prefix: 'dualphasego',
    desc: '市松模様の盤。白マスの石は呼吸2倍・黒マスの石は呼吸半分で数える。',
    kind: 'stone',
    icon: 'dualphasego',
    spec: [
        ...K.rb('DUALPHASEGO', '二相碁', 'dualphasego'),
        K.params([
            { key: 'light_w', label: '白マスの呼吸倍率', min: 1, max: 4, step: 0.5, def: 2, unit: '倍' },
            { key: 'dark_w', label: '黒マスの呼吸倍率', min: 0, max: 1, step: 0.25, def: 0.5, unit: '倍' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 80, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 二相: 市松盤。白マス (x+y が偶数) の石は呼吸点2倍、黒マスの石は0.5倍
        function isLightSq(x, y) { return (x + y) % 2 === 0; }`],
        // 取り判定: 各石の隣接空点を、その石のマス色で重み付けして合計 (<1 で取られる)
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
                        const cx = curr % BOARD_SIZE, cy = Math.floor(curr / BOARD_SIZE);
                        const w = isLightSq(cx, cy) ? (P('light_w') || 2) : (P('dark_w') ?? 0.5); // 白マスは呼吸2倍・黒マスは半分

                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                liberties += w;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });
                    }

                    if (liberties < 1) {
                        captured.push(...group);
                    }
                }
            }
            return captured;
        }`],
        // getLiberties も同じ重みで (AI見積もり用)
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
                const cx = curr % BOARD_SIZE, cy = Math.floor(curr / BOARD_SIZE);
                const w = isLightSq(cx, cy) ? (P('light_w') || 2) : (P('dark_w') ?? 0.5);
                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties += w;
                    } else if (boardState[n] === player && !visited[n]) {
                        visited[n] = true;
                        queue.push(n);
                    }
                });
            }
            return liberties;
        }`],
        // 市松模様の描画 (格子線の直前に白マスを塗る)
        K.CUE_GRID(`            // 二相: 白マスを薄く塗り分ける市松盤
            {
                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,0.13)';
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isLightSq(x, y)) continue;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            二相碁: 市松盤。白マスの石は呼吸点2倍、黒マスの石は呼吸点0.5倍<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は市松模様。白マスに立つ石は呼吸点が2倍、黒マスの石は0.5倍として数える。',
            '連の呼吸合計が1未満で取られる — 白マスの連は1点で呼吸し、黒マスは2点必要。',
        ])],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 80) / 100))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 白マスの単石: 空点が1つでも呼吸2.0 → 生きる
        board[I(0, 0)] = 2; // (0,0)は白マス
        board[I(1, 0)] = 1; // 隣は黒
        assert('白マスの石は1呼吸で生存', getCapturedStones(board, 2).length === 0);
        // 黒マスの単石: 1空点だけでは呼吸0.5 → 取られる
        board.fill(0);
        board[I(1, 0)] = 2; // (1,0)は黒マス
        board[I(0, 0)] = 1; board[I(2, 0)] = 1; board[I(1, 1)] = 1;
        assert('黒マスの石は1呼吸では窒息', getCapturedStones(board, 2).length === 1);
        // 黒マスでも2空点あれば呼吸1.0 → 生きる
        board[I(0, 0)] = 0; board[I(1, 1)] = 0;
        assert('黒マスでも2呼吸で生存', getCapturedStones(board, 2).length === 0);
        assert('起動して着手可', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
