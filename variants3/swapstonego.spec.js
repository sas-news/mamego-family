// SWAPSTONEGO — 交替石碁: 各石は置いてから5手ごとに色が反転する
const K = require('../gen_kit.js');

// 永続化: st を undo/セーブ/オンラインに登録する spec 群
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
    file: 'swapstonego.html',
    en: 'SWAPSTONEGO',
    jp: '交替石碁',
    prefix: 'swapstonego',
    desc: '石は置いてから5手ごとに色が反転。味方が敵に化ける。',
    kind: 'stone',
    icon: 'swapstonego',
    spec: [
        ...K.rb('SWAPSTONEGO', '交替石碁', 'swapstonego'),
        ...PERSIST('{ birth: {} }'),
        // 置いた手数を記録 (反転タイマー)
        [K.ONE, K.PIECES_PUSH, `            move.cells.forEach(p => { st.birth[p.y * BOARD_SIZE + p.x] = history.length; });
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 交替石: 置いてからちょうど5手ごとに色が反転する
            for (let i = 0; i < board.length; i++) {
                if ((board[i] === 1 || board[i] === 2) && st.birth[i] != null) {
                    const age = history.length - st.birth[i];
                    if (age > 0 && age % 5 === 0) {
                        board[i] = board[i] === 1 ? 2 : 1;
                        fxGlow(i, '#f0abfc', 550);
                    }
                }
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 反転カウント: 各石の年齢を小さな点で表示 (5に近いほど点灯)
            for (let i = 0; i < board.length; i++) {
                if ((board[i] !== 1 && board[i] !== 2) || !st.birth || st.birth[i] == null) continue;
                const age = history.length - st.birth[i];
                const rem = 5 - (age % 5);
                if (rem > 2) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                ctx.save();
                ctx.fillStyle = rem === 1 ? 'rgba(240,171,252,0.9)' : 'rgba(240,171,252,0.4)';
                ctx.beginPath();
                ctx.arc(padding + x * cellSize + cellSize * 0.24, padding + y * cellSize - cellSize * 0.24, cellSize * 0.09, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '交替石: 置いてからちょうど5手ごとに、その石の色が反転する (何度でも)。',
            '育てた連が敵色に化けたり、敵の連が味方に化けたりする。隅の点が次の反転タイミング。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.birth = {};
        executeMove({ cells: [{ x: 0, y: 8 }] }, 1);
        assert('黒が置かれる', board[I(0, 8)] === 1);
        for (let k = 0; k < 5; k++) {
            executeMove({ cells: [{ x: 8 - k, y: 0 }] }, k % 2 === 0 ? 2 : 1);
        }
        assert('5手後に石が白に反転', board[I(0, 8)] === 2);
        for (let k = 0; k < 5; k++) {
            executeMove({ cells: [{ x: k, y: 3 }] }, k % 2 === 0 ? 1 : 2);
        }
        assert('さらに5手後に黒へ戻る', board[I(0, 8)] === 1);
    `,
};
