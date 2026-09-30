// MAHJONGGO — 雀碁: 石の並びが役になって終局時に加算される
const K = require('../gen_kit.js');
module.exports = {
    file: 'mahjonggo.html',
    en: 'MAHJONGGO',
    jp: '雀碁',
    prefix: 'mahjonggo',
    desc: '並びが役に。対子+1/刻子+3/槓子+6/5連以上は役満+10を終局加算。',
    kind: 'stone',
    spec: [
        ...K.rb('MAHJONGGO', '雀碁', 'mahjonggo'),
        [K.ONE, `        function endGameByScore() {`,
`        // 雀碁: 縦横の同色並びを役として得点化 (2連=対子+1 / 3連=刻子+3 / 4連=槓子+6 / 5連以上=役満+10)
        function mahjongBonus() {
            const bonus = { 1: 0, 2: 0 };
            const table = l => (l >= 5 ? 10 : l === 4 ? 6 : l === 3 ? 3 : l === 2 ? 1 : 0);
            for (let y = 0; y < BOARD_SIZE; y++) {
                let run = 0, col = 0;
                for (let x = 0; x <= BOARD_SIZE; x++) {
                    const v = x < BOARD_SIZE ? board[y * BOARD_SIZE + x] : 0;
                    if (v !== 0 && v === col) { run++; }
                    else {
                        if (col !== 0) bonus[col] += table(run);
                        col = v; run = v !== 0 ? 1 : 0;
                    }
                }
            }
            for (let x = 0; x < BOARD_SIZE; x++) {
                let run = 0, col = 0;
                for (let y = 0; y <= BOARD_SIZE; y++) {
                    const v = y < BOARD_SIZE ? board[y * BOARD_SIZE + x] : 0;
                    if (v !== 0 && v === col) { run++; }
                    else {
                        if (col !== 0) bonus[col] += table(run);
                        col = v; run = v !== 0 ? 1 : 0;
                    }
                }
            }
            return bonus;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const yaku = mahjongBonus();
            const blackTotal = territory.black + captures[1] + yaku[1];
            const whiteTotal = territory.white + captures[2] + komi + yaku[2];`],
        [K.ONE, `<div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`<div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>
                    <div class="flex justify-between"><span>役ボーナス:</span> <strong>黒+\${yaku[1]} / 白+\${yaku[2]}</strong></div>`],
        [K.ONE, K.INFO_ALGO, `            雀碁: 石の並びが役になる。対子/刻子/槓子/役満を終局加算<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '終局時、縦横の同色の連続した並びが役として加算される。',
            '2連=対子+1目 / 3連=刻子+3目 / 4連=槓子+6目 / 5連以上=役満+10目。',
            '並びを作る形と地取りを両立させる牌理の碁。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        // 牌の顔: 全石を角丸の麻雀牌に見立て、3連以上の牌に金の役印を捺す
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    const w = cellSize * 0.86, h = cellSize * 0.70;
                    ctx.fillStyle = v === 1 ? '#20405c' : '#f4efe0';
                    ctx.strokeStyle = v === 1 ? '#0c1f30' : '#8a7a55';
                    ctx.lineWidth = Math.max(1, cellSize * 0.045);
                    ctx.beginPath();
                    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, w * 0.16);
                    ctx.fill(); ctx.stroke();
                    ctx.fillStyle = v === 1 ? '#8fd3a8' : '#20405c';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.13, 0, Math.PI * 2);
                    ctx.fill();
                }
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const v = board[y * BOARD_SIZE + x];
                    if (v !== 1 && v !== 2) continue;
                    for (const [dx, dy] of [[1, 0], [0, 1]]) {
                        const px = x - dx, py = y - dy;
                        if (px >= 0 && py >= 0 && board[py * BOARD_SIZE + px] === v) continue;
                        let run = 1;
                        while (x + dx * run < BOARD_SIZE && y + dy * run < BOARD_SIZE && board[(y + dy * run) * BOARD_SIZE + (x + dx * run)] === v) run++;
                        if (run < 3) continue;
                        for (let k = 0; k < run; k++) {
                            const cx = padding + (x + dx * k) * cellSize, cy = padding + (y + dy * k) * cellSize;
                            ctx.fillStyle = '#f5c542';
                            ctx.beginPath();
                            ctx.arc(cx + cellSize * 0.30, cy - cellSize * 0.30, cellSize * 0.09, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
                ctx.restore();
            }`),
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        board[0] = 1; board[1] = 1; board[2] = 1;
        assert('3連は刻子+3', mahjongBonus()[1] === 3);
        board[2] = 0;
        board[BOARD_SIZE] = 1; board[BOARD_SIZE + 1] = 1; board[BOARD_SIZE + 2] = 1;
        assert('縦横で役が積み上がる', mahjongBonus()[1] === 6);
        assert('白には加点なし', mahjongBonus()[2] === 0);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
