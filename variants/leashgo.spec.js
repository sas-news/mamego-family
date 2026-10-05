// LEASHGO — 繋留碁: 最古の自石から距離3以内に繋がれている
const K = require('../gen_kit.js');
module.exports = {
    file: 'leashgo.html',
    en: 'LEASHGO',
    jp: '繋留碁',
    prefix: 'leashgo',
    desc: '着手は最古の自石から3マス以内。古い石に繋留されてしか広がれない。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'leash',
    spec: [
        ...K.rb('LEASHGO', '繋留碁', 'leashgo'),
        K.params([
            { key: 'leash_range', label: '繋留距離', min: 1, max: 8, def: 3, hint: 'アンカーからのチェビシェフ距離' },
        ]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 繋留碁ルール: 盤上に残る最古の自石 (アンカー) から
            // チェビシェフ距離3以内にのみ着手可 (初手は自由)
            {
                let anchor = null;
                for (const pc of pieces) {
                    if (pc.player !== player) continue;
                    const c0 = pc.cells[0];
                    if (board[c0.y * BOARD_SIZE + c0.x] === player) { anchor = c0; break; }
                }
                if (anchor) {
                    const lr = P('leash_range') || 3;
                    for (const p of cells) {
                        const d = Math.max(Math.abs(p.x - anchor.x), Math.abs(p.y - anchor.y));
                        if (d > lr) return false;
                    }
                }
            }`],
        K.CUE_GRID(`            // 繋留: アンカー石の係留圏 (周囲3マス) を薄く照らす
            {
                let anc = null;
                for (const pc of pieces) {
                    if (pc.player !== turn) continue;
                    const c0 = pc.cells[0];
                    if (board[c0.y * BOARD_SIZE + c0.x] === turn) { anc = c0; break; }
                }
                if (anc) {
                    const lr = P('leash_range') || 3;
                    ctx.save();
                    ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.12);
                    ctx.fillRect(padding + (anc.x - lr - 0.5) * cellSize, padding + (anc.y - lr - 0.5) * cellSize,
                        cellSize * (lr * 2 + 1), cellSize * (lr * 2 + 1));
                    ctx.restore();
                }
            }`),
        // 繋留: アンカー石に金環 + 破線の係留圏
        ...K.STONE_MARKS_SPEC(`            {
                let anc = null;
                for (const pc of pieces) {
                    if (pc.player !== turn) continue;
                    const c0 = pc.cells[0];
                    if (board[c0.y * BOARD_SIZE + c0.x] === turn) { anc = c0; break; }
                }
                if (anc) {
                    const ax = padding + anc.x * cellSize, ay = padding + anc.y * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(212,160,23,0.85)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                    ctx.setLineDash([cellSize * 0.2, cellSize * 0.14]);
                    ctx.beginPath();
                    ctx.arc(ax, ay, cellSize * ((P('leash_range') || 3) + 0.45), 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.lineWidth = Math.max(1.8, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.arc(ax, ay, cellSize * 0.52, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_BASE, K.rv([
            '着手は盤上に残っている最も古い自分の石から3マス以内のみ。',
            'アンカーが取られると、次に古い石に繋留が移る。進出は常にアンカー次第。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        pieces.length = 0;
        history.length = 0;
        lastMove = null;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 10, y: 10 }] }, 2);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        // 黒のアンカーは最古の(3,3)
        assert('アンカーから距離2は置ける', isValidPlacement([{ x: 4, y: 5 }], 1) === true);
        assert('アンカーから距離4は不可', isValidPlacement([{ x: 7, y: 5 }], 1) === false);
        assert('新しい石基準ではなく最古基準', isValidPlacement([{ x: 8, y: 5 }], 1) === false);
        // 白のアンカーは(10,10)
        assert('白は白のアンカーに繋留', isValidPlacement([{ x: 9, y: 8 }], 2) === true);
        assert('白は遠くに置けない', isValidPlacement([{ x: 6, y: 9 }], 2) === false);
    `,
};
