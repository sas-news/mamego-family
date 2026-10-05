// ECHOGO — 残響碁: 自分の直前の着手の近傍にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'echogo.html',
    en: 'ECHOGO',
    jp: '残響碁',
    prefix: 'echogo',
    desc: '着手は自分の前の一手の周囲2マス以内。残響が連なって陣地になる。',
    kind: 'echo',
    spec: [
        ...K.rb('ECHOGO', '残響碁', 'echogo'),
        K.params([
            { key: 'echo_range', label: '残響の範囲', min: 1, max: 5, def: 2, unit: 'マス' },
        ]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 残響碁ルール: 自分の直前の着手からチェビシェフ距離2以内のみ着手可 (初手は自由)
            {
                let anchor = null;
                if (lastMove && lastMove.player === player) anchor = lastMove.cells[0];
                if (!anchor) {
                    for (let i = history.length - 1; i >= 0; i--) {
                        const lm = history[i].lastMove;
                        if (lm && lm.player === player) { anchor = lm.cells[0]; break; }
                    }
                }
                if (anchor) {
                    for (const p of cells) {
                        const d = Math.max(Math.abs(p.x - anchor.x), Math.abs(p.y - anchor.y));
                        if (d > (P('echo_range') || 2)) return false;
                    }
                }
            }`],
        K.CUE_GRID(`            // 残響: 自分の前の一手の周囲2マスを薄く照らす
            {
                let anc = null;
                if (lastMove && lastMove.player === turn) anc = lastMove.cells[0];
                if (!anc) {
                    for (let i = history.length - 1; i >= 0; i--) {
                        const lm = history[i].lastMove;
                        if (lm && lm.player === turn) { anc = lm.cells[0]; break; }
                    }
                }
                if (anc) {
                    ctx.save();
                    ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.12);
                    const _er = P('echo_range') || 2;
                    ctx.fillRect(padding + (anc.x - _er - 0.5) * cellSize, padding + (anc.y - _er - 0.5) * cellSize,
                        cellSize * (_er * 2 + 1), cellSize * (_er * 2 + 1));
                    ctx.restore();
                }
            }`),
        ...K.LEGAL_DOTS_SPEC,
        // 残響: アンカーから広がる共鳴リングを常時描画
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            let anc = null;
            if (lastMove && lastMove.player === turn) anc = lastMove.cells[0];
            if (!anc) {
                for (let i = history.length - 1; i >= 0; i--) {
                    const lm = history[i].lastMove;
                    if (lm && lm.player === turn) { anc = lm.cells[0]; break; }
                }
            }
            if (!anc) return;
            const cx = pad + anc.x * cs, cy = pad + anc.y * cs;
            ctx2.save();
            for (let k = 0; k < 3; k++) {
                const ph = ((now / 1400) + k / 3) % 1;
                ctx2.globalAlpha = (1 - ph) * 0.35;
                ctx2.strokeStyle = '#7dd3fc';
                ctx2.lineWidth = Math.max(1, cs * 0.05);
                ctx2.beginPath();
                ctx2.arc(cx, cy, cs * (0.5 + ph * 2.2), 0, Math.PI * 2);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手は自分が直前に打った石の周囲2マス以内のみ (初手は自由)。',
            '自分の石の残響が連なっていく。離れた場所を攻めるにはまず残残響を繋げること。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        pieces.length = 0;
        history.length = 0;
        lastMove = null;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        // 黒番: 黒の前の一手は(4,4)
        assert('前の手の近傍(2以内)は置ける', isValidPlacement([{ x: 5, y: 6 }], 1) === true);
        assert('距離3は残響外', isValidPlacement([{ x: 7, y: 7 }], 1) === false);
        assert('白の前の手(8,8)近傍は白のみ', isValidPlacement([{ x: 7, y: 6 }], 2) === true);
        assert('白は(4,4)近傍に置けない', isValidPlacement([{ x: 5, y: 5 }], 2) === false);
    `,
};
