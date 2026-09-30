// SLITGO — 切れ目碁: 数本の行全体が壁の盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'slitgo.html',
    en: 'SLITGO',
    jp: '切れ目碁',
    prefix: 'slitgo',
    desc: '2本の行全体の切れ目で3帯に分断。帯ごとの独立戦。',
    kind: 'stone',
    spec: [
        ...K.rb('SLITGO', '切れ目碁', 'slitgo'),
        // 行全体の壁が2本
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const y1 = Math.floor(BOARD_SIZE / 3), y2 = Math.floor(2 * BOARD_SIZE / 3);
                for (let x = 0; x < BOARD_SIZE; x++) {
                    board[y1 * BOARD_SIZE + x] = 3;
                    board[y2 * BOARD_SIZE + x] = 3;
                }
            }`],
        ...K.WALL_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '盤を横切る2本の切れ目 (行全体の壁) で3つの帯に分断。',
            '帯を越える手段はない。各帯で別々の地取り勝負。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE;
        const y1 = Math.floor(N / 3), y2 = Math.floor(2 * N / 3);
        assert('切れ目の行は壁', board[y1 * N] === 3 && board[y2 * N] === 3);
        assert('切れ目には置けない', isValidPlacement([{ x: 0, y: y1 }], 1) === false && isValidPlacement([{ x: 5, y: y2 }], 1) === false);
        assert('帯の中は置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        const seen = new Set([0]);
        const q = [0];
        while (q.length) {
            const i = q.pop();
            getNeighbors(i).forEach(n => { if (board[n] === 0 && !seen.has(n)) { seen.add(n); q.push(n); } });
        }
        assert('帯は分断されている', !seen.has((y1 + 1) * N));
    `,
};
