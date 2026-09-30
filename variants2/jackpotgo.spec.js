// JACKPOTGO — 百倍碁: 連続して取るたび倍率が上がり、取り点が倍化する
const K = require('../gen_kit.js');
module.exports = {
    file: 'jackpotgo.html',
    en: 'JACKPOTGO',
    jp: '百倍碁',
    prefix: 'jackpotgo',
    desc: '取りが続くほど倍率アップ。連続キャプチャでアゲハマが何倍にもなる。',
    kind: 'jackpot',
    spec: [
        ...K.rb('JACKPOTGO', '百倍碁', 'jackpotgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let mult = { 1: 1, 2: 1 }; // 取り倍率 (連続キャプチャで+1)`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            mult = { 1: 1, 2: 1 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                mult: { ...mult }
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.mult) mult = { ...snap.mult };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    mult,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (s.mult) mult = s.mult;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                mult,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (data.mult) mult = data.mult;`],
        // 取り点 = 取った数 × 現在倍率。取ったら倍率+1、取れなければ倍率リセット
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length * mult[player]; // 倍率適用
                mult[player] = Math.min(mult[player] + 1, 9);        // 連続キャプチャで倍率上昇
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                mult[player] = 1; // 取れない手で倍率は1に戻る
                soundManager.playPlace();
            }`],
        ...K.EVENT_CHIP_SPEC(`'倍率 黒x' + mult[1] + ' 白x' + mult[2]`),
        [K.ONE, K.RV_ALGO, K.rv([
            'アゲハマは 取った石数 × 自分の倍率 で計算される。',
            '取るたびに自分の倍率が+1 (最大x9)、取れない手を打つと倍率はx1にリセット。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        // 白2連を取る (x1): captures[1]+=2 → mult[1]=2
        board[1 * BOARD_SIZE + 1] = 2; board[1 * BOARD_SIZE + 2] = 2;
        board[1 * BOARD_SIZE + 0] = 1;
        board[0 * BOARD_SIZE + 1] = 1; board[0 * BOARD_SIZE + 2] = 1;
        board[2 * BOARD_SIZE + 1] = 1; board[2 * BOARD_SIZE + 2] = 1;
        executeMove({ cells: [{ x: 3, y: 1 }] }, 1);
        assert('初回はx1で2点', captures[1] === 2);
        assert('倍率がx2に上昇', mult[1] === 2);
        // もう一度取る (x2): 白単石を取る
        board[4 * BOARD_SIZE + 5] = 2;
        board[3 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 5] = 1; board[4 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1);
        assert('2連続目はx2で+2', captures[1] === 4);
        assert('倍率x3に', mult[1] === 3);
        // 取れない手でリセット
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1);
        assert('取らなければ倍率x1', mult[1] === 1);
    `,
};
