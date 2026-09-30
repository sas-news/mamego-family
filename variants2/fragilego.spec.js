// FRAGILEGO — 脆碁: 呼吸点2以下の敵連は砕けて取られる。早死にの碁。
const K = require('../gen_kit.js');
module.exports = {
    file: 'fragilego.html',
    en: 'FRAGILEGO',
    jp: '脆碁',
    prefix: 'fragilego',
    desc: '呼吸点2以下の敵連は砕けて取られる。早死にの碁。',
    kind: 'stone',
    spec: [
        ...K.rb('FRAGILEGO', '脆碁', 'fragilego'),
        [K.ONE, K.CAPTURE_BLOCK, `            // 脆碁: 呼吸点が2以下の敵連は全て砕ける (通常は0のみ)
            const seenGrp = new Set();
            const captured = [];
            for (let i = 0; i < board.length; i++) {
                if (board[i] === opponent && !seenGrp.has(i)) {
                    const grp = getConnectedGroup(i, opponent);
                    grp.forEach(g => seenGrp.add(g));
                    if (getLiberties(board, i) <= 2) captured.push(...grp);
                }
            }
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_ALGO, K.rv(['脆い石: 着手後、呼吸点が2以下の敵連は全て砕けて取られる (通常は0のみ)。','常に呼吸点3以上を保たないと連が死ぬ。自分の連は従来通り0まで生きる。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        board[5 * BOARD_SIZE + 5] = 2;
        board[4 * BOARD_SIZE + 5] = 1; board[6 * BOARD_SIZE + 5] = 1; // 敵の呼吸点=2
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('呼吸点2の敵は砕ける', board[5 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        board.fill(0); captures[1] = 0;
        board[3 * BOARD_SIZE + 3] = 2;
        board[2 * BOARD_SIZE + 3] = 1; // 敵の呼吸点=3
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('呼吸点3の敵は生存', board[3 * BOARD_SIZE + 3] === 2);
    
    `,
};
