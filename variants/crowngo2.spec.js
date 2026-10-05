// CROWNGO2 — 王冠碁: 歯形の外周盤。歯と歯の間の凹部は陥穽で、環状筋に面する石の呼吸点-1
const K = require('../gen_kit.js');
module.exports = {
    file: 'crowngo2.html',
    en: 'CROWNGO2',
    jp: '王冠碁',
    prefix: 'crowngo2',
    desc: '歯形の外周環。凹部 (陥穽) に面する環状筋の石は呼吸点が1つ少ない。',
    kind: 'stone',
    icon: 'crowngo2',
    spec: [
        ...K.rb('CROWNGO2', '王冠碁', 'crowngo2'),
        K.params([
            { key: 'tooth_step', label: '歯の間隔', min: 2, max: 6, def: 3, unit: '点' },
            { key: 'pit_penalty', label: '陥穽の呼吸低下', min: 0, max: 3, def: 1, unit: '点', hint: '0=呼吸低下なし' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 王冠: 外周2重環 + 3つ置きの歯。歯の間の凹部は陥穽 (置けず呼吸-1)
        function crownD(x, y) {
            return Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
        }
        function isCrownTooth(x, y) {
            if (crownD(x, y) !== 2) return false;
            const N = BOARD_SIZE;
            const _ts = Math.max(2, P('tooth_step') || 3);
            if (y === 2 || y === N - 3) return x % _ts === 0;
            return y % _ts === 0;
        }
        function isCrownPlayable(x, y) {
            const d = crownD(x, y);
            return d <= 1 || isCrownTooth(x, y);
        }
        function isCrownPit(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            return crownD(x, y) === 2 && !isCrownTooth(x, y); // 凹部
        }
        function isToothCell(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            return isCrownTooth(x, y);
        }`],
        // 王冠の内側・凹部は壁
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let i = 0; i < board.length; i++) {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                if (!isCrownPlayable(x, y)) board[i] = 3;
            }`],
        // 凹部に面した環状筋の石は呼吸点-1 (歯の石は例外)
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
                            } else if (isCrownPit(n) && !isToothCell(curr)) {
                                liberties -= (P('pit_penalty') ?? 1); // 凹部の陥穽に面した環状筋は呼吸低下
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
                    } else if (isCrownPit(n) && !isToothCell(curr)) {
                        liberties -= (P('pit_penalty') ?? 1); // 凹部の陥穽に面した環状筋は呼吸低下
                    }
                });
            }
            return liberties;
        }`],
        // 王冠の内側と陥穽の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_CAVE)],
        // 歯の描画
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if (!isCrownPit(i)) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(0,0,0,0.55)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.07, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        // 壁・陥穽を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_BASE, `            王冠碁: 歯形の外周環。歯と歯の間の凹部 (陥穽●) に面する環状筋の石は呼吸点-1<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手できるのは外周2重環と3つ置きの「歯」だけ。歯の間の凹部 (黒●) は陥穽。',
            '陥穽に面した環状筋の石は呼吸点が1つ少ない (歯の上の石は例外)。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
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
        assert('環状筋は打てる', isValidPlacement([{ x: 5, y: 0 }], 1) === true);
        assert('王冠の内側は打てない', isValidPlacement([{ x: 6, y: 6 }], 1) === false);
        const pit = I(4, 2);
        assert('凹部は陥穽 (壁)', isCrownPit(pit) && board[pit] === 3);
        const ring = I(4, 1); // 凹部に面する環状筋
        board.fill(0); resetGame();
        board[ring] = 1; board[ring - BOARD_SIZE] = 2; board[ring - 1] = 2; board[ring + 1] = 2;
        assert('凹部の隣は呼吸-1で死ぬ', getCapturedStones(board, 1).includes(ring));
        board.fill(0); resetGame();
        const ti = I(3, 2);
        assert('歯は打てる', isCrownTooth(3, 2) === true);
    `,
};
