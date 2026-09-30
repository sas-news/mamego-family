// ZIGGO — 之字碁: S字・Z字4連ピースだけを置く碁。ジグザグの連。
const K = require('../gen_kit.js');
module.exports = {
    file: 'ziggo.html',
    en: 'ZIGGO',
    jp: '之字碁',
    prefix: 'ziggo',
    desc: 'S字・Z字4連ピースだけを置く碁。ジグザグの連。',
    kind: 'stone',
    spec: [
        ...K.rb('ZIGGO', '之字碁', 'ziggo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[1,0],[2,0],[0,1],[1,1]],[[0,0],[0,1],[1,1],[1,2]],[[0,0],[1,0],[1,1],[2,1]],[[1,0],[0,1],[1,1],[0,2]]];`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 4;`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は之字 (S/Zジグザグ) の4連ピースのみ (回転=Rキー・右クリック・ホイール)。','ピースが入らない4マス未満の連結空領域は窒息領域。'])],
        // === FX: 積み木タイル駒 ===
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;

        // ピースを丸石ではなく角丸タイルの連結ブロックとして描く (形が一目で分かる)
        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;
            const R = cellSize * 0.5, rr = cellSize * 0.15;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = shiftColor(fill, -0.12);
            cellsAbs.forEach(p => {
                ctx.fillRect(padding + p.x * cellSize - R, padding + p.y * cellSize - R, R * 2, R * 2);
            });
            cellsAbs.forEach(p => {
                const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                const g = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
                g.addColorStop(0, shiftColor(fill, 0.42));
                g.addColorStop(0.55, fill);
                g.addColorStop(1, shiftColor(fill, -0.3));
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.roundRect(cx - R, cy - R, R * 2, R * 2, rr);
                ctx.fill();
                if (stroke) {
                    ctx.strokeStyle = stroke;
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.stroke();
                }
                ctx.fillStyle = 'rgba(255,255,255,0.30)';
                ctx.beginPath();
                ctx.roundRect(cx - R + cellSize * 0.08, cy - R + cellSize * 0.07, R * 2 - cellSize * 0.16, cellSize * 0.1, cellSize * 0.05);
                ctx.fill();
            });
            ctx.restore();
        }`],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const zig = [{ x: 4, y: 3 }, { x: 5, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }];
        assert('之字は置ける', isValidPlacement(zig, 1) === true);
        executeMove({ cells: zig }, 1);
        assert('4石置かれた', [[4,3],[5,3],[3,4],[4,4]].every(([x,y]) => board[y * BOARD_SIZE + x] === 1));
        assert('T字は形違いで不可', isValidPlacement([{ x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 9 }], 1) === false);
    
    `,
};
