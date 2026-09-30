// RHYTHMGO — 拍子碁: 4拍子周期。4拍目 (強拍) の手を打ったプレイヤーはもう1石置ける
const K = require('../gen_kit.js');

const PERSIST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];

module.exports = {
    file: 'rhythmgo.html',
    en: 'RHYTHMGO',
    jp: '拍子碁',
    prefix: 'rhythmgo',
    desc: '4拍子周期: 4拍目の手は強拍 — そのプレイヤーは続けてもう1石置ける。',
    kind: 'rush',
    icon: 'rhythmgo',
    spec: [
        ...K.rb('RHYTHMGO', '拍子碁', 'rhythmgo'),
        ...PERSIST('{ extra: false }'),
        // 強拍 (4手ごと) の着手者は追加でもう1石置ける
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 拍子: 4の倍数手は強拍。強拍の着手者は手番を維持してもう1石置ける
            if (history.length % 4 === 0 && !st.extra) {
                st.extra = true;
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '強拍!', '#fb923c', 1000);
                fxShake(3, 200);
            } else {
                st.extra = false;
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = st.extra ? player : opponent;`],
        ...K.EVENT_CHIP_SPEC(`'拍 ' + ((history.length % 4) + 1) + '/4' + (history.length % 4 === 3 ? ' (次=強拍)' : '')`),
        [K.ONE, K.RV_ALGO, K.rv([
            '4拍子周期: 4手ごとの強拍の着手者は、続けてもう1石置ける (合計2石)。',
            '強拍の巡りは盤の手数で決まり両者共通。強拍に合わせて攻めを組み立てよう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.extra = false;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1);
        assert('3手目後は白番', turn === 2);
        executeMove({ cells: [{ x: 3, y: 0 }] }, 2);
        assert('4手目は強拍で白が続行', turn === 2);
        executeMove({ cells: [{ x: 4, y: 0 }] }, 2);
        assert('強拍の追加分の後は黒番', turn === 1);
        assert('盤に5石', board.filter(v => v === 1 || v === 2).length === 5);
    `,
};
