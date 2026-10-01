// DISTGO — 距離碁: 自陣から遠くまで進軍した石ほど得点が高い
const K = require('../gen_kit.js');
module.exports = {
    file: 'distgo.html',
    en: 'DISTGO',
    jp: '距離碁',
    prefix: 'distgo',
    desc: '自陣の端からの距離が得点。黒は下へ、白は上へ進軍するほど加点。',
    kind: 'dist',
    spec: [
        ...K.rb('DISTGO', '距離碁', 'distgo'),
        K.params([
            { key: 'dist_mult', label: '距離点の倍率', min: 0, max: 4, def: 1, step: 0.5, unit: '倍' },
        ]),
        [K.ONE, `        function endGameByScore() {`, `
        // 距離得点: 黒は上端(y=0)から、白は下端(y=末)からの行数の合計×倍率 (倍率は設定で調整)
        function distScore(player) {
            const m = P('dist_mult') ?? 1;
            let s = 0;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y * BOARD_SIZE + x] !== player) continue;
                s += (player === 1 ? y : (BOARD_SIZE - 1 - y)) * m;
            }
            return s;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + distScore(1);
            const whiteTotal = territory.white + captures[2] + komi + distScore(2);`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の距離点:</span> <strong>\${distScore(1)}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の距離点:</span> <strong>\${distScore(2)}</strong></div>`],
        // 自陣帯: 上端=黒陣(暗), 下端=白陣(明)
        K.CUE_GRID(`            // 自陣帯と進軍方向: 上=黒本陣(▼で下へ進軍), 下=白本陣(▲で上へ進軍)
            {
                const bw = width - padding * 2;
                const t = cellSize * 0.30;
                ctx.save();
                ctx.fillStyle = 'rgba(30,30,30,0.20)';
                ctx.fillRect(padding, padding - t / 2, bw, t);
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.fillRect(padding, width - padding - t / 2, bw, t);
                // 進軍勾配: 黒の目的地(下)ほど暗く、白の目的地(上)ほど明るい
                const g = ctx.createLinearGradient(0, padding, 0, width - padding);
                g.addColorStop(0, 'rgba(255,255,255,0.10)');
                g.addColorStop(1, 'rgba(30,30,30,0.10)');
                ctx.fillStyle = g;
                ctx.fillRect(padding, padding, bw, width - padding * 2);
                // 両端の進軍矢印 (左=黒▼, 右=白▲)
                ctx.font = 'bold ' + Math.round(cellSize * 0.40) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let k = 0; k < 3; k++) {
                    const ay = padding + (BOARD_SIZE - 1) / 2 * cellSize + (k - 1) * cellSize * 2;
                    ctx.fillStyle = 'rgba(30,30,30,0.5)';
                    ctx.fillText('▼', padding - cellSize * 0.55, ay);
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.fillText('▲', width - padding + cellSize * 0.55, ay);
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '黒の本陣は上端、白の本陣は下端。終局時、各自の石に「本陣からの距離」が得点になる。',
            '遠くまで進軍した石ほど高得点。地取りに加えて侵攻距離を競う。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        board[0] = 1; // 黒 (0,0): 距離0
        assert('本陣の石は0点', distScore(1) === 0);
        board[(BOARD_SIZE - 1) * BOARD_SIZE + 0] = 1; // 黒 (0,末): 距離B-1
        assert('敵陣端で最大距離', distScore(1) === BOARD_SIZE - 1);
        board[0 * BOARD_SIZE + 1] = 2; // 白 (1,0): 距離B-1
        assert('白は逆方向採点', distScore(2) === BOARD_SIZE - 1);
        assert('起動着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
