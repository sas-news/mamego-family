// COREGO — 内核碁: 中央5x5の内核にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'corego.html',
    en: 'COREGO',
    jp: '内核碁',
    prefix: 'corego',
    desc: '着手は中央5x5の内核のみ。周縁は虚空、全ての闘争は核の中。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'core',
    spec: [
        ...K.rb('COREGO', '内核碁', 'corego'),
        K.params([
            { key: 'core_radius', label: '内核の半径', min: 1, max: 6, def: 2, hint: '中央の着手可区域 (半径2=5x5)' },
        ]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 内核碁ルール: 中央の方形区域にのみ着手可 (半径は設定で調整)
            {
                const c = (BOARD_SIZE - 1) / 2;
                const _r = Math.max(1, P('core_radius') || 2);
                for (const p of cells) {
                    if (Math.abs(p.x - c) > _r || Math.abs(p.y - c) > _r) return false;
                }
            }`],
        // 内核の鼓動: 核の縁を巡る脈動リングと内部に漂う光の粒
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const cc = (BOARD_SIZE - 1) / 2;
            const cx = pad + cc * cs, cy = pad + cc * cs;
            const _r = Math.max(1, P('core_radius') || 2);
            ctx2.save();
            // 核の縁の脈動リング
            ctx2.globalAlpha = 0.30 + 0.18 * Math.sin(now / 520);
            ctx2.strokeStyle = '#67e8f9';
            ctx2.lineWidth = Math.max(1.4, cs * 0.08);
            ctx2.strokeRect(pad + (cc - _r - 0.5) * cs, pad + (cc - _r - 0.5) * cs, cs * (_r * 2 + 1), cs * (_r * 2 + 1));
            // 内部に漂う光の粒
            for (let k = 0; k < 10; k++) {
                const t = now / 3000 + k * 0.61;
                const px = cx + Math.sin(t * 2.1 + k) * cs * 2.0;
                const py = cy + Math.cos(t * 1.7 + k * 2) * cs * 2.0;
                ctx2.globalAlpha = 0.10 + 0.07 * Math.sin(now / 400 + k);
                ctx2.fillStyle = '#a5f3fc';
                ctx2.beginPath();
                ctx2.arc(px, py, cs * 0.07, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        K.CUE_GRID(`            // 内核: 中央5x5の外側を暗く沈め、核を照らす
            {
                const cc = (BOARD_SIZE - 1) / 2;
                const _r = Math.max(1, P('core_radius') || 2);
                ctx.save();
                ctx.fillStyle = alphaColor(shiftColor(currentTheme.boardBg, -0.5), 0.45);
                const x0 = padding + (cc - _r - 0.5) * cellSize, y0 = padding + (cc - _r - 0.5) * cellSize;
                const x1 = padding + (cc + _r + 0.5) * cellSize, y1 = padding + (cc + _r + 0.5) * cellSize;
                const W = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                ctx.fillRect(-cellSize, -cellSize, W + cellSize * 2, y0 + cellSize);
                ctx.fillRect(-cellSize, y1, W + cellSize * 2, W);
                ctx.fillRect(-cellSize, y0, x0 + cellSize, y1 - y0);
                ctx.fillRect(x1, y0, W, y1 - y0);
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_BASE, K.rv([
            '着手は中央5x5の内核のみ。周縁は暗い虚空。',
            '小さな核で激しい取り合いが即座に始まる。地はほぼ全域が争点。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const c = (BOARD_SIZE - 1) / 2;
        assert('天元は置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('核の端(c-2)は置ける', isValidPlacement([{ x: c - 2, y: c + 2 }], 1) === true);
        assert('核の外(c-3)は不可', isValidPlacement([{ x: c - 3, y: c }], 1) === false);
        assert('盤の角は不可', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
    `,
};
