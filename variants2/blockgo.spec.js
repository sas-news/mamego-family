// BLOCKGO — 塊碁: 毎手どんな4連テトロミノでも置ける碁。
const K = require('../gen_kit.js');
module.exports = {
    file: 'blockgo.html',
    en: 'BLOCKGO',
    jp: '塊碁',
    prefix: 'blockgo',
    desc: '毎手どんな4連テトロミノでも置ける碁。',
    kind: 'stone',
    spec: [
        ...K.rb('BLOCKGO', '塊碁', 'blockgo'),
        K.params([
            { key: 'piece_size', label: 'ピースのマス数', options: [{ v: 3, l: '3連トロミノ' }, { v: 4, l: '4連テトロミノ' }, { v: 5, l: '5連ペントミノ' }], def: 4 },
        ]),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=⟳ボタン・Rキー・右クリック・ホイール)
        // n連ポリオミノの全向きを実行時生成。サイズは設定で変更可
        function rebuildStoneShapes() {
            const n = P('piece_size') || 4;
            PIECE_SIZE = n; // 窒息領域のしきい値も連動
            const seen = new Set();
            const norm = (cs) => {
                const mx = Math.min(...cs.map(c => c[0])), my = Math.min(...cs.map(c => c[1]));
                return cs.map(c => (c[0] - mx) + ',' + (c[1] - my)).sort().join(';');
            };
            const grow = (cells) => {
                if (cells.length === n) { seen.add(norm(cells)); return; }
                const cand = new Set();
                cells.forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                    const nx = x + dx, ny = y + dy;
                    if (!cells.some(c => c[0] === nx && c[1] === ny)) cand.add(nx + ',' + ny);
                }));
                cand.forEach(k => grow(cells.concat([k.split(',').map(Number)])));
            };
            grow([[0, 0]]);
            ORIENTATIONS.STONE = [...seen].map(s2 => s2.split(';').map(q => q.split(',').map(Number)));
        }
        rebuildStoneShapes();
        function onVariantParam(p) { if (p.key === 'piece_size') rebuildStoneShapes(); }
`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        let PIECE_SIZE = 4;`],
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `

            // 形状チェック: 着手できるのはこのゲームの専用の形のみ
            {
                const _norm = (cs) => {
                    const _mx = Math.min(...cs.map(c => c.x));
                    const _my = Math.min(...cs.map(c => c.y));
                    return cs.map(c => (c.x - _mx) + ',' + (c.y - _my)).sort().join(';');
                };
                const _cur = _norm(cells);
                const _allow = (ORIENTATIONS[currentPieceType] || []).map(s => _norm(s.map(([x, y]) => ({ x, y }))));
                if (!_allow.includes(_cur)) return false;
            }`],
        [K.ONE, K.RV_BASE, K.rv(['着手は自由形の4連ピース (テトロミノ19向き)。⟳ボタン・Rキー・右クリック・ホイールで形を巡回する。','ピースが入らない4マス未満の連結空領域は窒息領域。'])],
        // テトロミノ質感: 隙間のない融合タイルで描く (外郭稜線+上面ハイライト)
        [K.ONE, `        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;`,
`        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;
            if (cellsAbs.length > 1) {
                const tileSet = new Set(cellsAbs.map(p => p.y * BOARD_SIZE + p.x));
                const ins = cellSize * 0.47;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = fill;
                cellsAbs.forEach(p => {
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    ctx.fillRect(cx - ins, cy - ins, ins * 2, ins * 2);
                });
                ctx.strokeStyle = shiftColor(fill, -0.3);
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.lineJoin = 'round';
                ctx.beginPath();
                cellsAbs.forEach(p => {
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    if (!tileSet.has(p.y * BOARD_SIZE + p.x - 1)) { ctx.moveTo(cx - ins, cy - ins); ctx.lineTo(cx + ins, cy - ins); }
                    if (!tileSet.has(p.y * BOARD_SIZE + p.x + 1)) { ctx.moveTo(cx + ins, cy - ins); ctx.lineTo(cx + ins, cy + ins); }
                    if (!tileSet.has((p.y + 1) * BOARD_SIZE + p.x)) { ctx.moveTo(cx + ins, cy + ins); ctx.lineTo(cx - ins, cy + ins); }
                    if (!tileSet.has((p.y - 1) * BOARD_SIZE + p.x)) { ctx.moveTo(cx - ins, cy + ins); ctx.lineTo(cx - ins, cy - ins); }
                });
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.22)';
                cellsAbs.forEach(p => {
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    if (!tileSet.has((p.y - 1) * BOARD_SIZE + p.x)) ctx.fillRect(cx - ins, cy - ins, ins * 2, cellSize * 0.10);
                });
                ctx.restore();
                return;
            }`],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const sq = [{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 5 }, { x: 5, y: 5 }];
        assert('O型は置ける', isValidPlacement(sq, 1) === true);
        executeMove({ cells: sq }, 1);
        assert('4石置かれた', sq.every(p => board[p.y * BOARD_SIZE + p.x] === 1));
        const el = [{ x: 8, y: 8 }, { x: 8, y: 9 }, { x: 8, y: 10 }, { x: 9, y: 10 }];
        assert('L型も置ける', isValidPlacement(el, 1) === true);
        assert('3連は形違いで不可', isValidPlacement([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], 1) === false);
    
    `,
};
