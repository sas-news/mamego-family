// HEXYGO — 六角辺碁: 6方向近傍 + 辺 (盤端) の地が2倍
const K = require('../gen_kit.js');
module.exports = {
    file: 'hexygo.html',
    en: 'HEXYGO',
    jp: '六角辺碁',
    prefix: 'hexygo',
    desc: '6方向近傍の擬似六角盤。さらに辺の地は2倍計算で端の争いが熱い。',
    kind: 'stone',
    spec: [
        ...K.rb('HEXYGO', '六角辺碁', 'hexygo'),
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
        // 辺の地は2倍にする集計
        [K.ONE, `                    if (touchesBlack && !touchesWhite) blackTerritory += region.length;
                    else if (touchesWhite && !touchesBlack) whiteTerritory += region.length;`,
`                    const wsum = arr => arr.reduce((s, i2) => {
                        const wx = i2 % BOARD_SIZE, wy = Math.floor(i2 / BOARD_SIZE);
                        const isEdge = wx === 0 || wy === 0 || wx === BOARD_SIZE - 1 || wy === BOARD_SIZE - 1;
                        return s + (isEdge ? 2 : 1);
                    }, 0);
                    if (touchesBlack && !touchesWhite) blackTerritory += wsum(region);
                    else if (touchesWhite && !touchesBlack) whiteTerritory += wsum(region);`],
        // 辺の帯をうっすら強調
        K.CUE_GRID(`            // 辺の帯を強調 (地2倍エリア)
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.45);
                ctx.lineWidth = cellSize * 0.5;
                ctx.globalAlpha = 0.25;
                ctx.strokeRect(padding, padding, (BOARD_SIZE - 1) * cellSize, (BOARD_SIZE - 1) * cellSize);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            六角辺碁: 6方向近傍の擬似六角盤。辺の地は2倍計算<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '近傍が上下左右+斜め2方向の計6方向になる六角形盤。連の形が大きく変わる。',
            'さらに地集計では盤端 (辺) の空点が1点2目で計算される。辺の取り合いが勝敗を分ける。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        assert('中央の近傍は6', getNeighbors(6 * BOARD_SIZE + 6).length === 6);
        assert('角の近傍は3', getNeighbors(0).length === 3);
        board[1] = 1; board[BOARD_SIZE] = 1; board[BOARD_SIZE + 1] = 1;
        const t = calculateTerritory();
        let cells = 0, edge = 0;
        for (let i = 0; i < board.length; i++) {
            if (board[i] !== 0) continue;
            const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
            cells++;
            if (x === 0 || y === 0 || x === BOARD_SIZE - 1 || y === BOARD_SIZE - 1) edge++;
        }
        assert('辺の地は2倍', t.black === cells + edge);
    `,
};
