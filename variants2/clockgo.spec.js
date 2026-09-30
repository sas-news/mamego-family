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
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 時計碁ルール: 天元を文字盤に12分割。手数 mod 12 の時刻区域のみ着手可
            {
                const c = (BOARD_SIZE - 1) / 2;
                const allowed = history.length % 12; // 0=12時, 3=3時, 6=6時, 9=9時
                for (const p of cells) {
                    const dx = p.x - c, dy = p.y - c;
                    if (dx === 0 && dy === 0) continue; // 天元(針の軸)は常に許可
                    // 画面上で12時=0として時計回りの角度に変換 (y下向きなのでatan2増加=時計回り)
                    const a = (Math.atan2(dy, dx) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
                    const h = Math.floor(a / (Math.PI * 2) * 12) % 12;
                    if (h !== allowed) return false;
                }
            }`],
        ...K.EVENT_CHIP_SPEC(`'時刻区域: ' + (history.length % 12 === 0 ? 12 : history.length % 12) + '時'`),
        K.CUE_GRID(`            // 時計: 現在の時刻区域を扇形で照らす
            {
                const c = (BOARD_SIZE - 1) / 2;
                const h0 = history.length % 12;
                const a0 = h0 * Math.PI / 6 - Math.PI / 2;
                const a1 = a0 + Math.PI / 6;
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
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
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
