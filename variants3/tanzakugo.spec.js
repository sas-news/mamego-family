// TANZAKUGO — 短冊碁: 盤は幅2の長い短冊。両端は上下に折り返し接続する
const K = require('../gen_kit.js');
module.exports = {
    file: 'tanzakugo.html',
    en: 'TANZAKUGO',
    jp: '短冊碁',
    prefix: 'tanzakugo',
    desc: '幅2の長い短冊盤。上下の端は折り返して繋がる輪環。',
    kind: 'stone',
    icon: 'tanzakugo',
    spec: [
        ...K.rb('TANZAKUGO', '短冊碁', 'tanzakugo'),
        K.params([
            { key: 'wrap', label: '上下端の折り返し', options: [{ v: 1, l: 'あり (輪環)' }, { v: 0, l: 'なし' }], def: 1 },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.8, hint: '交点数比' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 短冊: 中央2列だけが盤面
        const TAN_COL0 = Math.floor(BOARD_SIZE / 2) - 1;
        const TAN_COL1 = TAN_COL0 + 1;
        function isTanzaku(x, y) { return x === TAN_COL0 || x === TAN_COL1; }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!isTanzaku(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 近傍: 幅2の帯 + 上下は折り返し接続 (輪環)
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            // 横は帯の反対側のみ
            if (x === TAN_COL0) neighbors.push(y * BOARD_SIZE + TAN_COL1);
            else if (x === TAN_COL1) neighbors.push(y * BOARD_SIZE + TAN_COL0);
            // 縦は折り返し (輪環) — 設定で折り返しなしにもできる
            if (P('wrap') ?? 1) {
                neighbors.push(((y - 1 + BOARD_SIZE) % BOARD_SIZE) * BOARD_SIZE + x);
                neighbors.push(((y + 1) % BOARD_SIZE) * BOARD_SIZE + x);
            } else {
                if (y > 0) neighbors.push((y - 1) * BOARD_SIZE + x);
                if (y < BOARD_SIZE - 1) neighbors.push((y + 1) * BOARD_SIZE + x);
            }

            return neighbors;
        }`],
        // 短冊の両脇は紙の裏 (暗い面)
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_ROCK('#5a4632', '#2a2016'))],
        // 紙の裏を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        // 折り返しマーカー (上下端のシェブロン)
        ...K.WRAP_MARKS_SPEC(`                chev(padding + TAN_COL0 * cellSize, padding, 0, -1);
                chev(padding + TAN_COL1 * cellSize, padding, 0, -1);
                chev(padding + TAN_COL0 * cellSize, padding + (BOARD_SIZE - 1) * cellSize, 0, 1);
                chev(padding + TAN_COL1 * cellSize, padding + (BOARD_SIZE - 1) * cellSize, 0, 1);`),
        [K.ONE, K.INFO_BASE, `            短冊碁: 幅2の短冊盤。上下の端は折り返して繋がる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は幅2列の短冊。それ以外は紙の裏 (着手不可・呼吸なし)。',
            '上端と下端は折り返して繋がる — 盤は輪っか。端を越えて連も取りも成立する。',
        ])],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const C0 = Math.floor(BOARD_SIZE / 2) - 1, C1 = C0 + 1;
        resetGame();
        assert('帯の外は紙の裏', board[I(0, 0)] === 3 && board[I(BOARD_SIZE - 1, 0)] === 3);
        assert('短冊には置ける', isValidPlacement([{ x: C0, y: 4 }], 1) === true);
        assert('紙の裏には置けない', isValidPlacement([{ x: 0, y: 4 }], 1) === false);
        assert('上端は下端に折り返す', getNeighbors(I(C0, 0)).includes(I(C0, BOARD_SIZE - 1)));
        assert('帯の横は反対列', getNeighbors(I(C0, 3)).includes(I(C1, 3)));
    `,
};
