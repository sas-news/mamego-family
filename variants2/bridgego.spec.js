// BRIDGEGO — 架橋碁: 海峡で分かれた左右大陸を1本の橋が繋ぐ
const K = require('../gen_kit.js');
module.exports = {
    file: 'bridgego.html',
    en: 'BRIDGEGO',
    jp: '架橋碁',
    prefix: 'bridgego',
    desc: '中央の海峡で断たれた2大陸。唯一の橋を巡る攻防。',
    kind: 'stone',
    spec: [
        ...K.rb('BRIDGEGO', '架橋碁', 'bridgego'),
        // 中央列を海峡に (中央1点だけ橋)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2);
                for (let y = 0; y < BOARD_SIZE; y++) board[y * BOARD_SIZE + c] = 3;
                board[c * BOARD_SIZE + c] = 0;
            }`],
        // 海峡は青く
                [K.ONE, '            const covered = new Set(); // ピース描画でカバー済みのマス', `            const covered = new Set(); // ピース描画でカバー済みのマス

            // 海峡: 深い海のグラデ + ゆらぐ波紋
            {
                const now = fxNow();
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createLinearGradient(cx, cy - hh, cx, cy + hh);
                    g.addColorStop(0, '#16466e');
                    g.addColorStop(0.55, '#0e3050');
                    g.addColorStop(1, '#0a2438');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const ph = Math.sin(now / 620 + y * 0.85 + x * 0.4);
                    ctx.strokeStyle = 'rgba(150,220,255,' + (0.24 + ph * 0.16).toFixed(3) + ')';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx + ph * cellSize * 0.08, cy, cellSize * (0.2 + ph * 0.06), Math.PI * 0.15, Math.PI * 0.85);
                    ctx.stroke();
                }
                ctx.restore();
            }`],
        ...K.WALL_GUARD_SPEC,
        // 橋に木の板マーク
        K.CUE_STARS(`            // 架橋: 海峡に架かる板橋
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                ctx.save();
                ctx.fillStyle = '#5d3d20';
                ctx.fillRect(cx - cellSize * 0.52, cy - cellSize * 0.42, cellSize * 1.04, cellSize * 0.84);
                ctx.fillStyle = '#8a5a2b';
                for (let k = 0; k < 4; k++) {
                    ctx.fillRect(cx - cellSize * 0.46 + k * cellSize * 0.25, cy - cellSize * 0.36, cellSize * 0.19, cellSize * 0.72);
                }
                ctx.fillStyle = '#3d2812';
                ctx.fillRect(cx - cellSize * 0.52, cy - cellSize * 0.42, cellSize * 1.04, cellSize * 0.07);
                ctx.fillRect(cx - cellSize * 0.52, cy + cellSize * 0.35, cellSize * 1.04, cellSize * 0.07);
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央の海峡で左右2つの大陸に分断。',
            '渡れるのは中央1点の橋だけ。橋頭堡を押さえれば大陸間の連絡を断てる。',
        ])],
        // 海峡の泡沫 (常時描画で水面をアニメ化)
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const c = Math.floor(BOARD_SIZE / 2);
            ctx2.save();
            for (let k = 0; k < 6; k++) {
                const t = ((now / 3400) + k * 0.37) % 1;
                const fy = pad + t * (BOARD_SIZE - 1) * cs;
                const fx = pad + c * cs + Math.sin(now / 900 + k * 2.1) * cs * 0.22;
                ctx2.fillStyle = 'rgba(200,235,255,' + (0.45 - Math.abs(t - 0.5)).toFixed(3) + ')';
                ctx2.beginPath();
                ctx2.arc(fx, fy, cs * 0.05, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, c = Math.floor(N / 2);
        assert('橋は渡れる', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('海峡は置けない', isValidPlacement([{ x: c, y: 0 }], 1) === false);
        assert('橋で両岸が繋がる', getNeighbors(c * N + c - 1).includes(c * N + c) && getNeighbors(c * N + c + 1).includes(c * N + c));
        const t = board.slice(); t[c * N + c] = 3;
        const seen = new Set([0]); const qq = [0];
        while (qq.length) {
            const i = qq.pop();
            getNeighbors(i).forEach(n => { if (t[n] === 0 && !seen.has(n)) { seen.add(n); qq.push(n); } });
        }
        assert('橋を失えば渡れない', ![...seen].some(i => i % N > c));
        assert('大陸の上は普通に置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
