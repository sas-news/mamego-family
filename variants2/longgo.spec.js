// LONGGO — 長跳碁: 最近の自石から距離3以上に跳ぶ
const K = require('../gen_kit.js');
module.exports = {
    file: 'longgo.html',
    en: 'LONGGO',
    jp: '長跳碁',
    prefix: 'longgo',
    desc: '着手は直近の自石から3マス以上離れた点のみ。石は跳躍する。',
    kind: 'jump',
    spec: [
        ...K.rb('LONGGO', '長跳碁', 'longgo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 長跳碁ルール: 自分の直前の着手からチェビシェフ距離3以上の点のみ (初手は自由)
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
                        if (d < 3) return false;
                    }
                }
            }`],
        ...K.LEGAL_DOTS_SPEC,
        // 跳躍の軌跡: 前の自石から今の着地点へ石が跳ぶ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            {
                let anchor = null;
                for (let i = history.length - 1; i >= 0; i--) {
                    const lm = history[i].lastMove;
                    if (lm && lm.player === player) { anchor = lm.cells[0]; break; }
                }
                if (anchor && lastMove && lastMove.cells.length > 0) {
                    const d = Math.max(Math.abs(lastMove.cells[0].x - anchor.x), Math.abs(lastMove.cells[0].y - anchor.y));
                    if (d >= 3) {
                        fxSlide(anchor.y * BOARD_SIZE + anchor.x, lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x, 420); // 長跳の軌跡
                    }
                }
            }

            turn = opponent;`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は自分の直前の着手から3マス以上離れた点のみ (初手は自由)。',
            '自分の石は次々と長く跳んでいく。近場の攻防は他の石頼みになる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        pieces.length = 0;
        history.length = 0;
        lastMove = null;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        // 黒の前の手は(4,4): 距離3以上のみ
        assert('距離3は跳べる', isValidPlacement([{ x: 7, y: 4 }], 1) === true);
        assert('距離4斜めは跳べる', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
        assert('距離2は近すぎ', isValidPlacement([{ x: 6, y: 6 }], 1) === false);
        assert('隣接は不可', isValidPlacement([{ x: 5, y: 4 }], 1) === false);
        assert('白の前の手(0,0)基準', isValidPlacement([{ x: 3, y: 2 }], 2) === true);
    `,
};
