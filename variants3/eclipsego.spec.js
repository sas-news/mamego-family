// ECLIPSEGO — 日食碁: 12手ごとの日食で全石の色が反転し、アゲハマも入れ替わる
const K = require('../gen_kit.js');
module.exports = {
    file: 'eclipsego.html',
    en: 'ECLIPSEGO',
    jp: '日食碁',
    prefix: 'eclipsego',
    desc: '12手ごとの日食: 全石の色が反転しアゲハマも入れ替わる。',
    kind: 'weather',
    icon: 'eclipsego',
    spec: [
        ...K.rb('ECLIPSEGO', '日食碁', 'eclipsego'),
        K.params([
            { key: 'eclipse_interval', label: '日食の間隔', min: 3, max: 48, def: 12, unit: '手' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 4, def: 1.1, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 日食: 12手ごとに全石の色が反転し、アゲハマ数も交換される (両者共通)
            if (history.length % Math.max(1, P('eclipse_interval') || 12) === 0) {
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 1) board[i] = 2;
                    else if (board[i] === 2) board[i] = 1;
                }
                const ct = captures[1];
                captures[1] = captures[2];
                captures[2] = ct;
                fxShake(6, 380);
                const ci2 = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
                fxText(ci2, '日食!', '#f97316', 1300);
                fxGlow(ci2, '#f97316', 900);
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'日食まで ' + ((P('eclipse_interval') || 12) - (history.length % (P('eclipse_interval') || 12))) + '手'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '日食は12手ごとに訪れる: 盤上の全石の色が反転し、双方のアゲハマも入れ替わる。',
            '攻めの絶頂で色が入れ替わる。日食のカウントは両プレイヤー共通。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[0] = 1; board[1] = 2;
        captures[1] = 3; captures[2] = 7;
        for (let k = 0; k < 12; k++) {
            executeMove({ cells: [{ x: BOARD_SIZE - 1, y: k }] }, k % 2 === 0 ? 1 : 2);
        }
        assert('日食で全石が反転', board[0] === 2 && board[1] === 1);
        assert('アゲハマも入れ替わる', captures[1] === 7 && captures[2] === 3);
        assert('起動して着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
