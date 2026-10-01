// DIADGO — 斜連碁: 斜めに触れ合う2石のドミノを置く碁。連は繋がらない。
const K = require('../gen_kit.js');
module.exports = {
    file: 'diadgo.html',
    en: 'DIADGO',
    jp: '斜連碁',
    prefix: 'diadgo',
    desc: '斜めに触れ合う2石のドミノを置く碁。連は繋がらない。',
    kind: 'stone',
    spec: [
        ...K.rb('DIADGO', '斜連碁', 'diadgo'),
        K.params([
            { key: 'domino_shape', label: 'ドミノの向き', options: [{v:'diag',l:'斜めのみ'},{v:'both',l:'斜め+縦横'}], def: 'diag' },
        ]),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=⟳ボタン・Rキー・右クリック・ホイール)
        // 向きは設定で変更可: '斜めのみ'(def) / '斜め+縦横'
        function applyDominoShape() {
            ORIENTATIONS.STONE = (P('domino_shape') || 'diag') === 'both'
                ? [[[0,0],[1,1]],[[0,1],[1,0]],[[0,0],[0,1]],[[0,0],[1,0]]]
                : [[[0,0],[1,1]],[[0,1],[1,0]]];
        }
        applyDominoShape();
        function onVariantParam(p) { if (p.key === 'domino_shape') applyDominoShape(); }`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 1;`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は斜めに接する2石のドミノ (回転=⟳ボタン・Rキー・右クリック・ホイール)。','斜め接触は連にならない: 2石は別々の連として呼吸する。'])],
        // === FX: ドミノ駒 ===
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;

        // 2セルを斜めに結ぶドミノ牌として描く
        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;
            const R = cellSize * 0.5, rr = cellSize * 0.14;
            ctx.save();
            ctx.globalAlpha = alpha;
            if (cellsAbs.length === 2) {
                const ax = padding + cellsAbs[0].x * cellSize, ay = padding + cellsAbs[0].y * cellSize;
                const bx = padding + cellsAbs[1].x * cellSize, by = padding + cellsAbs[1].y * cellSize;
                ctx.strokeStyle = shiftColor(fill, -0.28);
                ctx.lineWidth = cellSize * 0.24;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(bx, by);
                ctx.stroke();
            }
            cellsAbs.forEach((p, i) => {
                const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                const g = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
                g.addColorStop(0, shiftColor(fill, 0.45));
                g.addColorStop(0.55, fill);
                g.addColorStop(1, shiftColor(fill, -0.32));
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.roundRect(cx - R, cy - R, R * 2, R * 2, rr);
                ctx.fill();
                if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, cellSize * 0.05); ctx.stroke(); }
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = Math.max(1, cellSize * 0.035);
                ctx.beginPath();
                ctx.moveTo(cx - R * 0.55, cy);
                ctx.lineTo(cx + R * 0.55, cy);
                ctx.stroke();
                ctx.fillStyle = shiftColor(fill, 0.6);
                [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]].slice(0, i === 0 ? 1 : 4).forEach(q => {
                    ctx.beginPath();
                    ctx.arc(cx + q[0] * cellSize, cy + q[1] * cellSize, cellSize * 0.055, 0, Math.PI * 2);
                    ctx.fill();
                });
            });
            ctx.restore();
        }`],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const dd = [{ x: 4, y: 4 }, { x: 5, y: 5 }];
        assert('斜めドミノは置ける', isValidPlacement(dd, 1) === true);
        executeMove({ cells: dd }, 1);
        assert('2石置かれた', board[4 * BOARD_SIZE + 4] === 1 && board[5 * BOARD_SIZE + 5] === 1);
        assert('横ドミノは形違いで不可', isValidPlacement([{ x: 8, y: 8 }, { x: 9, y: 8 }], 1) === false);
        assert('斜め2石は別連', getNeighbors(4 * BOARD_SIZE + 4).includes(5 * BOARD_SIZE + 5) === false);
    
    `,
};
