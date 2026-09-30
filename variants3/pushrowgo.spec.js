// PUSHROWGO — 列推碁: 着手で同じ筋の敵石を1マスずつ押し出す。押し先が塞がる石は潰れて取りになる
const K = require('../gen_kit.js');
module.exports = {
    file: 'pushrowgo.html',
    en: 'PUSHROWGO',
    jp: '列推碁',
    prefix: 'pushrowgo',
    desc: '着手した筋の敵石を遠ざかる向きに1マス押し出す。押し先が塞がっていれば潰れて取り。',
    kind: 'stone',
    icon: 'pushrowgo',
    spec: [
        ...K.rb('PUSHROWGO', '列推碁', 'pushrowgo'),
        // 列押し: 着手筋の敵石を着手点から遠ざかる方向に1マスずらす
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 列推ルール: 同じ筋の敵石を着手点から遠ざかる向きに1マス押し出す
            {
                const px = move.cells[0].x;
                const py = move.cells[0].y;
                const moves = [];
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const i = y * BOARD_SIZE + px;
                    if (board[i] !== opponent || y === py) continue;
                    const ny = y < py ? y - 1 : y + 1;
                    if (ny < 0 || ny >= BOARD_SIZE) {
                        moves.push({ from: i, to: -1 }); // 盤外に押し出されて潰れる
                        continue;
                    }
                    const ti = ny * BOARD_SIZE + px;
                    if (board[ti] !== 0) {
                        moves.push({ from: i, to: -1 }); // 押し先が塞がり潰れる
                    } else {
                        moves.push({ from: i, to: ti });
                    }
                }
                let crushed = 0;
                moves.forEach(mv => {
                    const pc = pieces.find(x => x.cells.some(c => c.y * BOARD_SIZE + c.x === mv.from));
                    board[mv.from] = 0;
                    if (mv.to < 0) {
                        crushed++;
                        fxBurst(mv.from, '#f87171', 8, 1.4);
                    } else {
                        board[mv.to] = opponent;
                        if (pc) pc.cells = [{ x: mv.to % BOARD_SIZE, y: Math.floor(mv.to / BOARD_SIZE) }];
                        fxSlide(mv.from, mv.to, 300);
                    }
                });
                if (crushed > 0) {
                    captures[player] += crushed;
                    fxText(py * BOARD_SIZE + px, '押し潰し +' + crushed, '#f87171', 1200);
                }
                cleanUpPieces();
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
        [K.ONE, K.INFO_ALGO, `            列推碁: 着手筋の敵石を遠ざかる向きに押し出す。押し先が塞がる石は潰れて取り<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した筋にいる敵石は、着手点から遠ざかる向きに1マス押し出される。',
            '押し先が盤外または塞がっていればその敵石は潰れてアゲハマになる。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof executeMove === 'function');
        // 敵石を下へ押し出す
        board[6 * BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 4, y: 8 }] }, 1);
        assert('敵石が押された', board[5 * BOARD_SIZE + 4] === 2);
        assert('元の位置は空', board[6 * BOARD_SIZE + 4] === 0);
        // 盤外に押し出されて潰れる → アゲハマ
        board[0 * BOARD_SIZE + 2] = 2;
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1);
        assert('盤外押しで取り', captures[1] === 1);
        assert('押し潰した石は消える', board[0 * BOARD_SIZE + 2] === 0);
        assert('通常着手は合法', isValidPlacement([{ x: 9, y: 9 }], 2) === true);
    `,
};
