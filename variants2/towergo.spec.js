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
        K.CUE_GRID(`            // 3層フロア: 階ごとの帯色 + 層ラベル + 二重の継目
            {
                const fh = Math.ceil(BOARD_SIZE / 3);
                const tints = ['rgba(255,185,110,0.10)', 'rgba(255,255,255,0.04)', 'rgba(130,175,255,0.12)'];
                ctx.save();
                for (let b = 0; b < 3; b++) {
                    const y0 = b * fh, y1 = Math.min(BOARD_SIZE, y0 + fh);
                    ctx.fillStyle = tints[b];
                    ctx.fillRect(padding - cellSize * 0.5, padding + y0 * cellSize - cellSize * 0.5, width - padding * 2 + cellSize, (y1 - y0) * cellSize);
                }
                ctx.strokeStyle = currentTheme.lineColor;
                for (let k = 1; k <= 2; k++) {
                    const yy = padding + k * fh * cellSize - cellSize / 2;
                    ctx.lineWidth = Math.max(2.4, cellSize * 0.1);
                    ctx.beginPath();
                    ctx.moveTo(padding - cellSize * 0.5, yy);
                    ctx.lineTo(width - padding + cellSize * 0.5, yy);
                    ctx.stroke();
                    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.028);
                    ctx.beginPath();
                    ctx.moveTo(padding - cellSize * 0.5, yy - cellSize * 0.08);
                    ctx.lineTo(width - padding + cellSize * 0.5, yy - cellSize * 0.08);
                    ctx.stroke();
                    ctx.strokeStyle = currentTheme.lineColor;
                }
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.8);
                ctx.font = 'bold ' + (cellSize * 0.34).toFixed(1) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let b = 0; b < 3; b++) {
                    ctx.fillText((b + 1) + 'F', padding - cellSize * 0.62, padding + (b * fh + fh / 2) * cellSize - cellSize * 0.5);
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は水平に3層。層の継ぎ目で上下は切れている。',
            '代わりに隣の層の同じ局所座標 (x と層内の行が同じ点) だけが繋がる。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
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
