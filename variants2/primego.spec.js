// PRIMEGO — 素数碁: 両座標が素数の点にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'primego.html',
    en: 'PRIMEGO',
    jp: '素数碁',
    prefix: 'primego',
    desc: '着手点はx,yともに素数の交点のみ。疎らな星座を結ぶ碁。',
    kind: 'prime',
    spec: [
        ...K.rb('PRIMEGO', '素数碁', 'primego'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 素数碁ルール: x,y 両方が素数の交点にのみ着手可
            {
                const isPrime = n => {
                    if (n < 2) return false;
                    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
                    return true;
                };
                for (const p of cells) {
                    if (!isPrime(p.x) || !isPrime(p.y)) return false;
                }
            }`],
        K.CUE_GRID(`            // 素数点: 両座標が素数の交点を常時マーク
            {
                const isP = n => {
                    if (n < 2) return false;
                    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
                    return true;
                };
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.30);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isP(x) || !isP(y)) continue;
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, Math.max(1.8, cellSize * 0.08), 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は x,y 両座標が素数 (2,3,5,7,11,13,17) の交点のみ。',
            '盤面は疎らな星座となる。隣接する素数点同士でしか連が作れない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        assert('両方素数(2,3)は置ける', isValidPlacement([{ x: 2, y: 3 }], 1) === true);
        assert('両方素数(5,7)は置ける', isValidPlacement([{ x: 5, y: 7 }], 1) === true);
        assert('x非素数(4,3)は不可', isValidPlacement([{ x: 4, y: 3 }], 1) === false);
        assert('0は素数でない', isValidPlacement([{ x: 0, y: 2 }], 1) === false);
        assert('1は素数でない', isValidPlacement([{ x: 2, y: 1 }], 1) === false);
    `,
};
