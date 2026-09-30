// CHECKERGO — 市松碁: 黒マスのみ着手可、全石が孤立する
const K = require('../gen_kit.js');
module.exports = {
    file: 'checkergo.html',
    en: 'CHECKERGO',
    jp: '市松碁',
    prefix: 'checkergo',
    desc: '市松の黒マスにしか置けない。全ての石が孤立する緊張の碁。',
    kind: 'stone',
    spec: [
        ...K.rb('CHECKERGO', '市松碁', 'checkergo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                // 市松: 黒マス (x+y が偶数) のみ着手可
                if ((p.x + p.y) % 2 !== 0) return false;
            }`],
        // 白マスを薄くトーン差で表示
        K.CUE_GRID(`            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.10);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if ((x + y) % 2 === 1) {
                        ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                    }
                }
                ctx.restore();
            }`),
        // チェッカー駒: 全石の面に同心リングを刻む
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = v === 1 ? 'rgba(255,255,255,0.38)' : 'rgba(30,30,30,0.38)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.27, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.14, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手できるのは市松模様の黒マスだけ。',
            '黒マス同士は直交しないので全ての石が孤立。1石ずつの取り合いになる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('白マス(0,1)は置けない', isValidPlacement([{ x: 0, y: 1 }], 1) === false);
        assert('黒マス(0,0)は置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('斜めの黒マスも置ける', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('置いた石は常に孤立', getNeighbors(0).every(n => board[n] !== 1));
        board.fill(0);
        board[0] = 1; board[1] = 2; board[BOARD_SIZE] = 2;
        assert('孤立石も呼吸が尽きれば取れる', getCapturedStones(board, 1).includes(0));
    `,
};
