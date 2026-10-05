// ALTERNGO — 番兵碁: 黒は偶数行、白は奇数行にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'alterngo.html',
    en: 'ALTERNGO',
    jp: '番兵碁',
    prefix: 'alterngo',
    desc: '黒は偶数行、白は奇数行を守る番兵。交互の行で睨み合う碁。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'sentry',
    spec: [
        ...K.rb('ALTERNGO', '番兵碁', 'alterngo'),
        K.params([
            { key: 'row_period', label: '行の周期', options: [{ v: 2, l: '2行周期 (交互)' }, { v: 3, l: '3行周期 (中立行あり)' }], def: 2 },
            { key: 'ply_cap', label: '打ち切り手数', min: 0, max: 400, def: 0, unit: '手', hint: '0=制限なし' },
        ]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 番兵碁ルール: 黒は0行目、白は1行目の周期行のみ守備可 (周期は設定で調整)
            {
                const rp = Math.max(2, P('row_period') || 2);
                const own = player === 1 ? 0 : 1;
                for (const p of cells) {
                    if (p.y % rp !== own) return false;
                }
            }`],
        K.CUE_GRID(`            // 番兵: 担当外の行を薄く沈め、行の持ち主を端の●○で示す
            {
                ctx.save();
                const rp = Math.max(2, P('row_period') || 2);
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const rm = y % rp;
                    const isBlackRow = rm === 0;
                    const isWhiteRow = rm === 1;
                    ctx.fillStyle = alphaColor(
                        isBlackRow ? 'rgba(30,30,30,1)' : isWhiteRow ? 'rgba(240,240,240,1)' : 'rgba(150,150,150,1)', 0.07);
                    ctx.fillRect(-cellSize, padding + (y - 0.5) * cellSize,
                        padding * 2 + BOARD_SIZE * cellSize, cellSize);
                    // 番兵印: 左端に行の持ち主の●○
                    ctx.fillStyle = isBlackRow ? 'rgba(30,30,30,0.55)' : isWhiteRow ? 'rgba(255,255,255,0.8)' : 'rgba(150,150,150,0.8)';
                    ctx.beginPath();
                    ctx.arc(padding - cellSize * 0.55, padding + y * cellSize, cellSize * 0.10, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_BASE, K.rv([
            '黒は偶数行、白は奇数行にしか着手できない。互いに相手の行へは進めない。',
            '石は行ごとに層を成し、取り合いは行を跨ぐ連の切り結びになる。',
        ])],
        // 打ち切り手数 (0=制限なし): 設定で有効化すると超過時に強制採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 設定で有効化した場合、長期戦は強制採点 (1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && (P('ply_cap') || 0) > 0 && history.length >= (P('ply_cap') || 0)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        assert('黒は偶数行(0)に置ける', isValidPlacement([{ x: 3, y: 0 }], 1) === true);
        assert('黒は偶数行(4)に置ける', isValidPlacement([{ x: 3, y: 4 }], 1) === true);
        assert('黒は奇数行に置けない', isValidPlacement([{ x: 3, y: 3 }], 1) === false);
        assert('白は奇数行に置ける', isValidPlacement([{ x: 3, y: 3 }], 2) === true);
        assert('白は偶数行に置けない', isValidPlacement([{ x: 3, y: 4 }], 2) === false);
    `,
};
