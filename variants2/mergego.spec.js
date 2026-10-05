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
        K.params([
            { key: 'merge_pts', label: '併合の得点係数', min: 0, max: 4, def: 1, step: 0.25, hint: '併合した石×この係数が得点に' },
        ]),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = player; }); // 併合: 取った敵連は自分色になる
                // 吸収演出: 紫の吸い込み飛沫と併合数
                captured.forEach(idx => fxBurst(idx, '#a78bfa', 4, 0.9));
                fxText(captured[0], '併合+' + captured.length, '#8b5cf6', 1100);
                fxShake(3, 180);
                captures[player] += Math.round(captured.length * (P('merge_pts') ?? 1));
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_BASE, K.rv([
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
