// INVADERGO — 侵攻碁: 敵石が上端から降下し、盤面を区画していく
const K = require('../gen_kit.js');
module.exports = {
    file: 'invadergo.html',
    en: 'INVADERGO',
    jp: '侵攻碁',
    prefix: 'invadergo',
    desc: '4手ごとに敵ブロックが上端から降下。下をふさがれたら終わり。',
    kind: 'stone',
    spec: [
        ...K.rb('INVADERGO', '侵攻碁', 'invadergo'),
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白, 3:侵攻ブロック
        let moveCount = 0;`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 侵攻: ブロックが下へ落ち (下が空なら)、4手ごとに上端へ湧く
            moveCount++;
            for (let y = BOARD_SIZE - 1; y >= 0; y--) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const ii = y * BOARD_SIZE + x;
                    if (board[ii] !== 3) continue;
                    if (y + 1 < BOARD_SIZE && board[ii + BOARD_SIZE] === 0) {
                        board[ii + BOARD_SIZE] = 3;
                        board[ii] = 0;
                    }
                }
            }
            if (moveCount % 4 === 0) {
                const tops = [];
                for (let x = 0; x < BOARD_SIZE; x++) if (board[x] === 0) tops.push(x);
                if (tops.length > 0) board[tops[Math.floor(Math.random() * tops.length)]] = 3;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC('moveCount % 4 >= 2 ? "あと" + (4 - moveCount % 4) + "手で侵攻" : ""'),
        ...K.WALL_SPEC,
        [K.ONE, K.INFO_ALGO, `            侵攻碁: 上端から敵ブロックが降下し盤面を侵食していく<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '4手ごとに上端へ敵ブロック (黒い■) が出現し、毎手番に下が空いていれば1段落ちる。',
            'ブロックはどちらの色でもなく取れないが、地や呼吸を分断する障害物になる。',
            'ブロックの落下位置を読み、味方の連が窒息しないよう逃がそう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; moveCount = 0;
        board[0] = 3;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('敵ブロックは一段落ちる', board[0] === 0 && board[BOARD_SIZE] === 3);
        assert('侵攻1手目は湧かない', board.filter(v => v === 3).length === 1);
        board.fill(0); pieces = [];
        board[2 * BOARD_SIZE] = 3; board[3 * BOARD_SIZE] = 1;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('下に石があれば落ちられない', board[2 * BOARD_SIZE] === 3);
        board.fill(0); pieces = []; moveCount = 3;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('4手ごとに上端へ湧く', board.slice(0, BOARD_SIZE).includes(3));
    `,
};
