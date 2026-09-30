// KNIGHTGO — 桂馬碁: 自石から桂馬飛び (1x2) の点にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'knightgo.html',
    en: 'KNIGHTGO',
    jp: '桂馬碁',
    prefix: 'knightgo',
    desc: '着手は自石から桂馬飛びの点のみ。駒が跳ねるように石が盤を飛ぶ。',
    kind: 'knight',
    spec: [
        ...K.rb('KNIGHTGO', '桂馬碁', 'knightgo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 桂馬碁ルール: 自石から桂馬飛び (縦横1:2) の点にのみ着手可 (初手は自由)
            {
                let hasOwn = false, canJump = false;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    hasOwn = true;
                    const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                    for (const p of cells) {
                        const dx = Math.abs(p.x - sx), dy = Math.abs(p.y - sy);
                        if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) canJump = true;
                    }
                    if (canJump) break;
                }
                if (hasOwn && !canJump) return false;
            }`],
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は自分の石から将棋の桂馬の動き (縦横1:2) で跳んだ点のみ。',
            '最初の1手はどこにでも置ける。石は桂馬のように跳んで盤を渡る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        board[4 * BOARD_SIZE + 4] = 1; // (4,4)に黒
        assert('桂馬飛び(2,1)は置ける', isValidPlacement([{ x: 6, y: 5 }], 1) === true);
        assert('桂馬飛び(1,2)は置ける', isValidPlacement([{ x: 5, y: 6 }], 1) === true);
        assert('斜め隣は置けない', isValidPlacement([{ x: 5, y: 5 }], 1) === false);
        assert('遠い点は置けない', isValidPlacement([{ x: 7, y: 7 }], 1) === false);
        board.fill(0);
        assert('初手はどこでも置ける', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
