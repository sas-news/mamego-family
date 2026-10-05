// SYMBIOSISGO — 共生碁: 取られる連に接していた着手側の石も連鎖して死ぬ
const K = require('../gen_kit.js');
module.exports = {
    file: 'symbiosisgo.html',
    en: 'SYMBIOSISGO',
    jp: '共生碁',
    prefix: 'symbiosisgo',
    desc: '自石と敵石は共生関係。取られた連に接した自石も連鎖して死ぬ。',
    kind: 'stone',
    icon: 'symbiosisgo',
    spec: [
        ...K.rb('SYMBIOSISGO', '共生碁', 'symbiosisgo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2, def: 0.8, step: 0.1, hint: '交点数の倍率' },
        ]),
        // 共生: 取られた連に隣接していた自分の石も連鎖して死ぬ (相手のアゲハマに)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 共生の連鎖: 死んだ連に寄生されていた着手側の石も力尽きる
                const chained = new Set();
                captured.forEach(idx => getNeighbors(idx).forEach(n => {
                    if (board[n] === player) chained.add(n);
                }));
                chained.forEach(i => {
                    board[i] = 0;
                    captures[opponent]++;
                    fxSplash(i, '#34d399', 6);
                });
                if (chained.size > 0) fxText(captured[0], '共生崩壊 +' + chained.size, '#34d399', 1100);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 共生: 接する敵石同士の間に緑の結び目
            {
                ctx.save();
                ctx.fillStyle = 'rgba(52,211,153,0.7)';
                for (let i = 0; i < board.length; i++) {
                    const p = board[i];
                    if (p !== 1 && p !== 2) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                        const nx = x + dx, ny = y + dy;
                        if (nx >= BOARD_SIZE || ny >= BOARD_SIZE) return;
                        const ni = ny * BOARD_SIZE + nx;
                        if (board[ni] === 0 || board[ni] === p) return;
                        const mx = padding + (x + dx * 0.5) * cellSize;
                        const my = padding + (y + dy * 0.5) * cellSize;
                        ctx.beginPath();
                        ctx.arc(mx, my, Math.max(1.6, cellSize * 0.08), 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '自石と敵石は共生関係を結ぶ。取られた連に隣接していた自分の石も連鎖して死に、相手のアゲハマになる。',
            '接して取るほど自分も傷つく — 両者同じルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2);
        [[3, 4], [5, 4], [4, 3], [4, 5]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 1));
        assert('白が取られた', board[4 * BOARD_SIZE + 4] === 0);
        assert('共生連鎖で囲んだ黒も死ぬ', board[3 * BOARD_SIZE + 4] === 0 && board[4 * BOARD_SIZE + 3] === 0);
        assert('黒の取りは1、白の取りは4', captures[1] === 1 && captures[2] === 4);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
