// MAGEGO — 魔導碁: 着手毎に魔力が溜まり、5で火球が炸裂して敵石を焼く。
const K = require('../gen_kit.js');
module.exports = {
    file: 'magego.html',
    en: 'MAGEGO',
    jp: '魔導碁',
    prefix: 'magego',
    desc: '着手毎に魔力が溜まり、5で火球が炸裂して敵石を焼く。',
    kind: 'stone',
    spec: [
        ...K.rb('MAGEGO', '魔導碁', 'magego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let mpMap = { 1: 0, 2: 0 }; // 各プレイヤーの魔力 (着手毎に+1、5で呪文発動)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            mpMap = { 1: 0, 2: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                mpMap: { ...mpMap },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            mpMap = snap.mpMap ? { ...snap.mpMap } : { 1: 0, 2: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    mpMap,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            mpMap = (s.mpMap && typeof s.mpMap === 'object') ? { ...s.mpMap } : { 1: 0, 2: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                mpMap,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            mpMap = (data.mpMap && typeof data.mpMap === 'object') ? { ...data.mpMap } : { 1: 0, 2: 0 };`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }

            // 魔導: 着手毎にMP+1。5に達すると着地点中心の敵石を焼き払う
            mpMap[player] = (mpMap[player] || 0) + 1;
            if (mpMap[player] >= 5) {
                mpMap[player] = 0;
                const blast = new Set();
                move.cells.forEach(p => {
                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            if (Math.abs(dx) + Math.abs(dy) > 2) continue;
                            const nx = p.x + dx, ny = p.y + dy;
                            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                            blast.add(ny * BOARD_SIZE + nx);
                        }
                    }
                });
                let burned = 0;
                blast.forEach(idx => { if (board[idx] === opponent) { board[idx] = 0; burned++; } });
                if (burned > 0) {
                    captures[player] += burned;
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            }`],
        ...K.EVENT_CHIP_SPEC("'魔力 ' + (mpMap[turn] || 0) + '/5'"),
        [K.ONE, K.RV_ALGO, K.rv(['着手する毎に魔力 (MP) が1溜まる。5に達すると呪文が自動発動:','着地点からマンハッタン距離2以内の敵石を全て焼き払う (自分の石は無事)。ヘッダのチップにMP表示。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        mpMap[1] = 0;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('着手でMP1溜まる', mpMap[1] === 1);
        mpMap[1] = 4;
        board[3 * BOARD_SIZE + 3] = 2; board[8 * BOARD_SIZE + 8] = 2;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('呪文で近くの敵が焼失', board[3 * BOARD_SIZE + 3] === 0);
        assert('遠い敵は無事', board[8 * BOARD_SIZE + 8] === 2);
        assert('MP消費で0に戻る', mpMap[1] === 0);
        
    `,
};
