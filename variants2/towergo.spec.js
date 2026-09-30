// TOWERGO — 塔碁: 3層フロア。上下層の同じ局所座標が近傍
const K = require('../gen_kit.js');
module.exports = {
    file: 'towergo.html',
    en: 'TOWERGO',
    jp: '塔碁',
    prefix: 'towergo',
    desc: '水平3層の塔。隣の層の同じ位置とだけ垂直に繋がる。',
    kind: 'stone',
    spec: [
        ...K.rb('TOWERGO', '塔碁', 'towergo'),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const fh = Math.ceil(BOARD_SIZE / 3);
            const band = Math.min(2, Math.floor(y / fh));
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            // 層の継ぎ目では上下は繋がらない
            if (y > 0 && Math.min(2, Math.floor((y - 1) / fh)) === band) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1 && Math.min(2, Math.floor((y + 1) / fh)) === band) neighbors.push(idx + BOARD_SIZE);

            // 塔の接続: 上下層の同じ局所座標 (x, 層内行) 同士
            const ly = y - band * fh;
            if (band > 0) neighbors.push(idx - fh * BOARD_SIZE);
            const nextH = Math.min(fh, BOARD_SIZE - (band + 1) * fh);
            if (band < 2 && ly < nextH) neighbors.push(idx + fh * BOARD_SIZE);
            return neighbors;
        }`],
        // 層の境目に太線
        K.CUE_GRID(`            {
                const fh = Math.ceil(BOARD_SIZE / 3);
                ctx.save();
                ctx.strokeStyle = currentTheme.lineColor;
                ctx.lineWidth = Math.max(2, cellSize * 0.09);
                for (let k = 1; k <= 2; k++) {
                    const yy = padding + k * fh * cellSize - cellSize / 2;
                    ctx.beginPath();
                    ctx.moveTo(padding - cellSize * 0.5, yy);
                    ctx.lineTo(width - padding + cellSize * 0.5, yy);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は水平に3層。層の継ぎ目で上下は切れている。',
            '代わりに隣の層の同じ局所座標 (x と層内の行が同じ点) だけが繋がる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, fh = Math.ceil(N / 3);
        assert('同じ局所座標が上層と繋がる', getNeighbors(0).includes(fh * N));
        assert('層の継ぎ目は切れている', !getNeighbors((fh - 1) * N).includes(fh * N));
        assert('中層は上下に繋がる', getNeighbors(fh * N).includes(0) && getNeighbors(fh * N).includes(2 * fh * N));
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
