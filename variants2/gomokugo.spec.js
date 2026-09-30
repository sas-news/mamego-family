// GOMOKUGO — 五目碁: 5連を作った側が即勝ち (地取り勝負も残る)
const K = require('../gen_kit.js');
module.exports = {
    file: 'gomokugo.html',
    en: 'GOMOKUGO',
    jp: '五目碁',
    prefix: 'gomokugo',
    desc: '縦横斜めに5連を作れば即勝ち。通常の地取り勝負も残る。',
    kind: 'stone',
    spec: [
        ...K.rb('GOMOKUGO', '五目碁', 'gomokugo'),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        // 手番交代直前に5連判定
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 五目碁: 縦・横・斜めに5連以上の自分色があれば即勝ち
            {
                const gdirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
                let five = false;
                gcheck: for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    const bx = i % BOARD_SIZE, by = Math.floor(i / BOARD_SIZE);
                    for (const [dx, dy] of gdirs) {
                        let n = 0;
                        for (let k = 0; k < 5; k++) {
                            const nx = bx + dx * k, ny = by + dy * k;
                            if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
                            if (board[ny * BOARD_SIZE + nx] !== player) break;
                            n++;
                        }
                        if (n >= 5) { five = true; break gcheck; }
                    }
                }
                if (five) { winByRule(player, '五目勝ち', '自分の石を5つ以上連続で並べました'); return; }
            }

            turn = opponent;`],
        [K.ONE, K.INFO_ALGO, `            五目碁: 縦横斜めに5連を作れば即勝ち。地取り勝負にもなる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手の時点で自分の石が縦・横・斜めのいずれかに5連以上なら即座に勝利。',
            '5連を狙いつつ相手の連結を切る攻守一体の勝負。並ばなければ通常の地取り決着。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('単独着手では続く', gameOver === false);
        board.fill(0); pieces = [];
        for (let x = 0; x < 4; x++) board[x] = 1;
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1);
        assert('5連で即勝ち', gameOver === true);
        assert('結果は五目', !!gameResultData && gameResultData.title.includes('五目'));
    `,
};
