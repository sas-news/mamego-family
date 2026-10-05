// SPIRALGO — 螺旋碁: 盤が1本の螺旋通路 = 事実上1次元
const K = require('../gen_kit.js');
module.exports = {
    file: 'spiralgo.html',
    en: 'SPIRALGO',
    jp: '螺旋碁',
    prefix: 'spiralgo',
    desc: '盤全体が1本の螺旋通路。近傍は前後2方向だけの1次元碁。',
    kind: 'stone',
    spec: [
        ...K.rb('SPIRALGO', '螺旋碁', 'spiralgo'),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            // 螺旋順序をサイズごとに1回構築
            if (!getNeighbors._ord || getNeighbors._size !== BOARD_SIZE) {
                const N = BOARD_SIZE, order = [];
                let x0 = 0, x1 = N - 1, y0 = 0, y1 = N - 1;
                while (x0 <= x1 && y0 <= y1) {
                    for (let x = x0; x <= x1; x++) order.push(y0 * N + x);
                    for (let y = y0 + 1; y <= y1; y++) order.push(y * N + x1);
                    if (y0 < y1) for (let x = x1 - 1; x >= x0; x--) order.push(y1 * N + x);
                    if (x0 < x1) for (let y = y1 - 1; y > y0; y--) order.push(y * N + x0);
                    x0++; x1--; y0++; y1--;
                }
                const pos = new Array(N * N).fill(0);
                order.forEach((cell, i) => { pos[cell] = i; });
                getNeighbors._ord = order;
                getNeighbors._pos = pos;
                getNeighbors._size = N;
            }
            const p = getNeighbors._pos[idx];
            const out = [];
            if (p > 0) out.push(getNeighbors._ord[p - 1]);
            if (p < getNeighbors._ord.length - 1) out.push(getNeighbors._ord[p + 1]);
            return out;
        }`],
        // 螺旋: 通路に沿って進む光の玉 (1次元通路であることを常時示す)
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const ord = render.__spiral;
            if (!ord || !ord.length) return;
            const head = (now / 80) % ord.length;
            ctx2.save();
            for (let k = 0; k < 7; k++) {
                const i = ord[Math.floor(((head - k * 2) % ord.length + ord.length) % ord.length)];
                ctx2.globalAlpha = 0.32 * (1 - k / 7);
                ctx2.fillStyle = '#7dd3fc';
                ctx2.beginPath();
                ctx2.arc(pad + (i % BOARD_SIZE) * cs, pad + Math.floor(i / BOARD_SIZE) * cs, cs * 0.09, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        // 螺旋通路を薄い線で描く
        K.CUE_GRID(`            {
                if (!render.__spiral || render.__spiralN !== BOARD_SIZE) {
                    const N = BOARD_SIZE, order = [];
                    let x0 = 0, x1 = N - 1, y0 = 0, y1 = N - 1;
                    while (x0 <= x1 && y0 <= y1) {
                        for (let x = x0; x <= x1; x++) order.push(y0 * N + x);
                        for (let y = y0 + 1; y <= y1; y++) order.push(y * N + x1);
                        if (y0 < y1) for (let x = x1 - 1; x >= x0; x--) order.push(y1 * N + x);
                        if (x0 < x1) for (let y = y1 - 1; y > y0; y--) order.push(y * N + x0);
                        x0++; x1--; y0++; y1--;
                    }
                    render.__spiral = order;
                    render.__spiralN = N;
                }
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.30);
                ctx.lineWidth = Math.max(1, cellSize * 0.06);
                ctx.lineJoin = 'round';
                ctx.beginPath();
                render.__spiral.forEach((ci, k) => {
                    const cx = padding + (ci % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(ci / BOARD_SIZE) * cellSize;
                    if (k === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
                });
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '盤は左上から中心へ渦を巻く1本の通路。各点の近傍は前後2方向だけ。',
            '連は通路に沿ってしか伸びず、両脇を塞がれると即座に取られる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('始端(0,0)の近傍は1', getNeighbors(0).length === 1);
        assert('途中の近傍は2', getNeighbors(1).length === 2);
        assert('通路は(0,0)→(1,0)と進む', getNeighbors(0)[0] === 1);
        board.fill(0);
        board[0] = 1; board[1] = 2; board[2] = 2;
        assert('通路の両脇で取れる', getCapturedStones(board, 1).includes(0));
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
