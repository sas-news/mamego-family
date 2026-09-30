// FLOODGO — 洪水碁: 2手ごとに水位が1段上がり、低い段の石は沈み、水没域は打てない
const K = require('../gen_kit.js');
module.exports = {
    file: 'floodgo.html',
    en: 'FLOODGO',
    jp: '洪水碁',
    prefix: 'floodgo',
    desc: '下から水位が上がる。2手ごとに1段沈む。水没域は打てず石は流される。',
    kind: 'stone',
    spec: [
        ...K.rb('FLOODGO', '洪水碁', 'floodgo'),
        // 水没域 (下から水位段の行) には打てない
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                // 洪水: 水没域 (下から水位分の行) には打てない
                if (p.y >= BOARD_SIZE - Math.floor(history.length / 2)) return false;
            }`],
        // 着手ごと、水位が上がり低い段の石が沈む
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 洪水ルール: 2手ごとに水位が1段上がり (下から)。水没域の石は沈んでアゲハマへ。
            {
                const N = BOARD_SIZE;
                const wl = Math.floor(history.length / 2);
                if (wl > 0) {
                    for (let y = N - wl; y < N; y++) for (let x = 0; x < N; x++) {
                        const i = y * N + x;
                        if (board[i] === 1 || board[i] === 2) {
                            captures[board[i] === 1 ? 2 : 1]++;
                            board[i] = 0;
                            fxSplash(i, 'rgba(110,180,250,0.9)', 9); // 沈む水しぶき
                        }
                    }
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 水面の描画
        K.CUE_GRID(`            // 洪水: 下から上がる水面
            {
                const wl = Math.floor(history.length / 2);
                if (wl > 0) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(60,140,230,0.30)';
                    const y0 = padding + (BOARD_SIZE - wl - 0.5) * cellSize;
                    ctx.fillRect(padding - cellSize * 0.5, y0, cellSize * BOARD_SIZE, cellSize * wl);
                    ctx.strokeStyle = 'rgba(120,190,255,0.6)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.06);
                    ctx.beginPath();
                    for (let x = 0; x <= BOARD_SIZE; x++) {
                        const px = padding + (x - 0.5) * cellSize;
                        const py = y0 + Math.sin(x * 1.5) * cellSize * 0.08;
                        if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`'水位 ' + Math.floor(history.length / 2) + ' 段'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の下から2手ごとに水位が1段上がる。水没域には打てず、そこの石は沈んでアゲハマに。',
            '高みを目指して打ち進め。全部が沈む前に決着を。',
        ])],
        // 水没域の揺れる水面と立ち上る泡 (常時)
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const wl = Math.floor(history.length / 2);
            if (wl <= 0) return;
            const y0 = pad + (BOARD_SIZE - wl - 0.5) * cs;
            ctx2.save();
            // 揺れる水面線
            ctx2.strokeStyle = 'rgba(160,215,255,0.55)';
            ctx2.lineWidth = Math.max(1.2, cs * 0.06);
            ctx2.beginPath();
            for (let x = 0; x <= BOARD_SIZE; x++) {
                const px = pad + (x - 0.5) * cs;
                const py = y0 + Math.sin(x * 1.5 + now / 380) * cs * 0.10;
                if (x === 0) ctx2.moveTo(px, py); else ctx2.lineTo(px, py);
            }
            ctx2.stroke();
            // 水中の泡
            ctx2.fillStyle = 'rgba(200,235,255,0.4)';
            const w = cs * BOARD_SIZE;
            for (let k = 0; k < 12; k++) {
                const t = ((now / 2400) + k * 0.19) % 1;
                const px = pad - cs * 0.5 + ((k * 61.7) % 1) * w;
                const py = y0 + cs * 0.3 + (1 - t) * cs * (wl - 0.3);
                ctx2.beginPath();
                ctx2.arc(px, py, cs * (0.03 + (k % 3) * 0.02), 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        const last = BOARD_SIZE - 1;
        board.fill(0);
        executeMove({ cells: [{ x: 4, y: last }] }, 1); // 1手目: 水位0
        assert('水位0の間は最下段でも無事', board[last * BOARD_SIZE + 4] === 1);
        const c2 = captures[2];
        executeMove({ cells: [{ x: 8, y: 0 }] }, 2); // 2手目: 水位1 → 最下段が沈む
        assert('最下段の石が水没する', board[last * BOARD_SIZE + 4] === 0 && captures[2] === c2 + 1);
        assert('水没域には打てない', isValidPlacement([{ x: 5, y: last }], 1) === false);
        assert('水面より上は打てる', isValidPlacement([{ x: 5, y: last - 1 }], 1) === true);
    `,
};
