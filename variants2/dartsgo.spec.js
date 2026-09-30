// DARTSGO — 的碁: 天元を中心とする同心円の「的」に近い石ほど高得点
const K = require('../gen_kit.js');
module.exports = {
    file: 'dartsgo.html',
    en: 'DARTSGO',
    jp: '的碁',
    prefix: 'dartsgo',
    desc: '天元に近い石ほど高得点 (中心3点・1距離2点・2距離1点)。',
    kind: 'dart',
    spec: [
        ...K.rb('DARTSGO', '的碁', 'dartsgo'),
        // 的得点ヘルパー (終局時加算)
        [K.ONE, `        function endGameByScore() {`, `
        // 的ボーナス: 天元からのマンハッタン距離2以内の自石に (3-距離) 点
        function dartScore(player) {
            const cc = Math.floor(BOARD_SIZE / 2);
            let s = 0;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y * BOARD_SIZE + x] !== player) continue;
                const d = Math.abs(x - cc) + Math.abs(y - cc);
                if (d <= 2) s += 3 - d;
            }
            return s;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + dartScore(1);
            const whiteTotal = territory.white + captures[2] + komi + dartScore(2);`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の的ボーナス:</span> <strong>\${dartScore(1)}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の的ボーナス:</span> <strong>\${dartScore(2)}</strong></div>`],
        // 命中表示: 的の中に刺さった石は即座に得点を告げる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            {
                const cc = Math.floor(BOARD_SIZE / 2);
                move.cells.forEach(p => {
                    const d = Math.abs(p.x - cc) + Math.abs(p.y - cc);
                    if (d > 2) return;
                    const i = p.y * BOARD_SIZE + p.x;
                    if (d === 0) {
                        fxGlow(i, '#facc15', 1000);
                        fxBurst(i, '#fca5a5', 10, 1.4);
                        fxText(i, 'BULL!', '#facc15', 1300);
                    } else {
                        fxText(i, '+' + (3 - d), '#fca5a5', 1000);
                    }
                });
            }

            turn = opponent;`],
        // 的の同心円を描く
        K.CUE_STARS(`            {
                const cc = Math.floor(BOARD_SIZE / 2);
                const bx = padding + cc * cellSize, by = padding + cc * cellSize;
                ctx.save();
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                for (let r = 2; r >= 1; r--) {
                    ctx.globalAlpha = r === 2 ? 0.45 : 0.6;
                    ctx.beginPath();
                    ctx.arc(bx, by, r * cellSize, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.globalAlpha = 0.9;
                ctx.beginPath();
                ctx.arc(bx, by, cellSize * 0.12, 0, Math.PI * 2);
                ctx.fillStyle = '#dc2626';
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '天元を中心とする的 (赤い同心円): 終局時に的の中の自石がボーナス得点になる。',
            '中心=3点、距離1=2点、距離2=1点 (マンハッタン距離)。中央の取り合いが熱い。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const c = Math.floor(BOARD_SIZE / 2);
        board[c * BOARD_SIZE + c] = 1;
        assert('中心の石は3点', dartScore(1) === 3);
        board[c * BOARD_SIZE + (c + 1)] = 1;
        assert('隣の石は2点で合計5', dartScore(1) === 5);
        board[(c + 2) * BOARD_SIZE + c] = 1;
        assert('距離2は1点で合計6', dartScore(1) === 6);
        board[0] = 1;
        assert('的外は0点のまま', dartScore(1) === 6);
        assert('白は0点', dartScore(2) === 0);
    `,
};
