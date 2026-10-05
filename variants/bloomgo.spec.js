// BLOOMGO — 開花碁: 12手周期の季節。春 (8〜11手目) は全ての連の呼吸点+1
const K = require('../gen_kit.js');
module.exports = {
    file: 'bloomgo.html',
    en: 'BLOOMGO',
    jp: '開花碁',
    prefix: 'bloomgo',
    desc: '12手周期の季節。春になると全ての連が「開花」して呼吸点+1。',
    kind: 'stone',
    icon: 'bloomgo',
    spec: [
        ...K.rb('BLOOMGO', '開花碁', 'bloomgo'),
        K.params([
            { key: 'season_period', label: '季節周期', min: 6, max: 24, def: 12, unit: '手' },
            { key: 'spring_from', label: '春の開始 (周期内)', min: 2, max: 20, def: 8 },
            { key: 'bloom_liberty', label: '春の呼吸ボーナス', min: 1, max: 3, def: 1 },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.8, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 開花: 周期 mod で「春」。春は全連の呼吸点+ボーナス
        function inSpring() { return history.length % (P('season_period') || 12) >= (P('spring_from') || 8); }`],
        // 取り判定: 春は全連の呼吸点+1
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
            const spring = inSpring();

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
                    }

                    if (spring) liberties += (P('bloom_liberty') || 1); // 開花: 春は呼吸+bonus
                    if (liberties < 1) {
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
            if (inSpring()) liberties += (P('bloom_liberty') || 1); // 開花: 春は呼吸+bonus
            return liberties;
        }`],
        // 季節チップ
        ...K.EVENT_CHIP_SPEC(`inSpring() ? '春 (呼吸+1)' : '冬'`),
        // 春の花びらの描画 (格子線の直前: 春だけ盤を薄く染める)
        K.CUE_GRID(`            // 開花: 春は薄い桃色の帯と花びら
            if (inSpring()) {
                ctx.save();
                ctx.fillStyle = 'rgba(244,114,182,0.08)';
                ctx.fillRect(padding - cellSize / 2, padding - cellSize / 2, BOARD_SIZE * cellSize, BOARD_SIZE * cellSize);
                const now = fxNow();
                ctx.fillStyle = 'rgba(244,114,182,0.5)';
                for (let k = 0; k < 6; k++) {
                    const px = padding + ((k * 2.7 + now / 3000) % BOARD_SIZE) * cellSize;
                    const py = padding + ((k * 3.1 + now / 4200) % BOARD_SIZE) * cellSize;
                    ctx.beginPath();
                    ctx.ellipse(px, py, cellSize * 0.13, cellSize * 0.07, now / 900 + k, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            開花碁: 12手周期の季節。春 (8〜11手目) は全連の呼吸点+1<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤には12手周期の季節がある。春 (周期の8〜11手目) は全ての連が開花して呼吸点+1。',
            '春の間は呼吸点0の連も取られない。冬に戻ると再び窒息が有効。季節は両者に同じ。',
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
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 呼吸0の白連
        board[I(4, 4)] = 2;
        board[I(3, 4)] = 1; board[I(5, 4)] = 1; board[I(4, 3)] = 1; board[I(4, 5)] = 1;
        history.length = 8; // 春
        assert('春は開花で生存', getCapturedStones(board, 2).length === 0);
        history.length = 0; // 冬 (mod<8)
        assert('冬は窒息', getCapturedStones(board, 2).length === 1);
        history.length = 11; // 春の最後
        assert('春末も生存', getCapturedStones(board, 2).length === 0);
        assert('着手できる', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
    `,
};
