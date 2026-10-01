// SPONGEGO — 海綿碁: 取るとスポンジのように息を吸い、直後にもう1手打てる
const K = require('../gen_kit.js');
module.exports = {
    file: 'spongego.html',
    en: 'SPONGEGO',
    jp: '海綿碁',
    prefix: 'spongego',
    desc: '敵連を取ると即座にもう1手打てる。連取りで連打が止まらない。',
    kind: 'stone',
    spec: [
        ...K.rb('SPONGEGO', '海綿碁', 'spongego'),
        K.params([
            { key: 'bonus_moves', label: '追打ち権の回数', min: 1, max: 3, def: 1, unit: '手' },
        ]),
        // 追打ち権 spongeBonus[player] の状態登録
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let spongeBonus = { 1: 0, 2: 0 }; // 取りで得た追打ち権`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            spongeBonus = { 1: 0, 2: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                spongeBonus: { ...spongeBonus },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            spongeBonus = snap.spongeBonus ? { ...snap.spongeBonus } : { 1: 0, 2: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    spongeBonus,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            spongeBonus = (s.spongeBonus && typeof s.spongeBonus === 'object') ? { ...s.spongeBonus } : { 1: 0, 2: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                spongeBonus,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            spongeBonus = (data.spongeBonus && typeof data.spongeBonus === 'object') ? { ...data.spongeBonus } : { 1: 0, 2: 0 };`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                spongeBonus[player] = Math.max(1, P('bonus_moves') || 1); // 海綿: 取ったら追打ち権
                captured.forEach(idx => fxGlow(idx, '#2dd4bf', 550));
                fxText(captured[0], 'もう1手!', '#5eead4', 1000);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 海綿: 追打ち権があれば手番を維持してもう1手
            if (spongeBonus[player] > 0) {
                spongeBonus[player]--;
                turn = player;
            } else {
    
            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;
            }`],
        ...K.EVENT_CHIP_SPEC(`spongeBonus[turn] > 0 ? '追打ち!' : ''`),
        [K.ONE, K.RV_ALGO, K.rv([
            '敵連を取るとスポンジのように息を吸い、そのままもう1手打てる。',
            '追打ちでさらに取れば連打が続く。取る局面が一気に優勢になる。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0; spongeBonus = { 1: 0, 2: 0 }; turn = 1;
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('白石が取れる', captures[1] === 1);
        assert('取ると手番を維持', turn === 1);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // 追打ち
        assert('追打ち後は手番交代', turn === 2);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('取りなしなら通常交代', turn === 1);
    `,
};
