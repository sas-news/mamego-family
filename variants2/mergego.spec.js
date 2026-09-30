// MERGEGO — 併合碁: 取った敵連は消えずに自分の色に染まり、自連に吸収併合される
const K = require('../gen_kit.js');
module.exports = {
    file: 'mergego.html',
    en: 'MERGEGO',
    jp: '併合碁',
    prefix: 'mergego',
    desc: '取った敵連は自分の色に染まって自連に吸収併合される。',
    kind: 'stone',
    spec: [
        ...K.rb('MERGEGO', '併合碁', 'mergego'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = player; }); // 併合: 取った敵連は自分色になる
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_ALGO, K.rv([
            '取った敵連は消えずに自分の色に染まり、自分の連に吸収併合される。',
            '取るほど自分の勢力がそのまま増える。大きな敵連を併合すると一気に制圧できる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('取られた連は自分色に併合', board[5 * BOARD_SIZE + 5] === 1);
        assert('併合分は捕獲数に計上', captures[1] === 1);
        const grp = getConnectedGroup(5 * BOARD_SIZE + 5, 1);
        assert('自連に吸収される', grp.length === 5);
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('通常着手はそのまま', board[3 * BOARD_SIZE + 3] === 1);
    `,
};
