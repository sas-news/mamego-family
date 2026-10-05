// GEYSERGO — 間欠泉碁: 星の噴き口が5手ごとに噴火し、乗った石を吹き飛ばす
const K = require('../gen_kit.js');
module.exports = {
    file: 'geysergo.html',
    en: 'GEYSERGO',
    jp: '間欠泉碁',
    prefix: 'geysergo',
    desc: '四つの星は間欠泉。5手ごとに噴火して乗った石を吹き飛ばす。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('GEYSERGO', '間欠泉碁', 'geysergo'),
        K.params([
            { key: 'erupt_interval', label: '噴出の間隔', min: 2, max: 15, def: 5, unit: '手' },
        ]),
        // 5手ごとに噴火: 噴き口(中央以外の星)上の石を吹き飛ばす
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 間欠泉ルール: 5手ごとに噴火。噴き口 (中央以外の星) 上の石は吹き飛んでアゲハマへ。
            if (history.length % Math.max(1, P('erupt_interval') || 5) === 0) {
                const N = BOARD_SIZE, c = Math.floor(N / 2);
                let blown = 0;
                for (const pt of getStarPoints(N)) {
                    if (pt.x === c && pt.y === c) continue; // 天元は泉ではない
                    const i = pt.y * N + pt.x;
                    // 噴き上がる水柱と湯しぶき (泉は石の有無にかかわらず噴火する)
                    fxSplash(i, '#7dd3fc', 10);
                    fxSplash(i, '#e0f2fe', 6);
                    if (board[i] === 1 || board[i] === 2) {
                        captures[board[i] === 1 ? 2 : 1]++;
                        board[i] = 0;
                        fxBurst(i, '#38bdf8', 7, 1.3);
                        blown++;
                    }
                }
                if (blown > 0) {
                    fxShake(4, 260);
                    fxText(getStarPoints(N)[0].y * N + getStarPoints(N)[0].x, '噴火!', '#38bdf8', 900);
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        // 噴き口の描画
        K.CUE_STARS(`            // 間欠泉: 噴き口に水色の二重環 (噴火が近づくほど沸き立つ)
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const _ei = P('erupt_interval') || 5;
                const heat = (history.length % _ei) / _ei; // 噴火間近ほど1に近い
                const now = fxNow();
                ctx.save();
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                for (const pt of getStarPoints(BOARD_SIZE)) {
                    if (pt.x === c && pt.y === c) continue;
                    const cx = padding + pt.x * cellSize, cy = padding + pt.y * cellSize;
                    const wob = Math.sin(now / 120 + pt.x + pt.y) * cellSize * 0.02 * (1 + heat * 2);
                    ctx.strokeStyle = 'rgba(80,170,255,' + (0.45 + heat * 0.45) + ')';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.22 + wob, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 0.25 + heat * 0.45;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.32 + wob * 1.5, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                    // 噴火直前は中心に湯のたまり
                    if (heat >= 0.8) {
                        ctx.fillStyle = 'rgba(150,220,255,' + (heat - 0.75) * 1.8 + ')';
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.12, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'噴火まで ' + ((P('erupt_interval') || 5) - history.length % (P('erupt_interval') || 5)) + ' 手'`),
        [K.ONE, K.RV_BASE, K.rv([
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
