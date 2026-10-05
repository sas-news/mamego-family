// CLOCKGO — 時計碁: 12の時刻区域が1手ごとに時計回りに進む
const K = require('../gen_kit.js');
module.exports = {
    file: 'clockgo.html',
    en: 'CLOCKGO',
    jp: '時計碁',
    prefix: 'clockgo',
    desc: '盤は12の時刻区域。着手可の区域は1手ごとに時計回りに進む。',
    kind: 'clock',
    spec: [
        ...K.rb('CLOCKGO', '時計碁', 'clockgo'),
        K.params([
            { key: 'hours', label: '時刻区域の数', min: 4, max: 24, def: 12, unit: '区' },
            { key: 'hour_step', label: '区域の進み幅', min: 1, max: 4, def: 1, unit: '区/手' },
        ]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 時計碁ルール: 天元を文字盤に12分割。手数 mod 12 の時刻区域のみ着手可
            {
                const c = (BOARD_SIZE - 1) / 2;
                const HH = Math.max(2, P('hours') || 12); // 時刻区域の数
                const allowed = (history.length * Math.max(1, P('hour_step') || 1)) % HH; // 0=12時
                for (const p of cells) {
                    const dx = p.x - c, dy = p.y - c;
                    if (dx === 0 && dy === 0) continue; // 天元(針の軸)は常に許可
                    // 画面上で12時=0として時計回りの角度に変換 (y下向きなのでatan2増加=時計回り)
                    const a = (Math.atan2(dy, dx) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
                    const h = Math.floor(a / (Math.PI * 2) * HH) % HH;
                    if (h !== allowed) return false;
                }
            }`],
        ...K.EVENT_CHIP_SPEC(`'時刻区域: ' + (((history.length * Math.max(1, P('hour_step') || 1)) % Math.max(2, P('hours') || 12)) || Math.max(2, P('hours') || 12)) + '時'`),
        K.CUE_GRID(`            // 時計: 現在の時刻区域を扇形で照らす
            {
                const c = (BOARD_SIZE - 1) / 2;
                const HH = Math.max(2, P('hours') || 12);
                const h0 = (history.length * Math.max(1, P('hour_step') || 1)) % HH;
                const a0 = h0 * Math.PI * 2 / HH - Math.PI / 2;
                const a1 = a0 + Math.PI * 2 / HH;
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                const rr = (c + 0.5) * cellSize;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.16);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, rr, a0, a1);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }`),
        // 時計盤: 外周の12目盛りと現在区域を指す赤い針
        K.CUE_STARS(`            {
                const c = (BOARD_SIZE - 1) / 2;
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                const rr = (c + 0.40) * cellSize;
                ctx.save();
                const HH2 = Math.max(2, P('hours') || 12);
                for (let k = 0; k < HH2; k++) {
                    const a = k * Math.PI * 2 / HH2 - Math.PI / 2;
                    const cur = k === (history.length * Math.max(1, P('hour_step') || 1)) % HH2;
                    ctx.strokeStyle = cur ? '#dc2626' : alphaColor(currentTheme.lineColor, 0.6);
                    ctx.lineWidth = cur ? Math.max(2.2, cellSize * 0.075) : Math.max(1.2, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
                    ctx.lineTo(cx + Math.cos(a) * (rr + cellSize * 0.18), cy + Math.sin(a) * (rr + cellSize * 0.18));
                    ctx.stroke();
                }
                const ha = ((history.length * Math.max(1, P('hour_step') || 1)) % HH2) * Math.PI * 2 / HH2 - Math.PI / 2;
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = Math.max(2, cellSize * 0.06);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(ha) * rr * 0.9, cy + Math.sin(ha) * rr * 0.9);
                ctx.stroke();
                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.09, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_BASE, K.rv([
            '盤面は天元を軸に12の時刻区域。着手は現在の時刻区域内のみ (天元は常に可)。',
            '区域は1手ごとに時計回りに1時間進む。12時方向から針は回り始める。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        history.length = 0;
        const c = (BOARD_SIZE - 1) / 2;
        assert('12時区域(真上)は置ける', isValidPlacement([{ x: c, y: c - 3 }], 1) === true);
        assert('天元は常に置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('3時区域(真右)は不可', isValidPlacement([{ x: c + 3, y: c }], 1) === false);
        assert('6時区域(真下)は不可', isValidPlacement([{ x: c, y: c + 3 }], 1) === false);
        board.fill(0);
        executeMove({ cells: [{ x: c, y: c - 3 }] }, 1);     // 12時区域
        executeMove({ cells: [{ x: c + 3, y: c - 3 }] }, 2); // 1時区域
        executeMove({ cells: [{ x: c + 3, y: c - 1 }] }, 1); // 2時区域
        assert('3手後は3時区域', isValidPlacement([{ x: c + 3, y: c }], 2) === true);
        assert('3時以外は不可', isValidPlacement([{ x: c - 3, y: c }], 2) === false);
    `,
};
