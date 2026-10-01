// RIPPLEGO — 同心碁: 波紋は中心対称に干渉する。対蹠点がもう1つの近傍
const K = require('../gen_kit.js');
module.exports = {
    file: 'ripplego.html',
    en: 'RIPPLEGO',
    jp: '同心碁',
    prefix: 'ripplego',
    desc: '波紋は中心対称に干渉する — 対蹠点が5つ目の近傍。呼吸の場所が全部変わる。',
    kind: 'stone',
    icon: 'ripplego',
    spec: [
        ...K.rb('RIPPLEGO', '同心碁', 'ripplego'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            // 同心波: 波紋は中心に対して対称に干渉する — 対蹠点も近傍
            const c = (BOARD_SIZE - 1) / 2;
            const ai = (2 * c - y) * BOARD_SIZE + (2 * c - x);
            if (ai !== idx) neighbors.push(ai);
            return neighbors;
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
        K.CUE_GRID(`            // 同心円の波紋ガイド (盤の雰囲気だけ、ルールには影響しない)
            {
                ctx.save();
                const c = (BOARD_SIZE - 1) / 2;
                const ccx = padding + c * cellSize, ccy = padding + c * cellSize;
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.35);
                [2, 4, 6].forEach(rr => {
                    ctx.lineWidth = Math.max(1, cellSize * 0.03);
                    ctx.beginPath();
                    ctx.arc(ccx, ccy, rr * cellSize, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石は波紋。各交点は上下左右に加え、中心を挟んだ反対側の点 (対蹠点) とも結ばれる。',
            '連の形と呼吸点が大きく変わる。波の干渉は両者に同じように働く。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('角の対蹠点が近傍', getNeighbors(0).includes(BOARD_SIZE * BOARD_SIZE - 1));
        assert('角の近傍は3', getNeighbors(0).length === 3);
        assert('天元の近傍は4 (対蹠点は自分自身)', getNeighbors(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2)).length === 4);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
