// MARTYRGO — 殉教碁: 取られた連は道連れに、取跡に接する敵石を全て散らす
const K = require('../gen_kit.js');
module.exports = {
    file: 'martyrgo.html',
    en: 'MARTYRGO',
    jp: '殉教碁',
    prefix: 'martyrgo',
    desc: '取られた連は道連れを出す。取跡に接する敵石は全て散る。',
    kind: 'stone',
    spec: [
        ...K.rb('MARTYRGO', '殉教碁', 'martyrgo'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 殉教: 取られた連の怨念で、取跡に接する敵石は全て道連れに散る
                const martyred = new Set();
                captured.forEach(idx => getNeighbors(idx).forEach(n => {
                    if (board[n] === player) martyred.add(n);
                }));
                if (martyred.size > 0) {
                    martyred.forEach(i => { board[i] = 0; });
                    captures[opponent] += martyred.size;
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_ALGO, K.rv([
            '取られた連は殉教する: 取跡に接していた敵石は全て道連れに散る。',
            '囲んで取るたび囲んだ石も散る — 孤立した石ほど犠牲が小さい。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('白石が取れる', board[5 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        assert('接した敵石は全て道連れ', board[5 * BOARD_SIZE + 4] === 0 && board[5 * BOARD_SIZE + 6] === 0);
        assert('道連れ分は被害側の取り', captures[2] === 4);
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('通常着手は変化なし', board[3 * BOARD_SIZE + 3] === 1);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
