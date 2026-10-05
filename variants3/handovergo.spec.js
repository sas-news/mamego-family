// HANDOVERGO — 引継碁: 10手ごとに盤面の色がそのまま反転して続行
const K = require('../gen_kit.js');
module.exports = {
    file: 'handovergo.html',
    en: 'HANDOVERGO',
    jp: '引継碁',
    prefix: 'handovergo',
    desc: '10手ごとに盤面の石色が総入替。築いた陣地は相手に引き継がれる。',
    kind: 'stone',
    icon: 'handovergo',
    spec: [
        ...K.rb('HANDOVERGO', '引継碁', 'handovergo'),
        K.params([
            { key: 'flip_interval', label: '引継の間隔', min: 4, max: 30, def: 10, step: 2, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.5, max: 2, def: 1.1, step: 0.05 },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 引継: 10手ごとに盤面の全石の色が反転する (周期は両者共通)
            if (history.length % Math.max(1, P('flip_interval') || 10) === 0) {
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 1) board[i] = 2;
                    else if (board[i] === 2) board[i] = 1;
                }
                fxShake(5, 320);
                const hc = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
                fxText(hc, '引継!', '#a78bfa', 1200);
                fxGlow(hc, '#a78bfa', 800);
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'引継まで ' + (Math.max(1, P('flip_interval') || 10) - (history.length % Math.max(1, P('flip_interval') || 10))) + '手'`),
        [K.ONE, K.RV_BASE, K.rv([
            '引継: 10手ごとに盤面の全ての石の色が反転する (黒⇔白の総入替)。',
            '築いた地は相手に引き継がれる。反転のタイミングを読んで石を配置しよう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[0] = 1; board[1] = 2;
        // 10手分の着手 (盤の右端の列を使う)
        for (let k = 0; k < 10; k++) {
            executeMove({ cells: [{ x: BOARD_SIZE - 1, y: k }] }, k % 2 === 0 ? 1 : 2);
        }
        assert('10手目で全石が反転', board[0] === 2 && board[1] === 1);
        assert('置いた石も反転済み', board[BOARD_SIZE - 1] === 2);
        assert('起動して着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
