// SWAPGO — 入替碁: 敵連を取ると、取った自連と取られた敵連の場所(持ち主)が入れ替わる
const K = require('../gen_kit.js');
module.exports = {
    file: 'swapgo.html',
    en: 'SWAPGO',
    jp: '入替碁',
    prefix: 'swapgo',
    desc: '敵連を取ると自分の連と場所が入れ替わる。盤面が大転換する。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('SWAPGO', '入替碁', 'swapgo'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 入替: 取った連と取られた連の持ち主を入れ替える
                const anchor = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const mine = getConnectedGroup(anchor, player); // 先に自連を確定しておく
                captured.forEach(idx => { board[idx] = player; });
                mine.forEach(idx => { board[idx] = opponent; });
                captures[player] += captured.length;
                // 入替演出: 反転した全セルを双方の色で光らせ、盤を揺らす
                captured.forEach(idx => fxGlow(idx, player === 1 ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)', 700));
                mine.forEach(idx => fxGlow(idx, opponent === 1 ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)', 700));
                fxText(anchor, '\\u5165\\u66ff!', '#e879f9', 1200);
                fxShake(4, 240);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_BASE, K.rv([
            '敵連を取ると、その敵連は自分の色になり、取った自分の連は敵の色になる。',
            '捕獲数は通常通り数える。取った瞬間に盤の勢力が大きく入れ替わる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('取られた連は自分色に', board[5 * BOARD_SIZE + 5] === 1);
        assert('取った自連は敵色に', board[6 * BOARD_SIZE + 5] === 2); // 着手した連は単石なのでそれだけ反転
        assert('連でない隣石はそのまま', board[5 * BOARD_SIZE + 4] === 1);
        assert('捕獲数は計上', captures[1] === 1);
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('通常着手はそのまま', board[3 * BOARD_SIZE + 3] === 1);
    `,
};
