// HALOGO — 環碁: 中空3x3の環ピースだけを置く碁。置くだけで壁ができる。
const K = require('../gen_kit.js');
module.exports = {
    file: 'halogo.html',
    en: 'HALOGO',
    jp: '環碁',
    prefix: 'halogo',
    desc: '中空3x3の環ピースだけを置く碁。置くだけで壁ができる。',
    kind: 'stone',
    spec: [
        ...K.rb('HALOGO', '環碁', 'halogo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=⟳ボタン・Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]]];`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 8;`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は中央が空いた3x3の環 (8石) ピースのみ。','環の中心に敵石があれば包囲して取れる。8マス未満の空領域は窒息領域。'])],
        // === FX: 環リング駒 ===
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;

        // 8石の環を発光リングに繋がった珠として描く
        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;
            ctx.save();
            ctx.globalAlpha = alpha;
            const xs = cellsAbs.map(p => p.x), ys = cellsAbs.map(p => p.y);
            const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
            if (cellsAbs.length >= 4 && maxX > minX && maxY > minY) {
                const ccx = padding + (minX + maxX) / 2 * cellSize, ccy = padding + (minY + maxY) / 2 * cellSize;
                ctx.strokeStyle = alphaColor(fill, 0.5);
                ctx.lineWidth = cellSize * 0.17;
                ctx.beginPath();
                ctx.ellipse(ccx, ccy, (maxX - minX) / 2 * cellSize, (maxY - minY) / 2 * cellSize, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = alphaColor(stroke || fill, 0.9);
                ctx.lineWidth = cellSize * 0.05;
                ctx.stroke();
            }
            cellsAbs.forEach(p => {
                const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                const R = cellSize * 0.32;
                const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
                g.addColorStop(0, shiftColor(fill, 0.55));
                g.addColorStop(0.65, fill);
                g.addColorStop(1, shiftColor(fill, -0.25));
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.fill();
                if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, cellSize * 0.04); ctx.stroke(); }
            });
            ctx.restore();
        }`],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const ring = [{x:3,y:3},{x:4,y:3},{x:5,y:3},{x:3,y:4},{x:5,y:4},{x:3,y:5},{x:4,y:5},{x:5,y:5}];
        assert('環は置ける', isValidPlacement(ring, 1) === true);
        executeMove({ cells: ring }, 1);
        assert('8石置かれた', ring.every(p => board[p.y * BOARD_SIZE + p.x] === 1));
        assert('環の中心は空のまま', board[4 * BOARD_SIZE + 4] === 0);
        assert('単石は形違いで不可', isValidPlacement([{ x: 9, y: 9 }], 1) === false);
    
    `,
};
