// BLACKJACKGO — 廿一碁: 着手ごとにカードを引き、21を超えたらバースト負け
const K = require('../gen_kit.js');
module.exports = {
    file: 'blackjackgo.html',
    en: 'BLACKJACKGO',
    jp: '廿一碁',
    prefix: 'blackjackgo',
    desc: '打つたびに1〜11のカードを引く。合計21を超えたらバースト負け。',
    kind: 'stone',
    spec: [
        ...K.rb('BLACKJACKGO', '廿一碁', 'blackjackgo'),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
        let cardTotal = { 1: 0, 2: 0 }; // 各プレイヤーのカード合計`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 廿一碁: 着手ごとに1〜11を引き、21を超えたらバースト負け
            {
                const card = 1 + Math.floor(Math.random() * 11);
                cardTotal[player] += card;
                if (cardTotal[player] > 21) {
                    winByRule(opponent, 'バースト勝ち', '相手のカード合計が21を超えました (' + cardTotal[player] + ')');
                    return;
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC('"手札 " + cardTotal[1] + "−" + cardTotal[2]'),
        [K.ONE, K.INFO_ALGO, `            廿一碁: 打つたびカードを引く。21超過でバースト負け<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手するたびに1〜11のカードを引き、自分の合計に加える。',
            '合計が21を超えたらバースト負け。21ギリギリを保つには打たずにパスを選ぶしかない。',
            '打てば攻められるがバーストに近づく — ブラックジャックの駆け引きが囲碁に乗る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; cardTotal = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('着手でカードを引く', cardTotal[1] >= 1 && cardTotal[1] <= 11);
        cardTotal[1] = 21;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('21超過でバースト負け', gameOver === true);
        assert('結果はバースト', !!gameResultData && gameResultData.title.includes('バースト'));
    `,
};
