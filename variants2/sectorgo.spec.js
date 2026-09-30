// SECTORGO — 回転扇碁: 8分割の扇形区域が1手ごとに回転する
const K = require('../gen_kit.js');
module.exports = {
    file: 'sectorgo.html',
    en: 'SECTORGO',
    jp: '回転扇碁',
    prefix: 'sectorgo',
    desc: '盤は8つの扇区。着手可の扇区は1手ごとに隣へ回転する。',
    kind: 'fan',
    spec: [
        ...K.rb('SECTORGO', '回転扇碁', 'sectorgo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 回転扇碁ルール: 天元を軸に8分割した扇区を、手数と一致する区のみ着手可
            {
                const c = (BOARD_SIZE - 1) / 2;
                const allowed = history.length % 8;
                for (const p of cells) {
                    const dx = p.x - c, dy = p.y - c;
                    if (dx === 0 && dy === 0) continue; // 天元は全区に属するとして常に許可
                    const s = Math.floor((Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2) * 8) % 8;
                    if (s !== allowed) return false;
                }
            }`],
        ...K.EVENT_CHIP_SPEC(`'扇区: ' + (history.length % 8 + 1) + '/8'`),
        K.CUE_GRID(`            // 回転扇: 現在の許可扇区を扇形で照らす
            {
                const c = (BOARD_SIZE - 1) / 2;
                const a0 = -Math.PI + (history.length % 8) * Math.PI / 4;
                const a1 = a0 + Math.PI / 4;
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
            '盤面は天元を軸に8つの扇区。着手は現在の許可扇区内のみ (天元は常に可)。',
            '許可扇区は1手ごとに隣へ回転する。打ちたい点の扇が回ってくるのを待て。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        history.length = 0;
        const c = (BOARD_SIZE - 1) / 2;
        assert('扇区0(左方向)は置ける', isValidPlacement([{ x: c - 3, y: c }], 1) === true);
        assert('天元は常に置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('扇区2(上方向)は不可', isValidPlacement([{ x: c, y: c - 3 }], 1) === false);
        assert('扇区5(右下)は不可', isValidPlacement([{ x: c + 3, y: c + 3 }], 1) === false);
        board.fill(0);
        executeMove({ cells: [{ x: c - 3, y: c }] }, 1);
        assert('扇区1(左上)へ回転', isValidPlacement([{ x: c - 3, y: c - 3 }], 2) === true);
        assert('扇区0はもう不可', isValidPlacement([{ x: c - 2, y: c }], 2) === false);
    `,
};
