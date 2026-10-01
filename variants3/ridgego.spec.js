// RIDGEGO — 山稜碁: 稜線の上だけ呼吸点-2、谷側は安全
const K = require('../gen_kit.js');
module.exports = {
    file: 'ridgego.html',
    en: 'RIDGEGO',
    jp: '山稜碁',
    prefix: 'ridgego',
    desc: '中央の稜線に立つ石は呼吸点-2。稜を避けるか、制するか。',
    kind: 'stone',
    icon: 'ridgego',
    spec: [
        ...K.rb('RIDGEGO', '山稜碁', 'ridgego'),
        K.params([
            { key: 'ridge_penalty', label: '稜線の呼吸減', min: 0, max: 6, def: 2, unit: '点/石' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 山稜: 中央の稜線行。稜線の石1個ごとに連の呼吸点-2
        const RIDGE_Y = Math.floor(BOARD_SIZE / 2);
        function isRidge(x, y) { return y === RIDGE_Y; }`],
        // 取り判定: 稜線の石は連の呼吸点を2削る
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
                        // 稜線の石は呼吸点-2 (風が強く息苦しい)
                        if (isRidge(curr % BOARD_SIZE, Math.floor(curr / BOARD_SIZE))) liberties -= Math.max(0, P('ridge_penalty') ?? 2);

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

                    if (liberties < 1) {
                        captured.push(...group);
                    }
                }
            }
            return captured;
        }`],
        // getLiberties も同じ補正 (AI見積もり用)
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
                if (isRidge(curr % BOARD_SIZE, Math.floor(curr / BOARD_SIZE))) liberties -= Math.max(0, P('ridge_penalty') ?? 2);
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
        }`],
        // 稜線の描画 (格子線の直前に帯を引く)
        K.CUE_GRID(`            // 山稜: 稜線の帯とハッチ
            {
                ctx.save();
                const ry = padding + RIDGE_Y * cellSize;
                ctx.fillStyle = 'rgba(120,90,50,0.22)';
                ctx.fillRect(padding - cellSize / 2, ry - cellSize / 2, BOARD_SIZE * cellSize, cellSize);
                ctx.strokeStyle = 'rgba(120,90,50,0.55)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.06);
                ctx.beginPath();
                ctx.moveTo(padding - cellSize / 2, ry);
                ctx.lineTo(padding + (BOARD_SIZE - 0.5) * cellSize, ry);
                ctx.stroke();
                // 峰の三角
                ctx.fillStyle = 'rgba(120,90,50,0.4)';
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const cx = padding + x * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.22, ry + cellSize * 0.30);
                    ctx.lineTo(cx, ry - cellSize * 0.18);
                    ctx.lineTo(cx + cellSize * 0.22, ry + cellSize * 0.30);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            山稜碁: 中央の稜線の石は呼吸点-2。谷側は安全<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央に稜線が走る。稜線に立つ石1個ごとに、その連の呼吸点が2削られる。',
            '稜線の連はわずかな隙間でも窒息しやすい。補正は両者に同じく働く。',
        ])],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
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
        const r = Math.floor(BOARD_SIZE / 2);
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 稜線の石: 3呼吸-2=1 → ぎりぎり生存、2呼吸-2=0 → 死
        board[I(4, r)] = 2;
        board[I(3, r)] = 1; board[I(5, r)] = 1; // 上下だけ空く
        assert('稜線の石は2呼吸では窒息', getCapturedStones(board, 2).length === 1);
        board[I(4, r - 1)] = 2; // 連になる: 呼吸4 - 稜ペナルティ2 = 2 → 生存
        assert('稜線の連は呼吸が足りれば生存', getCapturedStones(board, 2).length === 0);
        // 谷側の同じ形は生きる
        board.fill(0);
        board[I(4, r - 2)] = 2;
        board[I(3, r - 2)] = 1; board[I(5, r - 2)] = 1;
        assert('谷側は2呼吸で生存', getCapturedStones(board, 2).length === 0);
        assert('起動して着手可', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
    `,
};
