// LUNGEGO — 突撃碁: 着手で敵石に接すると「突撃」。接した敵石は1マス後退する (後退先が塞がれば潰れて取り)
const K = require('../gen_kit.js');
module.exports = {
    file: 'lungego.html',
    en: 'LUNGEGO',
    jp: '突撃碁',
    prefix: 'lungego',
    desc: '着手で敵石に接すると突撃: 接した敵石が1マス後退。後退先が塞がれば潰れて取り。',
    kind: 'stone',
    icon: 'lungego',
    spec: [
        ...K.rb('LUNGEGO', '突撃碁', 'lungego'),
        // 突撃: 着手に接する敵石を接触方向に1マス後退させる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 突撃ルール: 着手に接する敵石を接触方向に1マス後退させる
            {
                const p0 = move.cells[0];
                const pi = p0.y * BOARD_SIZE + p0.x;
                let lunged = 0, crushed = 0;
                getNeighbors(pi).forEach(n => {
                    if (board[n] !== opponent) return;
                    const dx = (n % BOARD_SIZE) - p0.x;
                    const dy = Math.floor(n / BOARD_SIZE) - p0.y;
                    const tx = (n % BOARD_SIZE) + dx, ty = Math.floor(n / BOARD_SIZE) + dy;
                    const pc = pieces.find(x => x.cells.some(c => c.y * BOARD_SIZE + c.x === n));
                    board[n] = 0;
                    if (tx < 0 || tx >= BOARD_SIZE || ty < 0 || ty >= BOARD_SIZE || board[ty * BOARD_SIZE + tx] !== 0) {
                        crushed++; // 後退できず潰れて取り
                        fxBurst(n, '#f87171', 8, 1.4);
                        return;
                    }
                    const ti = ty * BOARD_SIZE + tx;
                    board[ti] = opponent;
                    if (pc) pc.cells = [{ x: tx, y: ty }];
                    lunged++;
                    fxSlide(n, ti, 300);
                });
                if (lunged + crushed > 0) {
                    cleanUpPieces();
                    fxText(pi, '突撃!' + (crushed > 0 ? ' 潰し +' + crushed : ''), '#fb923c', 1200);
                    captures[player] += crushed;
                }
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        [K.ONE, K.INFO_ALGO, `            突撃碁: 着手で敵石に接すると突撃。敵石は1マス後退、後退先が塞がれば潰れて取り<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した石に接する敵石は「突撃」で接触方向に1マス後退させられる。',
            '後退先が盤外または塞がっていれば潰れてアゲハマになる。敵の壁の近くでは注意。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof executeMove === 'function');
        // 敵石を突撃で後退させる
        board[4 * BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1); // (4,5)から上の敵を上へ後退
        assert('敵石が後退', board[3 * BOARD_SIZE + 4] === 2);
        assert('元の位置は空', board[4 * BOARD_SIZE + 4] === 0);
        // 盤外へ潰れる → 取り
        board.fill(0); captures = { 1: 0, 2: 0 };
        board[0 * BOARD_SIZE + 3] = 2;
        executeMove({ cells: [{ x: 3, y: 1 }] }, 1); // 上の敵は盤外へ潰れる
        assert('潰れて取り', captures[1] === 1);
        assert('潰れた石は消える', board[0 * BOARD_SIZE + 3] === 0);
        assert('通常着手は合法', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
    `,
};
