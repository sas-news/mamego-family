// PENDULUMGO — 振子碁: 手番が振り子式 1,2,2,1,1,2,2,1… の繰り返し
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
    file: 'pendulumgo.html',
    en: 'PENDULUMGO',
    jp: '振子碁',
    prefix: 'pendulumgo',
    desc: '手番は振り子式: 黒,白,白,黒,黒,白,白,黒… の繰り返し。',
    kind: 'stone',
    icon: 'pendulumgo',
    spec: [
        ...K.rb('PENDULUMGO', '振子碁', 'pendulumgo'),
        ...PERSIST('{ ply: 0 }'),
        // 着手後の手番は振り子パターンで決まる (交互ではない)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 振子手番: 1,2,2,1,1,2,2,1… の繰り返し (2連続番が交互に巡る)
            st.ply++;
            turn = [1, 2, 2, 1][st.ply % 4];

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }`],
        // パスも1振れとして振子を進める
        [K.ONE, `                turn = turn === 1 ? 2 : 1;`, `                st.ply++;
                turn = [1, 2, 2, 1][st.ply % 4];`],
        ...K.EVENT_CHIP_SPEC(`'振子 ' + (st.ply % 4 + 1) + '/4'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '手番は交互ではなく振り子式: 黒,白,白,黒,黒,白,白,黒… の繰り返し。',
            '各プレイヤーに2連続番が交互に巡る。連番を活かして取り切りや陣地固めを狙う。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.ply = 0;
        const seq = [];
        for (let k = 0; k < 4; k++) {
            executeMove({ cells: [{ x: k, y: 0 }] }, turn);
            seq.push(turn);
        }
        assert('振子は 2,2,1,1 と遷移', seq.join(',') === '2,2,1,1');
        for (let k = 0; k < 4; k++) {
            executeMove({ cells: [{ x: k, y: 1 }] }, turn);
            seq.push(turn);
        }
        assert('4手周期で繰り返す', seq.join(',') === '2,2,1,1,2,2,1,1');
        assert('起動して着手可', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
