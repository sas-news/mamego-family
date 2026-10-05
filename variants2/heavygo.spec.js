// HEAVYGO — 重碁: 取るには敵石数の2倍で接し囲む。大きな塊はほぼ不死身。
const K = require('../gen_kit.js');
module.exports = {
    file: 'heavygo.html',
    en: 'HEAVYGO',
    jp: '重碁',
    prefix: 'heavygo',
    desc: '取るには敵石数の2倍で接し囲む。大きな塊はほぼ不死身。',
    kind: 'stone',
    spec: [
        ...K.rb('HEAVYGO', '重碁', 'heavygo'),
        K.params([
            { key: 'heavy_ratio', label: '捕獲に必要な接し石の倍率', min: 1, max: 4, def: 2, step: 0.5, unit: '倍' },
        ]),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 重碁: 連1石につき接する敵石2個が必要。足りなければ重くて取れない
                const capSet = new Set(captured);
                const seen = new Set();
                const doomed = [];
                for (const start of captured) {
                    if (seen.has(start)) continue;
                    const group = [];
                    const q = [start];
                    seen.add(start);
                    while (q.length) {
                        const c = q.shift();
                        group.push(c);
                        getNeighbors(c).forEach(n => {
                            if (capSet.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
                        });
                    }
                    const foes = new Set();
                    group.forEach(c => getNeighbors(c).forEach(n => { if (board[n] === player) foes.add(n); }));
                    if (foes.size >= group.length * (P('heavy_ratio') || 2)) doomed.push(...group);
                }
                if (doomed.length > 0) {
                    doomed.forEach(idx => board[idx] = 0);
                    captures[player] += doomed.length;
                    soundManager.playCapture();
                    cleanUpPieces();
                } else {
                    soundManager.playPlace();
                }
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_BASE, K.rv(['重い石: 敵連を取るには、その石数の2倍の自分の石で接し囲む必要がある。','例: 3連を取るには接する敵石が6個必要。コンパクトな塊はほぼ取れない。'])],
        // 重い石 = 鋲打ちの金属インゴット (ピースは連結する鋼板)
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
            const S = cellSize * 0.44; // インゴットの半径
            ctx.save();
            ctx.globalAlpha = alpha;
            const rr = (x, y, w, h, rad) => {
                ctx.beginPath();
                ctx.moveTo(x + rad, y);
                ctx.arcTo(x + w, y, x + w, y + h, rad);
                ctx.arcTo(x + w, y + h, x, y + h, rad);
                ctx.arcTo(x, y + h, x, y, rad);
                ctx.arcTo(x, y, x + w, y, rad);
                ctx.closePath();
            };
            // 鋼板の結合
            cellsAbs.forEach(p => {
                const cx = padding + p.x * cellSize;
                const cy = padding + p.y * cellSize;
                [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                    if (!set.has((p.y + dy) * BOARD_SIZE + (p.x + dx))) return;
                    ctx.fillStyle = shiftColor(fill, -0.12);
                    if (dx) ctx.fillRect(cx, cy - S * 0.7, cellSize, S * 1.4);
                    else ctx.fillRect(cx - S * 0.7, cy, S * 1.4, cellSize);
                });
            });
            // 金属インゴット (角丸の塊 + ベベル + 鋲)
            cellsAbs.forEach(p => {
                const cx = padding + p.x * cellSize;
                const cy = padding + p.y * cellSize;
                const g = ctx.createLinearGradient(cx - S, cy - S, cx + S, cy + S);
                g.addColorStop(0, shiftColor(fill, 0.5));
                g.addColorStop(0.5, fill);
                g.addColorStop(1, shiftColor(fill, -0.35));
                ctx.fillStyle = g;
                rr(cx - S, cy - S, S * 2, S * 2, S * 0.28);
                ctx.fill();
                // ベベル (上辺の照り・下辺の影)
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                ctx.beginPath();
                ctx.moveTo(cx - S * 0.7, cy - S * 0.82);
                ctx.lineTo(cx + S * 0.7, cy - S * 0.82);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(0,0,0,0.35)';
                ctx.beginPath();
                ctx.moveTo(cx - S * 0.7, cy + S * 0.82);
                ctx.lineTo(cx + S * 0.7, cy + S * 0.82);
                ctx.stroke();
                if (stroke) {
                    ctx.strokeStyle = stroke;
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    rr(cx - S, cy - S, S * 2, S * 2, S * 0.28);
                    ctx.stroke();
                }
                // 鋲
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
                    ctx.beginPath();
                    ctx.arc(cx + sx * S * 0.6, cy + sy * S * 0.6, S * 0.11, 0, Math.PI * 2);
                    ctx.fill();
                });
            });
            ctx.restore();
        }`],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0);
        // 角の敵ドミノを3石で包囲: 通常なら取れるが重碁は2x2連=4石必要で生存
        board[I(0,0)] = 2; board[I(0,1)] = 2;
        board[I(1,0)] = 1; board[I(1,1)] = 1;
        executeMove({ cells: [{ x: 0, y: 2 }] }, 1);
        assert('包囲3<4でドミノ生存', board[I(0,0)] === 2 && board[I(0,1)] === 2);
        // 中央の単石は4石包囲 >= 2x1 で取れる
        board.fill(0);
        board[I(5,5)] = 2;
        board[I(4,5)] = 1; board[I(6,5)] = 1; board[I(5,4)] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('厚い包囲なら取れる', board[I(5,5)] === 0 && captures[1] === 1);
    
    `,
};
