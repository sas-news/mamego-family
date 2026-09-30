// BILLIARDGO — 撞球碁: 隣接する敵石を撞き、滑らせて盤外に出せば得点
const K = require('../gen_kit.js');
module.exports = {
    file: 'billiardgo.html',
    en: 'BILLIARDGO',
    jp: '撞球碁',
    prefix: 'billiardgo',
    desc: '打った石の隣の敵石を撞き飛ばす。他石の手前で止まり、盤外に出れば得点。',
    kind: 'stone',
    spec: [
        ...K.rb('BILLIARDGO', '撞球碁', 'billiardgo'),
        // 撞球処理を通常捕獲の前に挿入
        [K.ONE, K.CAPTURE_BLOCK, `            // 撞球碁: 打った石に隣接する敵石をその方向へ撞き飛ばす
            move.cells.forEach(p => {
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                    const ax = p.x + dx, ay = p.y + dy;
                    if (ax < 0 || ax >= BOARD_SIZE || ay < 0 || ay >= BOARD_SIZE) return;
                    const ai = ay * BOARD_SIZE + ax;
                    if (board[ai] !== opponent) return;
                    // 空きマスが続く限り滑り、盤外に出ればアゲハマ
                    let tx = ax, ty = ay;
                    while (true) {
                        const qx = tx + dx, qy = ty + dy;
                        if (qx < 0 || qx >= BOARD_SIZE || qy < 0 || qy >= BOARD_SIZE) {
                            board[ai] = 0;
                            captures[player]++;
                            return;
                        }
                        if (board[qy * BOARD_SIZE + qx] !== 0) break;
                        tx = qx; ty = qy;
                    }
                    if (tx !== ax || ty !== ay) {
                        board[ty * BOARD_SIZE + tx] = opponent;
                        board[ai] = 0;
                        cleanUpPieces();
                    }
                });
            });

            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.INFO_ALGO, `            撞球碁: 隣の敵石を撞き飛ばし、盤外に出せばアゲハマ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '打った石に隣接する敵石は、その方向へ空きマスの続く限り滑っていく。',
            '滑った石は他の石の手前で止まる。盤外に撞き出せばアゲハマ得点になる。',
            '敵石の隣に寄せる一手がそのまま撞き手になる — 玉突きのように連鎖させよう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[5 * BOARD_SIZE + 5] = 2;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('盤外へ撞き出せば得点', board[5 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[5 * BOARD_SIZE + 5] = 2; board[5 * BOARD_SIZE + 8] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('他石の手前で止まる', board[5 * BOARD_SIZE + 7] === 2 && board[5 * BOARD_SIZE + 5] === 0);
        board.fill(0); pieces = [];
        board[5 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('味方は撞かない', board[5 * BOARD_SIZE + 5] === 1);
    `,
};
