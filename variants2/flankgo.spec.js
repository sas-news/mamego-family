// FLANKGO — 側面碁: 敵石の上下左右の点にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'flankgo.html',
    en: 'FLANKGO',
    jp: '側面碁',
    prefix: 'flankgo',
    desc: '着手は敵石の上下左右のみ。敵の側面に正対して食い込む碁。',
    kind: 'flank',
    spec: [
        ...K.rb('FLANKGO', '側面碁', 'flankgo'),
        K.params([
            { key: 'flank_dist', label: '着手できる敵石からの距離', min: 1, max: 4, def: 1, unit: 'マス', hint: 'マンハッタン距離' },
        ]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 側面碁ルール: 敵石の上下左右 (直交4近傍) にのみ着手可 (敵石が無い間は自由)
            {
                const enemy = player === 1 ? 2 : 1;
                let hasEnemy = false, beside = false;
                for (let i = 0; i < board.length && !beside; i++) {
                    if (board[i] !== enemy) continue;
                    hasEnemy = true;
                    const ex = i % BOARD_SIZE, ey = Math.floor(i / BOARD_SIZE);
                    for (const p of cells) {
                        const dx = Math.abs(p.x - ex), dy = Math.abs(p.y - ey);
                        if (dx + dy <= Math.max(1, P('flank_dist') || 1)) { beside = true; break; }
                    }
                }
                if (hasEnemy && !beside) return false;
            }`],
        // 側面碁: 隣に空点のある敵石に赤い標的括弧
        ...K.STONE_MARKS_SPEC(`            {
                const enemy = turn === 1 ? 2 : 1;
                ctx.save();
                ctx.strokeStyle = 'rgba(220,60,60,0.8)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.055);
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== enemy) continue;
                    let open = false;
                    getNeighbors(i).forEach(n => { if (board[n] === 0) open = true; });
                    if (!open) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    const r = cellSize * 0.5, t = cellSize * 0.15;
                    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sy]) => {
                        ctx.beginPath();
                        ctx.moveTo(cx + sx * r - sx * t, cy + sy * r);
                        ctx.lineTo(cx + sx * r, cy + sy * r);
                        ctx.lineTo(cx + sx * r, cy + sy * r - sy * t);
                        ctx.stroke();
                    });
                }
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は敵石の上下左右に面した点のみ (敵石が無い間は自由)。',
            '敵の側面にだけ食い込める。斜め接触は許されない肉薄戦。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        assert('敵石が無い初手は自由', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
        board[6 * BOARD_SIZE + 6] = 2; // (6,6)に白
        assert('敵石の上は置ける', isValidPlacement([{ x: 6, y: 5 }], 1) === true);
        assert('敵石の右は置ける', isValidPlacement([{ x: 7, y: 6 }], 1) === true);
        assert('敵石の斜めは不可', isValidPlacement([{ x: 7, y: 7 }], 1) === false);
        assert('離れた点は不可', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
    `,
};
