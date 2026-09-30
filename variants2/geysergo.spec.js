// GEYSERGO — 間欠泉碁: 星の噴き口が5手ごとに噴火し、乗った石を吹き飛ばす
const K = require('../gen_kit.js');
module.exports = {
    file: 'geysergo.html',
    en: 'GEYSERGO',
    jp: '間欠泉碁',
    prefix: 'geysergo',
    desc: '四つの星は間欠泉。5手ごとに噴火して乗った石を吹き飛ばす。',
    kind: 'stone',
    spec: [
        ...K.rb('GEYSERGO', '間欠泉碁', 'geysergo'),
        // 5手ごとに噴火: 噴き口(中央以外の星)上の石を吹き飛ばす
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 間欠泉ルール: 5手ごとに噴火。噴き口 (中央以外の星) 上の石は吹き飛んでアゲハマへ。
            if (history.length % 5 === 0) {
                const N = BOARD_SIZE, c = Math.floor(N / 2);
                for (const pt of getStarPoints(N)) {
                    if (pt.x === c && pt.y === c) continue; // 天元は泉ではない
                    const i = pt.y * N + pt.x;
                    if (board[i] === 1 || board[i] === 2) {
                        captures[board[i] === 1 ? 2 : 1]++;
                        board[i] = 0;
                    }
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        // 噴き口の描画
        K.CUE_STARS(`            // 間欠泉: 噴き口に水色の二重環
            {
                const c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.strokeStyle = 'rgba(80,170,255,0.65)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                for (const pt of getStarPoints(BOARD_SIZE)) {
                    if (pt.x === c && pt.y === c) continue;
                    const cx = padding + pt.x * cellSize, cy = padding + pt.y * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.22, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
                    ctx.globalAlpha = 0.4;
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'噴火まで ' + (5 - history.length % 5) + ' 手'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '四つの星は間欠泉: 5手ごとに一斉噴火して、噴き口上の石を吹き飛ばす。',
            '吹き飛んだ石は相手のアゲハマになる。噴き口を使うのは噴火直後が安全。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // 噴き口上に黒
        assert('噴火前は無事', board[3 * BOARD_SIZE + 3] === 1);
        const c2 = captures[2];
        const cells = [[8, 8], [7, 8], [8, 7], [9, 9]];
        for (let k = 0; k < 4; k++) executeMove({ cells: [{ x: cells[k][0], y: cells[k][1] }] }, k % 2 + 1);
        // 5手目で噴火
        assert('噴火で吹き飛ぶ', board[3 * BOARD_SIZE + 3] === 0 && captures[2] === c2 + 1);
        board.fill(0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 泉でない場所は噴火しても無事
        const cells2 = [[8, 8], [7, 8], [8, 7], [9, 9]];
        for (let k = 0; k < 4; k++) executeMove({ cells: [{ x: cells2[k][0], y: cells2[k][1] }] }, k % 2 + 1);
        assert('泉でない石は残る', board[0] === 1);
    `,
};
