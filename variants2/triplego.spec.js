// TRIPLEGO — 三手碁: 1手番につき3石ずつ置く
const K = require('../gen_kit.js');
module.exports = {
    file: 'triplego.html',
    en: 'TRIPLEGO',
    jp: '三手碁',
    prefix: 'triplego',
    desc: '1手番で3石ずつ置く。3石置き切って初めて手番が相手に巡る。',
    kind: 'triple',
    spec: [
        ...K.rb('TRIPLEGO', '三手碁', 'triplego'),
        // 手番内の残り石数カウンタを追加
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
        let stonesLeftInTurn = 3; // この手番であと何石置けるか`],
        // 手番は3石置き切るまで巡らない
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 三手碁: 3石置き切るまで同一手番が続く
            stonesLeftInTurn--;
            if (stonesLeftInTurn <= 0) {
                stonesLeftInTurn = 3;
                turn = opponent;
            }`],
        // 1手戻る・永続化・オンライン同期にもカウンタを登録
        [K.ONE, K.SNAP_PUSH, `                stonesLeftInTurn,
                heldPieces: { ...heldPieces },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.stonesLeftInTurn !== undefined) stonesLeftInTurn = snap.stonesLeftInTurn;`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            stonesLeftInTurn = 3;`],
        [K.ONE, K.SAVE_TAIL, `                    stonesLeftInTurn,
                    heldPieces,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (typeof s.stonesLeftInTurn === 'number') stonesLeftInTurn = s.stonesLeftInTurn;`],
        [K.ONE, K.ONLINE_SEND, `                stonesLeftInTurn,
                heldPieces,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (typeof data.stonesLeftInTurn === 'number') stonesLeftInTurn = data.stonesLeftInTurn;`],
        // パスは残り手を放棄して交代するのでカウンタを初期化
        [K.ONE, `                turn = turn === 1 ? 2 : 1;`,
`                turn = turn === 1 ? 2 : 1;
                stonesLeftInTurn = 3; // パスは残り手を放棄して交代`],
        // 手番表示に残り石数を出す
        [K.ONE, K.TURN_LINE, `            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + ' ×残り' + stonesLeftInTurn + '石';`],
        [K.ONE, K.RV_ALGO, K.rv([
            '1手番につき3石ずつ置く。3石置き切るまで相手に手番は巡らない。',
            '取り・コウ判定は各石ごとに通常通り。パスすると残りを放棄して交代。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        pieces.length = 0;
        history.length = 0;
        lastMove = null;
        turn = 1;
        stonesLeftInTurn = 3;
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('1石目ではまだ黒番', turn === 1 && stonesLeftInTurn === 2);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('2石目でもまだ黒番', turn === 1 && stonesLeftInTurn === 1);
        executeMove({ cells: [{ x: 10, y: 10 }] }, 1);
        assert('3石置き切りで白番へ', turn === 2 && stonesLeftInTurn === 3);
        assert('盤上に黒3石', board.filter(v => v === 1).length === 3);
    `,
};
