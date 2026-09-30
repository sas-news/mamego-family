// SNATCHGO — 横取碁: 呼吸点1のアタリ状態の敵連は、自連が接していれば取り込める
const K = require('../gen_kit.js');
module.exports = {
    file: 'snatchgo.html',
    en: 'SNATCHGO',
    jp: '横取碁',
    prefix: 'snatchgo',
    desc: 'アタリの敵連は横取り。自連が接していれば最後の呼吸点を残したまま奪う。',
    kind: 'stone',
    spec: [
        ...K.rb('SNATCHGO', '横取碁', 'snatchgo'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }

            // 横取り: 着手した連に接していて呼吸点1の敵連を、そのまま自色に奪う
            {
                const anchor = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const grp = getConnectedGroup(anchor, player);
                const adj = new Set();
                grp.forEach(g => getNeighbors(g).forEach(n => { if (board[n] === opponent) adj.add(n); }));
                const stolen = [];
                const seen = new Set();
                adj.forEach(a => {
                    if (seen.has(a)) return;
                    const og = getConnectedGroup(a, opponent);
                    og.forEach(o => seen.add(o));
                    if (getLiberties(board, a) === 1) stolen.push(...og);
                });
                if (stolen.length > 0) {
                    stolen.forEach(i => { board[i] = player; });
                    captures[player] += stolen.length;
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            }`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した連に接している敵連がアタリ (呼吸点1) なら、最後の呼吸点を残したまま横取りする。',
            '奪った連は自分の色になる。取りこぼしに注意 — アタリの敵は最後まで粘れる。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        // 白2連 (4,4)(4,5) をアタリに追い込み、(5,6) 着手で連を拡張して横取り
        board[4 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 5] = 2;
        board[4 * BOARD_SIZE + 3] = 1; board[3 * BOARD_SIZE + 4] = 1;
        board[3 * BOARD_SIZE + 5] = 1; board[4 * BOARD_SIZE + 6] = 1; board[5 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1); // (4,6) と繋がる → 白連を横取り
        assert('アタリの敵連を横取り', board[4 * BOARD_SIZE + 4] === 1 && board[4 * BOARD_SIZE + 5] === 1);
        assert('横取り分は取り計上', captures[1] === 2);
        board.fill(0); pieces = []; captures[1] = 0;
        board[5 * BOARD_SIZE + 5] = 2; // アタリでない敵は奪えない
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('アタリでない敵は残る', board[5 * BOARD_SIZE + 5] === 2 && captures[1] === 0);
    `,
};
