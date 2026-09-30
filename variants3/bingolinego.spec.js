// BINGOLINEGO — 釣合碁: 斜め方向に自石が5個以上連なると、その長さ分のビンゴボーナス地
const K = require('../gen_kit.js');
module.exports = {
    file: 'bingolinego.html',
    en: 'BINGOLINEGO',
    jp: '釣合碁',
    prefix: 'bingolinego',
    desc: '斜め(↘/↗)に自石が5個以上連なると連なりの長さだけビンゴボーナス地。',
    kind: 'stone',
    icon: 'bingolinego',
    spec: [
        ...K.rb('BINGOLINEGO', '釣合碁', 'bingolinego'),
        // ビンゴ採点: 斜めの最長連 (5以上) の長さがそのまま加点
        [K.ONE, `        function endGameByScore() {`, `
        function bingoBonus(player) {
            let bonus = 0;
            const dirs = [[1, 1], [1, -1]];
            dirs.forEach(([dx, dy]) => {
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    // 連の開始点のみ数える
                    const px = x - dx, py = y - dy;
                    if (px >= 0 && px < BOARD_SIZE && py >= 0 && py < BOARD_SIZE &&
                        board[py * BOARD_SIZE + px] === player) continue;
                    let len = 0;
                    let cx = x, cy = y;
                    while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE &&
                           board[cy * BOARD_SIZE + cx] === player) {
                        len++; cx += dx; cy += dy;
                    }
                    if (len >= 5) bonus += len;
                }
            });
            return bonus;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + bingoBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + bingoBonus(2);`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒のビンゴ:</span> <strong>+\${bingoBonus(1)}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白のビンゴ:</span> <strong>+\${bingoBonus(2)}</strong></div>`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        // 斜め連の予告: 4連以上を淡く光らせる
        ...K.STONE_MARKS_SPEC(`            {
                const dirs = [[1, 1], [1, -1]];
                ctx.save();
                [1, 2].forEach(pl => {
                    dirs.forEach(([dx, dy]) => {
                        for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                            const px = x - dx, py = y - dy;
                            if (px >= 0 && px < BOARD_SIZE && py >= 0 && py < BOARD_SIZE &&
                                board[py * BOARD_SIZE + px] === pl) continue;
                            let len = 0, cx = x, cy = y;
                            while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE &&
                                   board[cy * BOARD_SIZE + cx] === pl) { len++; cx += dx; cy += dy; }
                            if (len >= 4) {
                                ctx.strokeStyle = pl === 1 ? 'rgba(250, 204, 21, 0.7)' : 'rgba(250, 204, 21, 0.9)';
                                ctx.lineWidth = Math.max(1.5, cellSize * 0.08);
                                ctx.beginPath();
                                ctx.moveTo(padding + x * cellSize, padding + y * cellSize);
                                ctx.lineTo(padding + (x + dx * (len - 1)) * cellSize, padding + (y + dy * (len - 1)) * cellSize);
                                ctx.stroke();
                            }
                        }
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            釣合碁: 斜めに自石が5個以上連なると長さ分のビンゴボーナス地<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '斜め方向 (↘または↗) に自分の石が5個以上連なると「ビンゴ」成立。',
            '終局時、成立した各連の長さがそのままボーナス地になる (4連は金色の予告線)。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動', typeof bingoBonus === 'function');
        assert('初期は0', bingoBonus(1) === 0);
        for (let i = 0; i < 5; i++) board[(i + 1) * BOARD_SIZE + (i + 1)] = 1;
        assert('5連で+5', bingoBonus(1) === 5);
        board[6 * BOARD_SIZE + 6] = 1;
        assert('6連で+6', bingoBonus(1) === 6);
        // 逆斜めは別系統
        for (let i = 0; i < 5; i++) board[i * BOARD_SIZE + (8 - i)] = 2;
        assert('白の↗連も数える', bingoBonus(2) === 5);
        assert('通常着手は合法', isValidPlacement([{ x: 11, y: 11 }], 1) === true);
    `,
};
