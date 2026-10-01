// LIBRARYGO — 蔵書碁: 盤は3x3の書棚ブロック群。書棚を「分類」(一方が4石以上・敵1以下)すると蔵書得点。
const K = require('../gen_kit.js');

const PASS_END = [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`];

const CAP = `
            // 打ち切り: 交点数x1.1を超えた長期戦は採点終局 (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                return;
            }
`;

module.exports = {
    file: 'librarygo.html',
    en: 'LIBRARYGO',
    jp: '蔵書碁',
    prefix: 'librarygo',
    desc: '盤は3x3の書棚群。棚を自分色に分類すれば蔵書得点。',
    kind: 'stone',
    icon: 'librarygo',
    spec: [
        ...K.rb('LIBRARYGO', '蔵書碁', 'librarygo'),
        K.params([
            { key: 'shelf_mine', label: '分類に要する自石', min: 2, max: 9, def: 4, hint: '棚を分類する自石の最低数' },
            { key: 'shelf_foe', label: '許容する敵石', min: 0, max: 4, def: 1, hint: '分類を妨げない敵石の上限' },
            { key: 'shelf_pts', label: '棚1つの得点', min: 0, max: 12, def: 4, hint: '分類済み棚1つにつき加点' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 1.1, step: 0.05, hint: '交点数×倍率' },
        ]),
        // 書棚スコア: 3x3ブロックごとに、自石>=shelf_mine かつ 敵石<=shelf_foe なら「分類済み」+shelf_pts
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            // 蔵書碁: 書棚(3x3ブロック)を分類した側に+4
            const shelfScore = (p, q) => {
                let pts = 0;
                for (let by = 0; by < BOARD_SIZE; by += 3) {
                    for (let bx = 0; bx < BOARD_SIZE; bx += 3) {
                        let mine = 0, foe = 0;
                        for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) {
                            const x = bx + dx, y = by + dy;
                            if (x >= BOARD_SIZE || y >= BOARD_SIZE) continue;
                            const v = board[y * BOARD_SIZE + x];
                            if (v === p) mine++; else if (v === q) foe++;
                        }
                        if (mine >= (P('shelf_mine') || 4) && foe <= (P('shelf_foe') ?? 1)) pts += (P('shelf_pts') || 4);
                    }
                }
                return pts;
            };
            const shelfB = shelfScore(1, 2), shelfW = shelfScore(2, 1);
            const blackTotal = territory.black + captures[1] + shelfB;
            const whiteTotal = territory.white + captures[2] + shelfW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の蔵書:</span> <strong>\${shelfB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の蔵書:</span> <strong>\${shelfW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 書棚の境界線: 3マスごとの区切りを本棚の棚板風に太く
        K.CUE_GRID(`            // 書棚の棚板: 3x3ブロック境界を太線で
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.75);
                ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                for (let i = 3; i < BOARD_SIZE; i += 3) {
                    const pos = padding + i * cellSize - cellSize * 0.5;
                    ctx.beginPath(); ctx.moveTo(pos, padding); ctx.lineTo(pos, padding + (BOARD_SIZE - 1) * cellSize); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(padding, pos); ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize, pos); ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
${CAP}
            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`(() => { const mn = P('shelf_mine') || 4, fe = (P('shelf_foe') ?? 1); let b = 0, w = 0; for (let by = 0; by < BOARD_SIZE; by += 3) for (let bx = 0; bx < BOARD_SIZE; bx += 3) { let m1 = 0, m2 = 0; for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) { const v = board[(by + dy) * BOARD_SIZE + bx + dx] || 0; if (v === 1) m1++; else if (v === 2) m2++; } if (m1 >= mn && m2 <= fe) b++; if (m2 >= mn && m1 <= fe) w++; } return '書棚 黒' + b + ' / 白' + w; })()`),
        [K.ONE, K.INFO_ALGO, `            蔵書碁: 盤は3x3の書棚。棚を自分の石4個以上・敵1以下で「分類」すると+4<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は3x3のブロックに区切られた書棚群 (太線が棚板)。',
            '書棚の中に自分の石が4個以上・相手の石が1個以下なら「分類済み」— 終局時に棚1つにつき+4目。',
            '敵石を2個以上紛れ込ませると棚は「未分類」のまま。分類の妨害も立派な戦略。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 左上の書棚に黒4・白1 → 黒の分類済み棚
        board[0] = 1; board[1] = 1; board[BOARD_SIZE] = 1; board[BOARD_SIZE + 1] = 1; board[2] = 2;
        endGameByScore();
        assert('書棚の分類得分が結果に反映', gameResultData.details.includes('蔵書'));
        assert('黒の蔵書は4点', gameResultData.details.includes('黒の蔵書:</span> <strong>4</strong>'));
        board[0] = 2; board[1] = 2; board[BOARD_SIZE + 1] = 2; // 敵が4個になると棚は敵のもの
        endGameByScore();
        assert('敵が取った棚は敵の蔵書', gameResultData.details.includes('白の蔵書:</span> <strong>4</strong>'));
    `,
};
