// GEARGO — 歯車碁: 3手ごとに外リングと内リングが逆回転
const K = require('../gen_kit.js');
module.exports = {
    file: 'geargo.html',
    en: 'GEARGO',
    jp: '歯車碁',
    prefix: 'geargo',
    desc: '3手ごとに外輪が順回り・内輪が逆回りに1コマ回転する歯車盤。',
    kind: 'stone',
    spec: [
        ...K.rb('GEARGO', '歯車碁', 'geargo'),
        // 手番交代直前に2リングを逆方向へ1コマ回転
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 歯車機構: 3手ごとに外リングは進行方向へ、内リングは逆へ1コマ回転
            if (history.length % 3 === 0) {
                const N = BOARD_SIZE;
                const ringCells = (k) => {
                    const cells = [];
                    for (let x = k; x < N - k; x++) cells.push(k * N + x);
                    for (let y = k + 1; y < N - k; y++) cells.push(y * N + (N - 1 - k));
                    for (let x = N - 2 - k; x >= k; x--) cells.push((N - 1 - k) * N + x);
                    for (let y = N - 2 - k; y > k; y--) cells.push(y * N + k);
                    return cells;
                };
                const rot = (cells, dir) => {
                    const vals = cells.map(i => board[i]);
                    for (let i = 0; i < cells.length; i++) {
                        board[cells[i]] = vals[(i + dir + cells.length) % cells.length];
                    }
                };
                rot(ringCells(0), 1);          // 外リング: 逆回り
                if (N >= 5) rot(ringCells(1), -1); // 内リング: 順回り
            }

            turn = opponent;`],
        // 2リングの軌道上に薄いドット
        K.CUE_STARS(`            {
                const N = BOARD_SIZE;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.22);
                const dot = (x, y) => {
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, Math.max(1.5, cellSize * 0.07), 0, Math.PI * 2);
                    ctx.fill();
                };
                for (let i = 0; i < N; i++) { dot(i, 0); dot(i, N - 1); }
                for (let i = 1; i < N - 1; i++) { dot(0, i); dot(N - 1, i); }
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.14);
                for (let i = 1; i < N - 1; i++) { dot(i, 1); dot(i, N - 2); }
                for (let i = 2; i < N - 2; i++) { dot(1, i); dot(N - 2, i); }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC('\'歯車が回る\''),
        [K.ONE, K.RV_ALGO, K.rv([
            '3手ごとに盤の最外周リングが1コマ逆回転、1つ内側のリングが1コマ順回転する。',
            '置いた石は盤と一緒に動く。連の分断・接続が毎手変わる流動的な碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); history.length = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 3手目で回転
        const N = BOARD_SIZE;
        assert('外リングが1コマ回転', board[N] === 1 && board[0] === 0);
        board.fill(0); history.length = 2;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 2);
        assert('内リングは逆向きに回転', board[N + 2] === 2);
        board.fill(0); history.length = 2;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('内部の石は動かない', board[4 * N + 4] === 1);
        assert('手番が進む', turn === 2);
    `,
};
