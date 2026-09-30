// PEAKGO — 高峰碁: 上端ほど標高が高い山。終局時の自石の標高合計で勝負
const K = require('../gen_kit.js');
module.exports = {
    file: 'peakgo.html',
    en: 'PEAKGO',
    jp: '高峰碁',
    prefix: 'peakgo',
    desc: '盤は山。上ほど標高が高く、終局時の自石の標高合計が得点になる。',
    kind: 'peak',
    spec: [
        ...K.rb('PEAKGO', '高峰碁', 'peakgo'),
        [K.ONE, `        function endGameByScore() {`, `
        // 標高得点: 上端ほど高い (y=0で最大 BOARD_SIZE-1)
        function peakScore(player) {
            let s = 0;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y * BOARD_SIZE + x] === player) s += BOARD_SIZE - 1 - y;
            }
            return s;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + peakScore(1);
            const whiteTotal = territory.white + captures[2] + komi + peakScore(2);`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の標高:</span> <strong>\${peakScore(1)}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の標高:</span> <strong>\${peakScore(2)}</strong></div>`],
        // 標高グラデーション (上ほど明るく雪がかかる演出)
        K.CUE_GRID(`            // 標高帯: 上に行くほど白っぽく (雪山演出)
            {
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const a = 0.18 * (1 - y / (BOARD_SIZE - 1));
                    if (a <= 0.01) continue;
                    ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
                    ctx.fillRect(padding, padding + y * cellSize - cellSize / 2, width - padding * 2, cellSize);
                }
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は上に行くほど高い雪山 (白い斜面で標高を表示)。',
            '終局時、各自の石に標高 (上端が最高点) の合計が得点になる。高峰を目指せ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        board[0] = 1; // (0,0) 最頂上
        assert('頂上の石は最大標高', peakScore(1) === BOARD_SIZE - 1);
        board[(BOARD_SIZE - 1) * BOARD_SIZE + 0] = 1; // 麓
        assert('麓の石は0点で合計不変', peakScore(1) === BOARD_SIZE - 1);
        board[0 * BOARD_SIZE + 1] = 2;
        assert('白も同じ標高', peakScore(2) === BOARD_SIZE - 1);
        assert('起動着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
