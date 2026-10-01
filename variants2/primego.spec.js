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
        K.params([{ key: 'rule', label: '着手条件', options: [{ v: 'and', l: 'x,yともに素数' }, { v: 'or', l: 'x,yどちらかが素数' }, { v: 'sum', l: 'x+yが素数' }], def: 'and' }]),
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
                const _pm = P('rule') || 'and';
                for (const p of cells) {
                    const _ok = _pm === 'or' ? (isPrime(p.x) || isPrime(p.y))
                        : _pm === 'sum' ? isPrime(p.x + p.y)
                        : (isPrime(p.x) && isPrime(p.y));
                    if (!_ok) return false;
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
                ctx.fillStyle = alphaColor('#e8c766', 0.55);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const _pm2 = P('rule') || 'and';
                    const _okm = _pm2 === 'or' ? (isP(x) || isP(y))
                        : _pm2 === 'sum' ? isP(x + y)
                        : (isP(x) && isP(y));
                    if (!_okm) continue;
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, Math.max(1.8, cellSize * 0.08), 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        // 素数点の瞬き (星座のような明滅)
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const isP = n => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
            ctx2.save();
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!isP(x) || !isP(y)) continue;
                const tw = Math.sin(now / 480 + x * 2.9 + y * 4.1);
                if (tw <= 0.55) continue;
                const cx = pad + x * cs, cy = pad + y * cs, r = cs * 0.17;
                ctx2.strokeStyle = 'rgba(255,235,170,' + ((tw - 0.55) * 0.9).toFixed(3) + ')';
                ctx2.lineWidth = Math.max(0.8, cs * 0.03);
                ctx2.beginPath();
                ctx2.moveTo(cx - r, cy); ctx2.lineTo(cx + r, cy);
                ctx2.moveTo(cx, cy - r); ctx2.lineTo(cx, cy + r);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
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
