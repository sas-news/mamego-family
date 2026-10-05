// HOURGO — 砂時計碁: 中央で1点に絞られた盤形
const K = require('../gen_kit.js');
module.exports = {
    file: 'hourgo.html',
    en: 'HOURGO',
    jp: '砂時計碁',
    prefix: 'hourgo',
    desc: '中央1点で上下が細く繋がる砂時計盤。咽喉を制する者が盤を制す。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('HOURGO', '砂時計碁', 'hourgo'),
        K.params([
            { key: 'waist', label: '咽喉の広さ', min: -2, max: 3, def: 0, hint: '大きいほど上下の繋がりが広い' },
        ]),
        // |x-c| <= |y-c| の砂時計形 (咽喉の広さは設定で調整)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (Math.abs(x - c) > Math.abs(y - c) + (P('waist') || 0)) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        // 虚無地帯は枯れた砂の彫り込みで自前描画
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`, `            const covered = new Set(); // ピース描画でカバー済みのマス

            // 砂時計の外側: 枯れた砂地
            {
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                ctx.save();
                ctx.fillStyle = '#4a3b26';
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                }
                ctx.fillStyle = 'rgba(215,185,120,0.16)';
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    const sx = padding + x * cellSize + Math.sin(x * 12.9 + y * 78.2) * cellSize * 0.3;
                    const sy = padding + y * cellSize + Math.cos(x * 39.2 + y * 12.5) * cellSize * 0.3;
                    ctx.beginPath();
                    ctx.arc(sx, sy, cellSize * 0.05, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.strokeStyle = currentTheme.lineColor;
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    if (x > 0 && isV(x - 1, y)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx - hh, cy + hh); }
                    if (x < BOARD_SIZE - 1 && isV(x + 1, y)) { ctx.moveTo(cx + hh, cy - hh); ctx.lineTo(cx + hh, cy + hh); }
                    if (y > 0 && isV(x, y - 1)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx + hh, cy - hh); }
                    if (y < BOARD_SIZE - 1 && isV(x, y + 1)) { ctx.moveTo(cx - hh, cy + hh); ctx.lineTo(cx + hh, cy + hh); }
                }
                ctx.stroke();
                ctx.restore();
            }`],
        ...K.WALL_GUARD_SPEC,
        // 絞り口に金点
        K.CUE_STARS(`            {
                const c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.fillStyle = '#b8860b';
                ctx.beginPath();
                ctx.arc(padding + c * cellSize, padding + c * cellSize, cellSize * 0.16, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '上下の三角形が中央1点でだけ繋がる砂時計形。',
            '中央の咽喉を押さえれば上下の連絡を断てる。',
        ])],
        // 砂落ち: 絞り口に砂が流れ落ちる
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const c = Math.floor(BOARD_SIZE / 2);
            ctx2.save();
            for (let k = 0; k < 6; k++) {
                const t = ((now / 2400) + k * 0.41) % 1;
                const gy = pad + (c - 1.7 + t * 3.4) * cs;
                const gx = pad + c * cs + Math.sin(k * 5.3) * cs * 0.16;
                ctx2.fillStyle = 'rgba(235,205,140,' + (0.6 - Math.abs(t - 0.5)).toFixed(3) + ')';
                ctx2.beginPath();
                ctx2.arc(gx, gy, cs * 0.045, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, c = Math.floor(N / 2);
        assert('絞り口(天元)は置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('中段の脇は壁', board[c * N] === 3 && isValidPlacement([{ x: 0, y: c }], 1) === false);
        assert('上の隅は置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('下半分も三角', isValidPlacement([{ x: 0, y: N - 1 }], 1) === true);
    `,
};
