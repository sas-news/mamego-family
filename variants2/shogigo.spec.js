// SHOGIGO — 将棋碁: アゲハマは持ち駒。敵石の上に打ち込んで自分の石にする
const K = require('../gen_kit.js');
module.exports = {
    file: 'shogigo.html',
    en: 'SHOGIGO',
    jp: '将棋碁',
    prefix: 'shogigo',
    desc: '取った石は持ち駒。1個消費して敵石に打ち込み、自分の石に変える。',
    kind: 'stone',
    spec: [
        ...K.rb('SHOGIGO', '将棋碁', 'shogigo'),
        K.params([
            { key: 'uchikomi_cost', label: '打ち込みの持ち駒コスト', min: 1, max: 4, def: 1, unit: '個' },
        ]),
        // 持ち駒があれば敵石の上に打ち込める
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                const pv = board[p.y * BOARD_SIZE + p.x];
                // 将棋碁: 持ち駒 (アゲハマ) があれば敵石の上に打ち込める
                if (pv !== 0 && !(pv === (player === 1 ? 2 : 1) && captures[player] >= (P('uchikomi_cost') || 1))) return false;
            }`],
        // 打ち込みは持ち駒を消費
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => {
                const bi = p.y * BOARD_SIZE + p.x;
                if (board[bi] !== 0) {
                    captures[player] -= (P('uchikomi_cost') || 1); // 打ち込みは持ち駒を消費
                    // 打ち込み: 駒台から駒が叩き込まれる閃き
                    fxGlow(bi, '#fbbf24', 900);
                    fxBurst(bi, '#fbbf24', 8, 1.3);
                    fxText(bi, '打込!', '#fbbf24', 1100);
                }
                board[bi] = player;
            });`],
        [K.ONE, K.INFO_BASE, `            将棋碁: アゲハマは持ち駒。敵石の上に打ち込んで自分の石に変える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '取った敵石はアゲハマ欄 = 持ち駒。持ち駒が1個以上あれば、空点の代わりに敵石の上へ打ち込める。',
            '打ち込みは持ち駒を1個消費し、そのマスの敵石を自分の石に変える (自殺手になる場所は不可)。',
            '取って打ち込み、打ち込んで取る — 将棋のように駒が盤を巡る持続戦。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 駒台: 残り持ち駒数を常時チップで示す
        ...K.EVENT_CHIP_SPEC('captures[turn] > 0 ? "持ち駒 " + captures[turn] : ""'),
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[5] = 2;
        assert('持ち駒なしでは打ち込めない', isValidPlacement([{ x: 5, y: 0 }], 1) === false);
        captures[1] = 1;
        assert('持ち駒で敵石に打ち込める', isValidPlacement([{ x: 5, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 5, y: 0 }] }, 1);
        assert('敵石は自石になる', board[5] === 1);
        assert('持ち駒は消費される', captures[1] === 0);
    `,
};
