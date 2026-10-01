// LGO — 拐碁: L字3連ピースだけを置く碁。曲がり連で呼吸点が散る。
const K = require('../gen_kit.js');
module.exports = {
    file: 'lgo.html',
    en: 'LGO',
    jp: '拐碁',
    prefix: 'lgo',
    desc: 'L字3連ピースだけを置く碁。曲がり連で呼吸点が散る。',
    kind: 'stone',
    spec: [
        ...K.rb('LGO', '拐碁', 'lgo'),
        K.params([
            { key: 'shape_mode', label: '着手できる形', options: [{ v: 'l', l: 'L字のみ' }, { v: 'li', l: 'L字と直線3連' }], def: 'l' },
        ]),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=⟳ボタン・Rキー・右クリック・ホイール)
        // 設定で直線3連も許可する場合は回転候補に追加される
        function rebuildStoneShapes() {
            ORIENTATIONS.STONE = [[[0,0],[0,1],[1,1]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[1,1]],[[1,0],[0,1],[1,1]]];
            if (P('shape_mode') === 'li') {
                ORIENTATIONS.STONE.push([[0,0],[0,1],[0,2]], [[0,0],[1,0],[2,0]]);
            }
        }
        rebuildStoneShapes();
        function onVariantParam(p) {
            if (p.key === 'shape_mode') rebuildStoneShapes();
        }`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 3;`],
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
                // 設定で直線3連も許可する場合は候補に追加
                if (P('shape_mode') === 'li') {
                    _allow.push(_norm([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }]));
                    _allow.push(_norm([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]));
                }
                if (!_allow.includes(_cur)) return false;
            }`],
        [K.ONE, K.RV_ALGO, K.rv(['着手はL字 (拐) の3連ピースのみ (回転=⟳ボタン・Rキー・右クリック・ホイール)。','ピースが入らない3マス未満の連結空領域は窒息領域。'])],
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
        const el = [{ x: 3, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }];
        assert('L字は置ける', isValidPlacement(el, 1) === true);
        executeMove({ cells: el }, 1);
        assert('3石置かれた', board[3 * BOARD_SIZE + 3] === 1 && board[4 * BOARD_SIZE + 3] === 1 && board[4 * BOARD_SIZE + 4] === 1);
        assert('直線3連は形違いで不可', isValidPlacement([{ x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }], 1) === false);
    
    `,
};
