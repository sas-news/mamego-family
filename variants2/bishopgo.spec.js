// BISHOPGO — 角行碁: 自石と同じ斜線上にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'bishopgo.html',
    en: 'BISHOPGO',
    jp: '角行碁',
    prefix: 'bishopgo',
    desc: '着手は自石と同じ斜線上のみ。角行のように盤を斜めに結ぶ。',
    kind: 'bishop',
    spec: [
        ...K.rb('BISHOPGO', '角行碁', 'bishopgo'),
        K.params([
            { key: 'free_places', label: '自由着手の数', min: 1, max: 5, def: 1, hint: 'この個数の自石までは斜線外にも着手できる' },
        ]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 角行碁ルール: 既存の自石と同じ斜線 (|dx|=|dy|>0) 上にのみ着手可 (初手は自由)
            {
                let ownCount = 0, onDiag = false;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    ownCount++;
                    const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                    for (const p of cells) {
                        if (Math.abs(p.x - sx) === Math.abs(p.y - sy) && (p.x !== sx || p.y !== sy)) onDiag = true;
                    }
                    if (onDiag) break;
                }
                // 自由着手の数を超える自石があると斜線制限が効く
                if (ownCount >= Math.max(1, P('free_places') || 1) && !onDiag) return false;
            }`],
        ...K.LEGAL_DOTS_SPEC,
        // 角行: 手番の石から斜線の射程を薄く照射 (着手可能線の可視化)
        ...K.CUE_STARS(`            {
                ctx.save();
                ctx.strokeStyle = turn === 1 ? 'rgba(20,20,20,0.18)' : 'rgba(235,235,235,0.30)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.beginPath();
                const n = BOARD_SIZE;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== turn) continue;
                    const x = i % n, y = (i / n) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const d1 = Math.min(x, y), d2 = Math.min(n - 1 - x, n - 1 - y);
                    const d3 = Math.min(n - 1 - x, y), d4 = Math.min(x, n - 1 - y);
                    ctx.moveTo(cx - d1 * cellSize, cy - d1 * cellSize);
                    ctx.lineTo(cx + d2 * cellSize, cy + d2 * cellSize);
                    ctx.moveTo(cx + d3 * cellSize, cy - d3 * cellSize);
                    ctx.lineTo(cx - d4 * cellSize, cy + d4 * cellSize);
                }
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は自分の石と同じ斜線上にある交点のみ。',
            '最初の1手はどこにでも置ける。角行のように斜めに盤を制する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        board[4 * BOARD_SIZE + 4] = 1; // (4,4)に黒
        assert('斜線上(近)は置ける', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
        assert('斜線上(遠)は置ける', isValidPlacement([{ x: 1, y: 7 }], 1) === true);
        assert('斜線外は置けない', isValidPlacement([{ x: 6, y: 5 }], 1) === false);
        assert('直交点は置けない', isValidPlacement([{ x: 4, y: 0 }], 1) === false);
        board.fill(0);
        assert('初手はどこでも置ける', isValidPlacement([{ x: 0, y: 4 }], 2) === true);
    `,
};
