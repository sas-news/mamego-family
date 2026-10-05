// STRIPGO — 帯碁: 幅5の無限帯盤。上下端がループして長い戦線が続く
const K = require('../gen_kit.js');
module.exports = {
    file: 'stripgo.html',
    en: 'STRIPGO',
    jp: '帯碁',
    prefix: 'stripgo',
    desc: '幅5の帯盤は上下がループする無限戦線。帯を囲い込む閉塞戦。',
    kind: 'stone',
    icon: 'stripgo',
    spec: [
        ...K.rb('STRIPGO', '帯碁', 'stripgo'),
        K.params([
            { key: 'strip_w', label: '帯の幅', min: 3, max: 9, def: 5, unit: '列', hint: '新しい対局で反映' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 幅Nの帯: 中央のN列のみ着手可能、上下はループ
        let STRIP_W = 5;
        let STRIP_L = Math.max(0, ((BOARD_SIZE - STRIP_W) / 2) | 0); // 帯の左端x
        let STRIP_R = STRIP_L + STRIP_W - 1;                          // 帯の右端x
        function rebuildStrip() {
            STRIP_W = Math.max(1, Math.min(BOARD_SIZE, P('strip_w') || 5));
            STRIP_L = Math.max(0, ((BOARD_SIZE - STRIP_W) / 2) | 0);
            STRIP_R = STRIP_L + STRIP_W - 1;
        }
        rebuildStrip();
        function onVariantParam(p) { if (p.key === 'strip_w') rebuildStrip(); }
        function isStripCell(x) { return x >= STRIP_L && x <= STRIP_R; }`],
        // 帯の外側は切り立った崖
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let i = 0; i < board.length; i++) {
                const x = i % BOARD_SIZE;
                if (!isStripCell(x)) board[i] = 3;
            }`],
        // 上下がループする近傍
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];
            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            // 帯は上下でループする (無限帯)
            neighbors.push(((y - 1 + BOARD_SIZE) % BOARD_SIZE) * BOARD_SIZE + x);
            neighbors.push(((y + 1) % BOARD_SIZE) * BOARD_SIZE + x);
            return neighbors;
        }`],
        // 帯の外の崖とループ端の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_CLIFF)],
        ...K.WRAP_MARKS_SPEC(`
            // 上下端のループ印 (帯の列だけ)
            for (let x = STRIP_L; x <= STRIP_R; x++) {
                const cx = padding + x * cellSize;
                chev(cx, padding, 0, -1);
                chev(cx, width - padding, 0, 1);
            }`),
        // 崖を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_BASE, `            帯碁: 幅5の帯盤は上下がループする無限戦線 (両側は切り立った崖)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手できるのは中央5列の帯のみ。帯は上下でループし上端と下端が繋がる。',
            '端が無いので隅の定石は存在しない。帯を閉じ込める細長い争い。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('帯の内側は打てる', isValidPlacement([{ x: STRIP_L, y: 3 }], 1) === true);
        assert('帯の外は打てない', isValidPlacement([{ x: 0, y: 3 }], 1) === false);
        assert('帯の外は崖', board[I(0, 3)] === 3);
        assert('上端は下端に繋がる', getNeighbors(I(STRIP_L, 0)).includes(I(STRIP_L, BOARD_SIZE - 1)));
        assert('下端は上端に繋がる', getNeighbors(I(STRIP_R, BOARD_SIZE - 1)).includes(I(STRIP_R, 0)));
    `,
};
