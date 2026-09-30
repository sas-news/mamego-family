// FISSUREGO — 断裂碁: 取られた連の亀裂が走り、取跡に接する敵連は直線状に2石まで裂ける
const K = require('../gen_kit.js');
module.exports = {
    file: 'fissurego.html',
    en: 'FISSUREGO',
    jp: '断裂碁',
    prefix: 'fissurego',
    desc: '取られた連の亀裂が走る。取跡に接する敵連は直線状に2石まで裂ける。',
    kind: 'stone',
    spec: [
        ...K.rb('FISSUREGO', '断裂碁', 'fissurego'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 断裂: 取跡から亀裂が走り、接する敵石とその先の石が裂ける
                const cracked = new Set();
                captured.forEach(ci => {
                    const cx = ci % BOARD_SIZE, cy = Math.floor(ci / BOARD_SIZE);
                    getNeighbors(ci).forEach(n => {
                        if (board[n] !== player) return;
                        const nx = n % BOARD_SIZE, ny = Math.floor(n / BOARD_SIZE);
                        const dx = nx - cx, dy = ny - cy;
                        cracked.add(n);
                        const n2 = (ny + dy) * BOARD_SIZE + (nx + dx);
                        const nx2 = nx + dx, ny2 = ny + dy;
                        if (nx2 >= 0 && nx2 < BOARD_SIZE && ny2 >= 0 && ny2 < BOARD_SIZE
                            && board[n2] === player) cracked.add(n2);
                    });
                });
                if (cracked.size > 0) {
                    cracked.forEach(i => { board[i] = 0; });
                    captures[opponent] += cracked.size;
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵連を取ると亀裂が走る: 取跡に接する敵石と、その直線上の次の石まで裂けて消える。',
            '連の内側への侵入ほど亀裂が深く走る。薄い連は一撃で両断される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[5 * BOARD_SIZE + 5] = 2;
        // 黒: 左2連 (4,5)(3,5) + 上2連 (5,4)(5,3) + 下単石 (5,6)、残り呼吸点 (6,5)
        board[5 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 3] = 1;
        board[4 * BOARD_SIZE + 5] = 1; board[3 * BOARD_SIZE + 5] = 1;
        board[6 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 6, y: 5 }] }, 1);
        assert('白石が取れる', captures[1] === 1 && board[5 * BOARD_SIZE + 5] === 0);
        assert('亀裂で接した石が裂ける', board[5 * BOARD_SIZE + 4] === 0 && board[4 * BOARD_SIZE + 5] === 0);
        assert('亀裂は直線の先まで走る', board[5 * BOARD_SIZE + 3] === 0 && board[3 * BOARD_SIZE + 5] === 0);
        assert('着手石も裂ける', board[6 * BOARD_SIZE + 5] === 0 && board[5 * BOARD_SIZE + 6] === 0);
        assert('裂けた分は被害側の取り', captures[2] === 6);
    `,
};
