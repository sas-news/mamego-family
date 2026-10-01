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
        K.params([
            { key: 'peak_weight', label: '標高の得点重み', min: 0, max: 4, def: 1, step: 0.5 },
        ]),
        [K.ONE, `        function endGameByScore() {`, `
        // 標高得点: 上端ほど高い (y=0で最大 BOARD_SIZE-1)
        function peakScore(player) {
            let s = 0;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y * BOARD_SIZE + x] === player) s += (BOARD_SIZE - 1 - y) * (P('peak_weight') || 1);
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
        K.CUE_GRID(`            // 標高帯 + 等高線 + 右端の標高数値
            {
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const a = 0.18 * (1 - y / (BOARD_SIZE - 1));
                    if (a > 0.01) {
                        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
                        ctx.fillRect(padding, padding + y * cellSize - cellSize / 2, width - padding * 2, cellSize);
                    }
                    ctx.strokeStyle = 'rgba(120,150,190,0.30)';
                    ctx.lineWidth = Math.max(0.8, cellSize * 0.025);
                    ctx.beginPath();
                    ctx.moveTo(padding - cellSize * 0.5, padding + y * cellSize - cellSize / 2);
                    ctx.lineTo(width - padding + cellSize * 0.5, padding + y * cellSize - cellSize / 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(80,110,150,0.85)';
                    ctx.font = (cellSize * 0.26).toFixed(1) + 'px sans-serif';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(String(BOARD_SIZE - 1 - y), width - padding + cellSize * 0.4, padding + y * cellSize);
                }
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は上に行くほど高い雪山 (白い斜面で標高を表示)。',
            '終局時、各自の石に標高 (上端が最高点) の合計が得点になる。高峰を目指せ。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        // 降雪: 上層ほど強い粉雪
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            for (let k = 0; k < 26; k++) {
                const t = ((now / 4200) + k * 0.618) % 1;
                const sx = ((k * 97.3) % w) + Math.sin(now / 1500 + k) * cs * 0.3;
                const sy = pad + t * (BOARD_SIZE - 1) * cs;
                const depth = 1 - (sy - pad) / ((BOARD_SIZE - 1) * cs);
                ctx2.fillStyle = 'rgba(255,255,255,' + (0.12 + depth * 0.5).toFixed(3) + ')';
                ctx2.beginPath();
                ctx2.arc(sx, sy, cs * (0.03 + depth * 0.05), 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        ...K.MOVE_CAP_SPEC,
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
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
