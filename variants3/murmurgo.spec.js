// MURMURGO — 群鳥碁: 孤立した石は鳥として最寄りの味方石へ1歩近づき、群れで呼吸を強くする
const K = require('../gen_kit.js');
module.exports = {
    file: 'murmurgo.html',
    en: 'MURMURGO',
    jp: '群鳥碁',
    prefix: 'murmurgo',
    desc: '孤立した石は鳥となり、自分の手番の終わりに最寄りの味方石へ1歩飛んで寄る。',
    kind: 'stone',
    icon: 'murmurgo',
    spec: [
        ...K.rb('MURMURGO', '群鳥碁', 'murmurgo'),
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 群鳥: 孤立した自石が最寄りの味方石へ1歩寄る (結合の本能)
            {
                const mine = [];
                for (let i = 0; i < board.length; i++) if (board[i] === player) mine.push(i);
                const lone = mine.filter(i => !getNeighbors(i).some(n => board[n] === player));
                if (lone.length > 0 && mine.length > 1) {
                    // 最も孤立している石から1つだけ動かす (手番ごと1羽)
                    const i0 = lone[0];
                    const ix = i0 % BOARD_SIZE, iy = Math.floor(i0 / BOARD_SIZE);
                    let tgt = -1, best = 1e9;
                    mine.forEach(j => {
                        if (j === i0) return;
                        const jx = j % BOARD_SIZE, jy = Math.floor(j / BOARD_SIZE);
                        const d = Math.abs(jx - ix) + Math.abs(jy - iy);
                        if (d < best) { best = d; tgt = j; }
                    });
                    if (tgt >= 0) {
                        const tx = tgt % BOARD_SIZE, ty = Math.floor(tgt / BOARD_SIZE);
                        const dx = Math.sign(tx - ix), dy = Math.sign(ty - iy);
                        const cand = [];
                        if (dx !== 0) cand.push(iy * BOARD_SIZE + ix + dx);
                        if (dy !== 0) cand.push((iy + dy) * BOARD_SIZE + ix);
                        const ni = cand.find(c => board[c] === 0);
                        if (ni !== undefined) {
                            board[i0] = 0;
                            board[ni] = player;
                            fxSlide(i0, ni, 350);
                            fxBurst(ni, '#7dd3fc', 6, 1.2);
                            cleanUpPieces();
                        }
                    }
                }
            }

            // 打ち切り終局
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        [K.ONE, K.INFO_ALGO, `            群鳥碁: 孤立した石は鳥となり、手番の終わりに最寄りの味方へ1歩寄る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の手番の終わりに、孤立している自分の石 (鳥) が1羽だけ最寄りの味方石へ1歩飛んで寄る。',
            '群れに守られて石は繋がりやすいが、単騎で深追いした石は群れへ戻ってしまう。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 孤立黒石(0,4)と群れ(4,4)-(5,4)
        board[4 * BOARD_SIZE + 0] = 1;
        board[4 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1);
        assert('孤鳥が群れへ近づく', board[4 * BOARD_SIZE + 0] === 0 && board[4 * BOARD_SIZE + 1] === 1);
        // 孤立石が1つも無ければ動かない
        board.fill(0); gameOver = false;
        board[4 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1;
        const before = board.slice();
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('群れは動かない', board[4 * BOARD_SIZE + 4] === 1 && board[4 * BOARD_SIZE + 5] === 1);
    `,
};
