// PENTAGO — 五連碁: 自石を5個連続で並べた側が即勝ち (五目並べ+囲碁)
const K = require('../gen_kit.js');
module.exports = {
    file: 'pentago.html',
    en: 'PENTAGO',
    jp: '五連碁',
    prefix: 'pentago',
    desc: '縦横斜めに5個連続で並べた側が即勝ち。取られて切れたら連ならない。',
    kind: 'penta',
    spec: [
        ...K.rb('PENTAGO', '五連碁', 'pentago'),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 5連判定: 任意方向に自石が5連続していればtrue
        function hasFiveInARow(player) {
            const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
            const isP = (x, y) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE
                && board[y * BOARD_SIZE + x] === player;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y * BOARD_SIZE + x] !== player) continue;
                for (const [dx, dy] of dirs) {
                    if (isP(x - dx, y - dy)) continue; // 起点のみ走査
                    let run = 0;
                    while (isP(x + dx * run, y + dy * run)) run++;
                    if (run >= 5) return true;
                }
            }
            return false;
        }

        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 五連ルール: 着手した側が5連を作れば即勝ち
            if (hasFiveInARow(player)) {
                winByRule(player, '五連勝ち', '自分の石を5個連続で並べました'); return;
            }

            turn = opponent;`],
        [K.ONE, K.RV_ALGO, K.rv([
            '縦・横・斜めのいずれかに自分の石を5個連続で並べた側が即勝ち (五目並べ)。',
            '囲碁の取り・呼吸ルールも有効: 途中の石を取られれば連は切れる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        for (let x = 0; x < 4; x++) executeMove({ cells: [{ x, y: 4 }] }, 1);
        assert('4連では続行', gameOver === false);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('横5連で即勝ち', gameOver === true && gameResultData.title.includes('五連'));
    `,
};
