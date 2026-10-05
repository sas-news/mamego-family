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
        K.params([
            { key: 'slit_count', label: '切れ目の本数', min: 1, max: 4, def: 2, unit: '本' },
        ]),
        // 行全体の壁が2本
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const cnt = Math.max(1, P('slit_count') || 2);
                for (let k = 1; k <= cnt; k++) {
                    const wy = Math.floor(k * BOARD_SIZE / (cnt + 1));
                    for (let x = 0; x < BOARD_SIZE; x++) board[wy * BOARD_SIZE + x] = 3;
                }
            }`],
        // 切れ目は青く光る深淵
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_RIFT('rgba(96,140,200,0.5)'))],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.RV_BASE, K.rv([
            '盤を横切る2本の切れ目 (行全体の壁) で3つの帯に分断。',
            '帯を越える手段はない。各帯で別々の地取り勝負。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
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
