// SCATTERGO — 散布碁: 自石からちょうど距離3の環状帯にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'scattergo.html',
    en: 'SCATTERGO',
    jp: '散布碁',
    prefix: 'scattergo',
    desc: '着手は自石からちょうど3マスの環状帯のみ。石は種を撒くように散る。',
    kind: 'scatter',
    spec: [
        ...K.rb('SCATTERGO', '散布碁', 'scattergo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 散布碁ルール: いずれかの自石からチェビシェフ距離がちょうど3の点のみ (初手は自由)
            {
                let hasOwn = false, sown = false;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    hasOwn = true;
                    const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                    for (const p of cells) {
                        if (Math.max(Math.abs(p.x - sx), Math.abs(p.y - sy)) === 3) sown = true;
                    }
                    if (sown) break;
                }
                if (hasOwn && !sown) return false;
            }`],
        // 散布: 種を撒いた自石を光らせ、着地点に種の飛沫を散らす
        [K.ONE, K.CAPTURE_BLOCK, `            // 散布: 距離3の帯上にある種元の自石を光らせ、着地点に種の飛沫
            {
                const mc = move.cells[0];
                const mi = mc.y * BOARD_SIZE + mc.x;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player || i === mi) continue;
                    const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                    if (Math.max(Math.abs(mc.x - sx), Math.abs(mc.y - sy)) === 3) {
                        fxGlow(i, '#a3e635', 650);
                        break;
                    }
                }
                fxSplash(mi, '#bef264', 6);
            }

            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        K.CUE_GRID(`            // 散布: 各自石の距離3環状帯の角を薄く示す
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.18);
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== turn) continue;
                    const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                    ctx.strokeRect(padding + (sx - 3.5) * cellSize, padding + (sy - 3.5) * cellSize,
                        cellSize * 7, cellSize * 7);
                }
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は自分の石からちょうど3マス離れた環状帯の点のみ (初手は自由)。',
            '石は即座には連ならず、散布された点が後の着手で繋がり合う。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        board[4 * BOARD_SIZE + 4] = 1; // (4,4)に黒
        assert('距離3の帯上は置ける', isValidPlacement([{ x: 7, y: 7 }], 1) === true);
        assert('帯の直交端も置ける', isValidPlacement([{ x: 7, y: 4 }], 1) === true);
        assert('距離2は不可', isValidPlacement([{ x: 6, y: 6 }], 1) === false);
        assert('距離4は不可', isValidPlacement([{ x: 8, y: 8 }], 1) === false);
        assert('隣接は不可', isValidPlacement([{ x: 5, y: 4 }], 1) === false);
        board.fill(0);
        assert('初手は自由', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
