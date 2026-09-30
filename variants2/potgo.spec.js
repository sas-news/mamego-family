// POTGO — 壺碁: 取った石は共有の「壺」に溜まり、3個以上の大取で壺ごと奪える
const K = require('../gen_kit.js');
module.exports = {
    file: 'potgo.html',
    en: 'POTGO',
    jp: '壺碁',
    prefix: 'potgo',
    desc: 'アゲハマは壺に蓄積。3個以上の大取をした者が壺の中身を総取りする。',
    kind: 'pot',
    spec: [
        ...K.rb('POTGO', '壺碁', 'potgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let pot = 0; // 壺に蓄積された石 (誰のものでもない)`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            pot = 0;`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                pot
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.pot !== undefined) pot = snap.pot;`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    pot,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (s.pot !== undefined) pot = s.pot;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                pot,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (data.pot !== undefined) pot = data.pot;`],
        // 捕捕獲は壺へ。3個以上取った手番は壺の中身も総取り
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                // 壺ルール: 3個以上の大取なら壺ごと奪う、それ未満は壺に蓄積
                if (captured.length >= 3) {
                    captures[player] += captured.length + pot;
                    pot = 0;
                } else {
                    pot += captured.length;
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        ...K.EVENT_CHIP_SPEC(`'壺:' + pot`),
        [K.ONE, K.RV_ALGO, K.rv([
            '取った石は自分のアゲハマではなく共有の「壺」に溜まる。',
            '1手で3個以上を取った (大取) 側が壺の中身を全て奪う。壺を狙って大きく刈れ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        // 白2連を囲んで小取 → 壺に入る (白=(1,1)(2,1), 残り呼吸点は(3,1)のみ)
        board[1 * BOARD_SIZE + 1] = 2; board[1 * BOARD_SIZE + 2] = 2;
        board[1 * BOARD_SIZE + 0] = 1;
        board[0 * BOARD_SIZE + 1] = 1; board[0 * BOARD_SIZE + 2] = 1;
        board[2 * BOARD_SIZE + 1] = 1; board[2 * BOARD_SIZE + 2] = 1;
        executeMove({ cells: [{ x: 3, y: 1 }] }, 1);
        assert('小取は壺に蓄積', pot === 2);
        assert('小取はアゲハマにならない', captures[1] === 0);
        // 大取: 白3連(列x=1, y=0..2)を囲む
        board.fill(0); pot = 5;
        board[0 * BOARD_SIZE + 1] = 2; board[1 * BOARD_SIZE + 1] = 2; board[2 * BOARD_SIZE + 1] = 2;
        board[0 * BOARD_SIZE + 0] = 1; board[1 * BOARD_SIZE + 0] = 1; board[2 * BOARD_SIZE + 0] = 1;
        board[3 * BOARD_SIZE + 1] = 1; board[0 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 2] = 1;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1);
        assert('大取で壺ごと獲得', captures[1] === 8 && pot === 0);
    `,
};
