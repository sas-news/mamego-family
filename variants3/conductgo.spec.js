// CONDUCTGO — 導電碁: 両端の電極に触れた連は「短絡」して呼吸点-2
const K = require('../gen_kit.js');
module.exports = {
    file: 'conductgo.html',
    en: 'CONDUCTGO',
    jp: '導電碁',
    prefix: 'conductgo',
    desc: '盤の左右端は電極。両端に触れる連は短絡して呼吸点-2で弱化する。',
    kind: 'stone',
    icon: 'conductgo',
    spec: [
        ...K.rb('CONDUCTGO', '導電碁', 'conductgo'),
        K.params([
            { key: 'short_penalty', label: '短絡の呼吸点低下', min: 0, max: 4, def: 2, unit: '点', hint: '0=短絡で弱化しない' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 導電: 左右端が電極。連が両端に触れると短絡 → 呼吸点-2
        const ELEC_L = 0, ELEC_R = BOARD_SIZE - 1;
        function groupLiberties(boardState, start, visited) {
            // BFSで連を集め、呼吸点と電極接触を調べる
            const player = boardState[start];
            const deadMask = computeDeadMask(boardState);
            const group = [];
            let liberties = 0;
            let touchL = false, touchR = false;
            const queue = [start];
            visited[start] = true;
            while (queue.length > 0) {
                const curr = queue.shift();
                group.push(curr);
                const cx = curr % BOARD_SIZE;
                if (cx === ELEC_L) touchL = true;
                if (cx === ELEC_R) touchR = true;
                getNeighbors(curr).forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) liberties++;
                    else if (boardState[n] === player && !visited[n]) {
                        visited[n] = true;
                        queue.push(n);
                    }
                });
            }
            return { group, liberties, shorted: touchL && touchR };
        }`],
        // 取り判定: 短絡した連は呼吸点-2
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
            const visited = Array(boardState.length).fill(false);
            const captured = [];

            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {
                    const { group, liberties, shorted } = groupLiberties(boardState, i, visited);
                    const eff = liberties - (shorted ? (P('short_penalty') ?? 2) : 0); // 短絡で呼吸点低下
                    if (eff < 1) {
                        captured.push(...group);
                    }
                }
            }
            return captured;
        }`],
        // getLiberties も同じ補正
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
            const visited = Array(boardState.length).fill(false);
            const { liberties, shorted } = groupLiberties(boardState, idx, visited);
            return liberties - (shorted ? (P('short_penalty') ?? 2) : 0);
        }`],
        // 電極の描画 (格子線の直前: 左右端に電極帯)
        K.CUE_GRID(`            // 導電: 左右端の電極帯
            {
                ctx.save();
                const lx = padding - cellSize / 2, rx = padding + (BOARD_SIZE - 0.5) * cellSize;
                const h = BOARD_SIZE * cellSize;
                ctx.fillStyle = 'rgba(250,204,21,0.20)';
                ctx.fillRect(lx, padding - cellSize / 2, cellSize, h);
                ctx.fillRect(rx - cellSize, padding - cellSize / 2, cellSize, h);
                ctx.strokeStyle = 'rgba(250,204,21,0.7)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                ctx.strokeRect(lx, padding - cellSize / 2, cellSize, h);
                ctx.strokeRect(rx - cellSize, padding - cellSize / 2, cellSize, h);
                // 電極の +/- 表示
                ctx.fillStyle = 'rgba(250,204,21,0.85)';
                ctx.font = 'bold ' + Math.round(cellSize * 0.45) + 'px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('+', lx + cellSize / 2, padding - cellSize * 0.15);
                ctx.fillText('−', rx - cellSize / 2, padding - cellSize * 0.15);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            導電碁: 左右端の電極。両端に触れる連は短絡して弱化する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の左右端は+と−の電極。自分の連が両方の電極に触れると短絡する。',
            '短絡した連は呼吸点-2で弱化。両者に同じく働く。',
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
        const N = BOARD_SIZE;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 両端に触れる白連: 呼吸1でも短絡-2で窒息
        for (let x = 0; x < N; x++) {
            board[I(x, 4)] = 2;
            board[I(x, 3)] = 1; board[I(x, 5)] = 1; // 上下を黒で塞ぐ
        }
        board[I(0, 3)] = 0; // 1箇所だけ呼吸点を残す
        assert('両端に触れる連は短絡窒息', getCapturedStones(board, 2).length === N);
        // 片端だけの連は短絡しない → 同じ1呼吸で生存
        board.fill(0);
        board[I(0, 4)] = 2;
        board[I(1, 4)] = 1; board[I(0, 3)] = 1;
        assert('片端だけは短絡せず生存', getCapturedStones(board, 2).length === 0);
        board[I(0, 5)] = 1;
        assert('呼吸0で窒息', getCapturedStones(board, 2).length === 1);
        assert('着手できる', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
