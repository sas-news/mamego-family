// MODGO — 剰余碁: x+y mod 3 の許可帯が手数ごとに巡回する
const K = require('../gen_kit.js');
module.exports = {
    file: 'modgo.html',
    en: 'MODGO',
    jp: '剰余碁',
    prefix: 'modgo',
    desc: '着手点は (x+y) mod 3 が手数と一致する帯のみ。3手周期で許可域が回る。',
    kind: 'modulo',
    spec: [
        ...K.rb('MODGO', '剰余碁', 'modgo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 剰余碁ルール: (x+y) mod 3 が現在の許可帯 (手数-1 mod 3) と一致する点のみ
            {
                const allowed = history.length % 3;
                for (const p of cells) {
                    if ((p.x + p.y) % 3 !== allowed) return false;
                }
            }`],
        ...K.EVENT_CHIP_SPEC(`'許可帯: x+y ≡ ' + (history.length % 3) + ' (mod 3)'`),
        ...K.LEGAL_DOTS_SPEC,
        K.CUE_GRID(`            // 剰余帯: 現在許可の対角帯を薄く帯色で示す
            {
                const band = history.length % 3;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.10);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if ((x + y) % 3 !== band) continue;
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手点は (x+y) mod 3 が許可帯と一致する交点のみ。許可帯は着手ごとに 0→1→2→0… と巡回する。',
            'パスは帯を進めない。打てる点が無い帯の番ではパスを選ぶしかない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        history.length = 0;
        assert('帯0: x+y=0の点', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('帯0: x+y=3の点', isValidPlacement([{ x: 2, y: 1 }], 1) === true);
        assert('帯0: x+y=1の点は不可', isValidPlacement([{ x: 1, y: 0 }], 1) === false);
        board.fill(0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('帯1へ巡回: x+y=1が有効', isValidPlacement([{ x: 1, y: 0 }], 2) === true);
        assert('帯1: x+y=0は不可', isValidPlacement([{ x: 3, y: 0 }], 2) === false);
    `,
};
