// LEECHGO — 吸生碁: 取った分だけ取った連が肥大化する (呼吸点へ自生)
const K = require('../gen_kit.js');
module.exports = {
    file: 'leechgo.html',
    en: 'LEECHGO',
    jp: '吸生碁',
    prefix: 'leechgo',
    desc: '取った分だけ自分の連が呼吸点へ肥大成長する。',
    kind: 'stone',
    spec: [
        ...K.rb('LEECHGO', '吸生碁', 'leechgo'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 吸生: 取った連が取った分だけ呼吸点に自生して肥大化する (呼吸点は1つ残す)
                {
                    const anchor = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    const grp = getConnectedGroup(anchor, player);
                    const libs = new Set();
                    grp.forEach(g => getNeighbors(g).forEach(n => { if (board[n] === 0) libs.add(n); }));
                    let grow = Math.min(captured.length, libs.size - 1);
                    const grown = grow;
                    for (const l of libs) {
                        if (grow-- <= 0) break;
                        board[l] = player;
                        // 自生した石: 吸い上げるように緑の輪が広がる
                        fxGlow(l, '#4ade80', 650);
                        fxBurst(l, '#86efac', 5, 0.9);
                    }
                    if (grown > 0) fxText(anchor, '+' + grown, '#4ade80', 1000);
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        K.CUE_STARS(`            // 吸い取りの気配: 最も大きい自連の持ち主を強調 (情報表示)
            // (描画は通常碁と同じ)`),
        [K.ONE, K.RV_ALGO, K.rv([
            '敵連を取ると、取った石の数だけ自分の連が呼吸点に自生して肥大化する。',
            '呼吸点は最低1つ残る。大きな連で取るほど一気に膨らむが、膨らみすぎは詰め込みに注意。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('白石が取れる', captures[1] === 1);
        const blacks = board.filter(v => v === 1).length;
        assert('取った分だけ連が肥える', blacks === 5); // 包囲4石 + 自生1石
        board.fill(0); pieces = []; captures[1] = 0;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('取りなしなら自生なし', board.filter(v => v === 1).length === 1);
    `,
};
