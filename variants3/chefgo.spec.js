// CHEFGO — 料理碁: 取った石は「調理済み」で2倍計上。終局時に盤上の生の石は価値半減
const K = require('../gen_kit.js');
module.exports = {
    file: 'chefgo.html',
    en: 'CHEFGO',
    jp: '料理碁',
    prefix: 'chefgo',
    desc: '取った食材は調理済みで2倍。盤上に残った生の石は1個ごとに-0.5目。',
    kind: 'stone',
    icon: 'chefgo',
    spec: [
        ...K.rb('CHEFGO', '料理碁', 'chefgo'),
        K.params([
            { key: 'cook_mult', label: '調理済み倍率', min: 1, max: 4, def: 2, unit: '倍' },
            { key: 'raw_penalty', label: '生の石の減点', min: 0, max: 1, step: 0.1, def: 0.5, unit: '目/個' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        // 取った石は「調理済み」: アゲハマが2倍になる
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length * (P('cook_mult') || 2); // 調理済み: 倍率計上
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                captured.forEach(idx => fxGlow(idx, '#f97316', 700));
                fxText(ci, '調理済み ×' + (P('cook_mult') || 2), '#fb923c', 1100);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 終局時: 盤上に残った「生」の石は1個ごとに0.5目減点
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const raw1 = board.filter(v => v === 1).length;
            const raw2 = board.filter(v => v === 2).length;
            const _rp = P('raw_penalty') ?? 0.5;
            const blackTotal = territory.black + captures[1] - raw1 * _rp;
            const whiteTotal = territory.white + captures[2] + komi - raw2 * _rp;`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ(調理済):</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の生減点:</span> <strong>-\${board.filter(v => v === 1).length * (P('raw_penalty') ?? 0.5)}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ(調理済):</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の生減点:</span> <strong>-\${board.filter(v => v === 2).length * (P('raw_penalty') ?? 0.5)}</strong></div>`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り終局: 交点数の一定割合の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 生の石に小さな鍋マーク
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = Math.round(cellSize * 0.42) + 'px sans-serif';
                pieces.forEach(pc => {
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] !== pc.player) return;
                        const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                        ctx.fillText('🍳', cx, cy + cellSize * 0.02);
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            料理碁: 取った食材は調理済みで2倍計上。盤上の生の石は1個ごとに-0.5目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石は食材。取った石は「調理済み」となりアゲハマが2倍計上される。',
            '終局時に盤上に残った生の石は1個ごとに-0.5目。置きすぎも損になる。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof executeMove === 'function');
        // 白1石を取る → 調理済み2点
        board[1 * BOARD_SIZE + 1] = 2;
        board[0 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 0] = 1; board[1 * BOARD_SIZE + 2] = 1;
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1);
        assert('調理済みは2倍', captures[1] === 2);
        // 盤上の石は生カウント (取った石を囲んだ3個+打った石の4個)
        assert('生の石が盤上に残る', board.filter(v => v === 1).length === 4);
        // スコア計算で生減点が効く (エラーなく終局する)
        endGameByScore();
        assert('終局できる', gameOver === true);
        assert('結果が出る', !!gameResultData);
    `,
};
