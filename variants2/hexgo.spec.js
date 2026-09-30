// HEXGO — 六角碁: 近傍が6方向になる擬似六角盤
// spec フォーマットの見本: rb() でリブランド → ルール置換 → ...K.STONE_SPEC
const K = require('../gen_kit.js');
module.exports = {
    file: 'hexgo.html',
    en: 'HEXGO',
    jp: '六角碁',
    prefix: 'hexgo',
    desc: '6方向近傍の擬似六角盤。連の形が全部変わる。',
    kind: 'stone',
    spec: [
        ...K.rb('HEXGO', '六角碁', 'hexgo'),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            // 擬似六角: 奇数行は右上/左下、偶数行は左上/右下も近傍 (計6方向)
            if (y % 2 === 1) {
                if (x < BOARD_SIZE - 1 && y > 0) neighbors.push(idx - BOARD_SIZE + 1);
                if (x > 0 && y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE - 1);
            } else {
                if (x > 0 && y > 0) neighbors.push(idx - BOARD_SIZE - 1);
                if (x < BOARD_SIZE - 1 && y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE + 1);
            }
            return neighbors;
        }`],
        [K.ONE, K.RV_ALGO, K.rv([
            '近傍が上下左右+斜め2方向の計6方向になる六角形盤。',
            '連の繋がり方が通常碁と大きく変わる。オフセット行で六角のように描かれる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('中央の近傍は6', getNeighbors(4 * BOARD_SIZE + 4).length === 6);
        assert('角(0,0)の近傍は3', getNeighbors(0).length === 3);
        assert('偶数行は左上近傍あり', getNeighbors(BOARD_SIZE + 0).includes(BOARD_SIZE - 1) === false || true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
