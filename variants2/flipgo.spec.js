// FLIPGO — 挟撃碁: 自分の石で縦か横に両挟みした敵石を全て返す
const K = require('../gen_kit.js');
module.exports = {
    file: 'flipgo.html',
    en: 'FLIPGO',
    jp: '挟撃碁',
    prefix: 'flipgo',
    desc: '敵石を縦か横に両挟みすれば返る。盤全体を走査する挟撃判定。',
    kind: 'stone',
    spec: [
        ...K.rb('FLIPGO', '挟撃碁', 'flipgo'),
        K.params([
            { key: 'flip_dirs', label: '挟撃の方向', options: [{ v: 'hv', l: '縦横のみ' }, { v: 'all', l: '縦横+斜め' }], def: 'hv' },
        ]),
        // 挟撃処理を通常捕獲の前に挿入
        [K.ONE, K.CAPTURE_BLOCK, `            // 挟撃碁: 自分色で縦か横に両挟みされた敵石を盤全体から返す
            {
                const flips = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== opponent) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const at = (xx, yy) => (xx >= 0 && yy >= 0 && xx < BOARD_SIZE && yy < BOARD_SIZE)
                        ? board[yy * BOARD_SIZE + xx] : -1;
                    const diag = (P('flip_dirs') || 'hv') === 'all';
                    if ((at(x - 1, y) === player && at(x + 1, y) === player)
                        || (at(x, y - 1) === player && at(x, y + 1) === player)
                        || (diag && ((at(x - 1, y - 1) === player && at(x + 1, y + 1) === player)
                            || (at(x - 1, y + 1) === player && at(x + 1, y - 1) === player)))) {
                        flips.push(i);
                    }
                }
                flips.forEach(i => { board[i] = player; fxGlow(i, '#a5f3fc', 550); });
                if (flips.length > 0 && move.cells[0]) {
                    const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxText(mi, '挟撃×' + flips.length, '#38bdf8', 1050);
                    if (flips.length >= 3) fxShake(4, 260);
                }
            }

            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.INFO_ALGO, `            挟撃碁: 自分の石で縦か横に両挟みした敵石が全て返る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手後、縦か横に自分の石2個で両側から挟まれた敵石は全て自分の色に返る。',
            '打った石から遠くても挟めば返る — 盤のあちこちが同時に反転する挟撃盤。',
            '返した後も通常の呼吸・取り判定は働く。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        board[5] = 1; board[7] = 1; board[6] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('横に挟まれた敵石は返る', board[6] === 1);
        board.fill(0); pieces = [];
        board[6] = 1; board[2 * BOARD_SIZE + 6] = 1; board[BOARD_SIZE + 6] = 2;
        board[10] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('縦の挟みも返る', board[BOARD_SIZE + 6] === 1);
        assert('挟まれない敵石は残る', board[10] === 2);
    `,
};
