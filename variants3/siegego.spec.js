// SIEGEGO — 攻城碁: 中央の城壁を越えて敵本丸 (相手陣の城点) に石を置けば即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'siegego.html',
    en: 'SIEGEGO',
    jp: '攻城碁',
    prefix: 'siegego',
    desc: '城壁で二分された盤。敵本丸の城点に石を入れれば即勝利。',
    kind: 'stone',
    icon: 'siegego',
    spec: [
        ...K.rb('SIEGEGO', '攻城碁', 'siegego'),
        // 初期盤: 中央行を城壁 (3) で塞ぐ。門は3箇所
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 城壁: 中央行を塀で塞ぎ、3つの門を残す
            {
                const mid = Math.floor(BOARD_SIZE / 2);
                const gates = [Math.floor(BOARD_SIZE / 4), mid, Math.floor(BOARD_SIZE * 3 / 4)];
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!gates.includes(x)) board[mid * BOARD_SIZE + x] = 3;
                }
            }`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        // 敵本丸陥落判定: 着手後、相手の城点に自石があれば即勝ち
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 攻城判定: 敵本丸を占拠したら即勝ち
            {
                const mid = Math.floor(BOARD_SIZE / 2);
                const enemyKeep = player === 1 ? 1 * BOARD_SIZE + mid : (BOARD_SIZE - 2) * BOARD_SIZE + mid;
                if (board[enemyKeep] === player) {
                    fxGlow(enemyKeep, '#facc15', 1000);
                    fxText(enemyKeep, '本丸陥落!', '#facc15', 1400);
                    fxShake(7, 420);
                    winByRule(player, '攻城勝ち', '敵の本丸を落としました'); return;
                }
            }

            // 打ち切り終局
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 城壁は「彫り込み石垣」で描画
        ...K.WALL_SPEC,
        // 本丸マーカー: 両陣の城点に櫓を描く
        K.CUE_STARS(`            // 本丸: 敵味方それぞれの城点に櫓印
            {
                const mid = Math.floor(BOARD_SIZE / 2);
                [[mid, BOARD_SIZE - 2, '#1c1917'], [mid, 1, '#fef3c7']].forEach(([kx, ky, col]) => {
                    const cx = padding + kx * cellSize, cy = padding + ky * cellSize;
                    ctx.save();
                    ctx.strokeStyle = col === '#1c1917' ? 'rgba(60,40,20,0.85)' : 'rgba(150,100,30,0.85)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.strokeRect(cx - cellSize * 0.3, cy - cellSize * 0.3, cellSize * 0.6, cellSize * 0.6);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.42, cy - cellSize * 0.3);
                    ctx.lineTo(cx, cy - cellSize * 0.55);
                    ctx.lineTo(cx + cellSize * 0.42, cy - cellSize * 0.3);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(200,60,50,0.9)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.09, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            }`),
        [K.ONE, K.INFO_ALGO, `            攻城碁: 城壁の門を抜けて敵本丸 (敵陣の城点) に石を入れれば即勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央を城壁が横断し、3つの門だけが行き来できる。壁は呼吸点にならず置くこともできない。',
            '敵陣奥の本丸 (城点) に自分の石を置けば攻城勝ち。防がれれば通常の地取り勝負。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const mid = Math.floor(BOARD_SIZE / 2);
        const gates = [Math.floor(BOARD_SIZE / 4), mid, Math.floor(BOARD_SIZE * 3 / 4)];
        assert('中央行は壁', board[mid * BOARD_SIZE + mid - 1] === 3);
        assert('門は空いている', gates.every(g => board[mid * BOARD_SIZE + g] === 0));
        assert('壁には置けない', isValidPlacement([{ x: mid - 1, y: mid }], 1) === false);
        // 敵本丸陥落
        board.fill(0);
        executeMove({ cells: [{ x: mid, y: 1 }] }, 1);
        assert('敵本丸占拠で即勝ち', gameOver === true && gameResultData && gameResultData.title.includes('攻城'));
    `,
};
