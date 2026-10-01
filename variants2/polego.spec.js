// POLEGO — 極軸碁: 中央十字を極軸に、そこから隣接してしか広がれない
const K = require('../gen_kit.js');
module.exports = {
    file: 'polego.html',
    en: 'POLEGO',
    jp: '極軸碁',
    prefix: 'polego',
    desc: '着手は中央十字線上か自石に隣接する点。十字の軸から陣地を育てる。',
    kind: 'pole',
    spec: [
        ...K.rb('POLEGO', '極軸碁', 'polego'),
        K.params([{ key: 'axis_r', label: '極軸の太さ', min: 0, max: 3, def: 0, unit: 'マス', hint: '0=中央1本線' }]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 極軸碁ルール: 中央十字線上、または自石に直交隣接する点のみ着手可
            {
                const c = (BOARD_SIZE - 1) / 2;
                for (const p of cells) {
                    if (Math.abs(p.x - c) <= (P('axis_r') || 0) || Math.abs(p.y - c) <= (P('axis_r') || 0)) continue; // 極軸上は常に可
                    const idx = p.y * BOARD_SIZE + p.x;
                    const touchOwn = getNeighbors(idx).some(n => board[n] === player);
                    if (!touchOwn) return false;
                }
            }`],
        K.CUE_GRID(`            // 極軸: 中央十字を薄く照らす
            {
                const c = (BOARD_SIZE - 1) / 2;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.14);
                const _ar = P('axis_r') || 0;
                ctx.fillRect(-cellSize, padding + (c - 0.5 - _ar) * cellSize,
                    padding * 2 + BOARD_SIZE * cellSize, cellSize * (1 + 2 * _ar));
                ctx.fillRect(padding + (c - 0.5 - _ar) * cellSize, -cellSize,
                    cellSize * (1 + 2 * _ar), padding * 2 + BOARD_SIZE * cellSize);
                ctx.restore();
            }`),
        // 極軸: 中心から4方向へエネルギーの玉が流れる (十字軸から陣地が広がるルール)
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const c = (BOARD_SIZE - 1) / 2;
            const cx = pad + c * cs, cy = pad + c * cs;
            const t = (now % 1500) / 1500;
            ctx2.save();
            ctx2.fillStyle = 'rgba(250,204,21,0.45)';
            const r = cs * 0.08;
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                const d = t * (c + 0.5) * cs;
                ctx2.beginPath();
                ctx2.arc(cx + dx * d, cy + dy * d, Math.max(0.8, r * (1 - t * 0.4)), 0, Math.PI * 2);
                ctx2.fill();
            });
            ctx2.restore();
        });`],
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は中央の十字線 (極軸) 上か、自分の石に直交隣接する点のみ。',
            '初手は必ず極軸上。そこから自石に連なるように陣地を広げていく。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const c = (BOARD_SIZE - 1) / 2;
        assert('中央十字の横軸は置ける', isValidPlacement([{ x: 2, y: c }], 1) === true);
        assert('中央十字の縦軸は置ける', isValidPlacement([{ x: c, y: 8 }], 1) === true);
        assert('軸外・孤立点は不可', isValidPlacement([{ x: 2, y: 2 }], 1) === false);
        board[(c - 1) * BOARD_SIZE + c] = 1; // (c, c-1)に黒
        assert('自石の隣なら軸外でも置ける', isValidPlacement([{ x: c - 1, y: c - 1 }], 1) === true);
        board[(c - 2) * BOARD_SIZE + (c + 1)] = 2; // (c+1, c-2)に白
        assert('敵石の隣では広がらない', isValidPlacement([{ x: c + 1, y: c - 3 }], 1) === false);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
