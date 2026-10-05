// KNIGHTGO — 桂馬碁: 自石から桂馬飛び (1x2) の点にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'knightgo.html',
    en: 'KNIGHTGO',
    jp: '桂馬碁',
    prefix: 'knightgo',
    desc: '着手は自石から桂馬飛びの点のみ。駒が跳ねるように石が盤を飛ぶ。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'knight',
    spec: [
        ...K.rb('KNIGHTGO', '桂馬碁', 'knightgo'),
        K.params([
            { key: 'jump_a', label: '跳びの短辺', min: 0, max: 4, def: 1 },
            { key: 'jump_b', label: '跳びの長辺', min: 1, max: 5, def: 2, hint: '桂馬は1×2' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, `        function executeMove(move, player) {`,
`        let knightCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (knightCapFired && history.length === 0) knightCapFired = false;
            if (!knightCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                knightCapFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 桂馬碁ルール: 自石から桂馬飛び (縦横1:2) の点にのみ着手可 (初手は自由)
            {
                let hasOwn = false, canJump = false;
                const ja = Math.max(0, P('jump_a') ?? 1), jb = Math.max(1, P('jump_b') || 2);
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    hasOwn = true;
                    const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                    for (const p of cells) {
                        const dx = Math.abs(p.x - sx), dy = Math.abs(p.y - sy);
                        if ((dx === ja && dy === jb) || (dx === jb && dy === ja)) canJump = true;
                    }
                    if (canJump) break;
                }
                if (hasOwn && !canJump) return false;
            }`],
        // 桂馬の跳躍: 跳び元の自石から着手点へ残像スライド
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (lastMove && lastMove.cells[0]) {
                const dp = lastMove.cells[0];
                const didx = dp.y * BOARD_SIZE + dp.x;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player || i === didx) continue;
                    const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                    const dx = Math.abs(dp.x - sx), dy = Math.abs(dp.y - sy);
                    if ((dx === (P('jump_a') ?? 1) && dy === (P('jump_b') || 2)) || (dx === (P('jump_b') || 2) && dy === (P('jump_a') ?? 1))) {
                        fxSlide(i, didx, 380);
                        fxText(didx, '跳!', '#a78bfa', 800);
                        break;
                    }
                }
            }

            turn = opponent;`],
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_BASE, K.rv([
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
