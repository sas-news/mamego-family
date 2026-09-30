// EDGEGO — 辺縁碁: 端から2マス以内の帯状領域にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'edgego.html',
    en: 'EDGEGO',
    jp: '辺縁碁',
    prefix: 'edgego',
    desc: '着手は端から2マス以内の帯のみ。盤中央は不毛の死域。',
    kind: 'edge',
    spec: [
        ...K.rb('EDGEGO', '辺縁碁', 'edgego'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 辺縁碁ルール: 端から2マス以内 (環0・環1) のみ着手可
            {
                for (const p of cells) {
                    const edge = Math.min(p.x, p.y, BOARD_SIZE - 1 - p.x, BOARD_SIZE - 1 - p.y);
                    if (edge > 1) return false;
                }
            }`],
        K.CUE_GRID(`            // 辺縁: 中央の死域を暗く沈める
            {
                ctx.save();
                ctx.fillStyle = alphaColor(shiftColor(currentTheme.boardBg, -0.5), 0.55);
                const bx = padding + 1.5 * cellSize, bw = (BOARD_SIZE - 3) * cellSize;
                if (bw > 0) ctx.fillRect(bx, bx, bw, bw);
                ctx.restore();
            }`),
        // 死域の境界を這う警告線 (マーチングアリ)
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            ctx2.setLineDash([cs * 0.22, cs * 0.16]);
            ctx2.lineDashOffset = -now / 55;
            ctx2.strokeStyle = 'rgba(235,90,70,0.55)';
            ctx2.lineWidth = Math.max(1.5, cs * 0.07);
            ctx2.strokeRect(pad + 1.5 * cs, pad + 1.5 * cs, (BOARD_SIZE - 3) * cs, (BOARD_SIZE - 3) * cs);
            ctx2.restore();
        });`],
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は盤の端から2マス以内の帯状領域のみ。中央は暗い死域。',
            '全ての石が縁で縮み合う。呼吸の確保がいつも以上に苦しい。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const N = BOARD_SIZE;
        assert('外周(環0)は置ける', isValidPlacement([{ x: 4, y: 0 }], 1) === true);
        assert('環1は置ける', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
        assert('環2は死域', isValidPlacement([{ x: 2, y: 2 }], 1) === false);
        assert('中央は死域', isValidPlacement([{ x: Math.floor(N / 2), y: Math.floor(N / 2) }], 1) === false);
        assert('右端も環1まで', isValidPlacement([{ x: N - 2, y: 5 }], 1) === true);
    `,
};
