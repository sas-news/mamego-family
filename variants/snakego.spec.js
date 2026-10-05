// SNAKEGO — 蛇碁: 5連の蛇 (W字) ピースだけを置く碁。
const K = require('../gen_kit.js');
module.exports = {
    file: 'snakego.html',
    en: 'SNAKEGO',
    jp: '蛇碁',
    prefix: 'snakego',
    desc: '5連の蛇 (W字) ピースだけを置く碁。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('SNAKEGO', '蛇碁', 'snakego'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=⟳ボタン・Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[0,1],[1,1],[1,2],[2,2]],[[1,0],[2,0],[0,1],[1,1],[0,2]],[[0,0],[1,0],[1,1],[2,1],[2,2]],[[2,0],[0,1],[1,1],[1,2],[0,2]]];`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 5;`],
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
        [K.ONE, K.RV_BASE, K.rv(['着手は5連の蛇 (階段状W字) ピースのみ (回転=⟳ボタン・Rキー・右クリック・ホイール)。','ピースが入らない5マス未満の連結空領域は窒息領域。'])],
        // 蛇の姿: ピースを鎖状になぞった胴体 + 頭の目と舌
        [K.ONE, `        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;
            const set = new Set(cellsAbs.map(p => p.y * BOARD_SIZE + p.x));
            const R = cellSize * 0.42;
            ctx.save();
            ctx.globalAlpha = alpha;

            // C-C 結合
            ctx.strokeStyle = shiftColor(fill, -0.15);
            ctx.lineWidth = cellSize * 0.30;
            ctx.lineCap = 'round';
            ctx.beginPath();
            cellsAbs.forEach(p => {
                const cx = padding + p.x * cellSize;
                const cy = padding + p.y * cellSize;
                [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                    if (set.has((p.y + dy) * BOARD_SIZE + (p.x + dx))) {
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(cx + dx * cellSize, cy + dy * cellSize);
                    }
                });
            });
            ctx.stroke();

            // 原子球 (放射グラデーション + 輪郭 + スペキュラハイライト)
            cellsAbs.forEach(p => {
                const cx = padding + p.x * cellSize;
                const cy = padding + p.y * cellSize;
                const g = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.08, cx, cy, R);
                g.addColorStop(0, shiftColor(fill, 0.55));
                g.addColorStop(0.65, fill);
                g.addColorStop(1, shiftColor(fill, -0.25));
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.fill();
                if (stroke) {
                    ctx.strokeStyle = stroke;
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.stroke();
                }
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.beginPath();
                ctx.arc(cx - R * 0.34, cy - R * 0.38, R * 0.17, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }`,
`        function drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha = 1) {
            if (!cellsAbs || cellsAbs.length === 0) return;
            const set = new Set(cellsAbs.map(p => p.y * BOARD_SIZE + p.x));
            const inSet = (x, y) => set.has(y * BOARD_SIZE + x);
            ctx.save();
            ctx.globalAlpha = alpha;
            // 鎖状にピースをなぞる (端点から貪欲に歩く)
            const deg = p => [[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy]) => inSet(p.x+dx, p.y+dy)).length;
            let head = cellsAbs.find(p => deg(p) === 1) || cellsAbs[0];
            const order = [head];
            const seen = new Set([head.y * BOARD_SIZE + head.x]);
            for (;;) {
                const cur = order[order.length - 1];
                const nx = [[1,0],[-1,0],[0,1],[0,-1]]
                    .map(([dx,dy]) => ({ x: cur.x + dx, y: cur.y + dy }))
                    .find(p => inSet(p.x, p.y) && !seen.has(p.y * BOARD_SIZE + p.x));
                if (!nx) break;
                order.push(nx);
                seen.add(nx.y * BOARD_SIZE + nx.x);
            }
            const C = p => [padding + p.x * cellSize, padding + p.y * cellSize];
            // 胴体チューブ
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = shiftColor(fill, -0.12);
            ctx.lineWidth = cellSize * 0.72;
            ctx.beginPath();
            order.forEach((p, k) => { const [cx, cy] = C(p); if (k === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy); });
            ctx.stroke();
            // 腹の筋
            ctx.strokeStyle = shiftColor(fill, 0.35);
            ctx.lineWidth = cellSize * 0.30;
            ctx.globalAlpha = alpha * 0.55;
            ctx.beginPath();
            order.forEach((p, k) => { const [cx, cy] = C(p); if (k === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy); });
            ctx.stroke();
            ctx.globalAlpha = alpha;
            // 鎖に乗らない余剰セル (念のため)
            cellsAbs.forEach(p => {
                if (seen.has(p.y * BOARD_SIZE + p.x)) return;
                const [cx, cy] = C(p);
                ctx.fillStyle = fill;
                ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.38, 0, Math.PI * 2); ctx.fill();
            });
            // 頭 (尾=order[0]、頭=order[last]): 目と舌
            const h = order[order.length - 1], t = order[Math.max(0, order.length - 2)];
            const [hx, hy] = C(h);
            let fx2 = hx - C(t)[0], fy2 = hy - C(t)[1];
            const fl = Math.hypot(fx2, fy2) || 1; fx2 /= fl; fy2 /= fl;
            ctx.fillStyle = shiftColor(fill, 0.15);
            ctx.beginPath(); ctx.arc(hx, hy, cellSize * 0.40, 0, Math.PI * 2); ctx.fill();
            if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, cellSize * 0.04); ctx.stroke(); }
            const px2 = -fy2, py2 = fx2, eo = cellSize * 0.16, eo2 = cellSize * 0.12;
            [[1, 0], [-1, 0]].forEach(([s]) => {
                const ex = hx + fx2 * eo + px2 * eo2 * s, ey = hy + fy2 * eo + py2 * eo2 * s;
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(ex, ey, cellSize * 0.075, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#141414';
                ctx.beginPath(); ctx.arc(ex + fx2 * cellSize * 0.03, ey + fy2 * cellSize * 0.03, cellSize * 0.04, 0, Math.PI * 2); ctx.fill();
            });
            // 舌 (二又)
            ctx.strokeStyle = 'rgba(220,60,60,0.95)';
            ctx.lineWidth = Math.max(1, cellSize * 0.045);
            const tx = hx + fx2 * cellSize * 0.40, ty = hy + fy2 * cellSize * 0.40;
            const t1x = hx + fx2 * cellSize * 0.56 + px2 * cellSize * 0.05, t1y = hy + fy2 * cellSize * 0.56 + py2 * cellSize * 0.05;
            const t2x = hx + fx2 * cellSize * 0.56 - px2 * cellSize * 0.05, t2y = hy + fy2 * cellSize * 0.56 - py2 * cellSize * 0.05;
            ctx.beginPath();
            ctx.moveTo(tx, ty); ctx.lineTo(t1x, t1y);
            ctx.moveTo(tx, ty); ctx.lineTo(t2x, t2y);
            ctx.stroke();
            ctx.restore();
        }`],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const snk = [{ x: 3, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 5, y: 5 }];
        assert('蛇形は置ける', isValidPlacement(snk, 1) === true);
        executeMove({ cells: snk }, 1);
        assert('5石置かれた', [[3,3],[3,4],[4,4],[4,5],[5,5]].every(([x,y]) => board[y * BOARD_SIZE + x] === 1));
        assert('直線5連は形違いで不可', isValidPlacement([{ x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }], 1) === false);
    
    `,
};
