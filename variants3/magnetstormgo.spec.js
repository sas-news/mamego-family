// MAGNETSTORMGO — 磁暴碁: 10手ごとの磁暴で各石の極性が50%でランダム反転
const K = require('../gen_kit.js');
module.exports = {
    file: 'magnetstormgo.html',
    en: 'MAGNETSTORMGO',
    jp: '磁暴碁',
    prefix: 'magnetstormgo',
    desc: '10手ごとの磁暴で、各石の極性が50%の確率でランダム反転する。',
    kind: 'weather',
    icon: 'magnetstormgo',
    spec: [
        ...K.rb('MAGNETSTORMGO', '磁暴碁', 'magnetstormgo'),
        K.params([
            { key: 'storm_interval', label: '磁暴の間隔', min: 4, max: 40, def: 10, hint: 'この手数ごとに磁暴が来る' },
            { key: 'flip_prob', label: '反転確率', min: 0.1, max: 1, def: 0.5, step: 0.05, hint: '各石が極性反転する確率' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 1.1, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 磁暴: 10手ごとに全ての石が50%の確率で極性反転 (両者共通)
            if (history.length % Math.max(1, P('storm_interval') || 10) === 0) {
                let flips = 0;
                for (let i = 0; i < board.length; i++) {
                    if ((board[i] === 1 || board[i] === 2) && Math.random() < (P('flip_prob') ?? 0.5)) {
                        board[i] = board[i] === 1 ? 2 : 1;
                        flips++;
                        fxGlow(i, '#c084fc', 500);
                    }
                }
                fxShake(5, 320);
                const ci2 = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
                fxText(ci2, '磁暴! ' + flips + '個反転', '#c084fc', 1200);
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'磁暴まで ' + (Math.max(1, P('storm_interval') || 10) - (history.length % Math.max(1, P('storm_interval') || 10))) + '手'`),
        [K.ONE, K.RV_BASE, K.rv([
            '磁暴は10手ごとに訪れ、盤上の各石が50%の確率で極性 (色) をランダム反転する。',
            '形勢は磁暴で一変する。反転は完全にランダムで両者同条件 — 残った連の形を活かそう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        for (let k = 0; k < 10; k++) {
            executeMove({ cells: [{ x: BOARD_SIZE - 1 - (k % 4), y: k }] }, k % 2 === 0 ? 1 : 2);
        }
        // 磁暴後も盤上の石は全て有効な色 (反転しても1か2)
        assert('磁暴後も石は正しい色', board.every(v => v === 0 || v === 1 || v === 2));
        assert('石の総数は変わらない', board.filter(v => v === 1 || v === 2).length === 10);
        assert('起動して着手可', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
