// UPSIDEDOWNGO — 逆さ碁: 着手が盤面に反転して現れる (上下左右反転)。慣れるまでミスが増える盤
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'upsidedowngo.html',
    en: 'UPSIDEDOWNGO',
    jp: '逆さ碁',
    prefix: 'upsidedowngo',
    desc: '着手は盤の反対側に現れる。常に180度回転して読み直す逆さまの碁。',
    kind: 'stone',
    icon: 'upsidedowngo',
    spec: [
        ...K.rb('UPSIDEDOWNGO', '逆さ碁', 'upsidedowngo'),
        // 全ての着手判定は実着点 (180度回転位置) で行う
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function isValidPlacement(cells, player) {
            // 逆さ碁: 境界・空き・自殺・コウの判定は実着点で行う
            cells = cells.map(p => ({ x: BOARD_SIZE - 1 - p.x, y: BOARD_SIZE - 1 - p.y }));`],
        // 逆さま: 着手点は盤の中央で点対称の位置に置かれる (着手点と実着点が異なる)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(cell => {
                // 逆さ碁: 実際に置かれるのは着手点の180度回転位置
                const ri = (BOARD_SIZE - 1 - cell.y) * BOARD_SIZE + (BOARD_SIZE - 1 - cell.x);
                board[ri] = player;
            });`],
        // 逆さまであることを左上隅に小さく表示
        K.CUE_STARS(`            // 逆さ盤の印: 左上隅に逆さまの矢印
            {
                ctx.save();
                ctx.fillStyle = 'rgba(239,68,68,0.55)';
                ctx.font = cellSize * 0.45 + 'px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.translate(padding, padding);
                ctx.rotate(Math.PI);
                ctx.fillText('↑', 0, 0);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'逆さま: 対角の反対側に置かれる'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            逆さ碁: クリックした点と180度対称の位置に石が置かれる逆さまの碁<br>
            PC: クリックで配置 (石は反対側に現れる)<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            'クリックした点の180度回転位置に石が置かれる — 着手と実着点が常に逆さま。',
            '石を打ちたい位置とは逆側を狙ってクリックする必要がある。',
            '読み違いと錯覚が飛び交う反転の盤。ルール自体は通常の碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1);
        const rx = B - 1 - 2, ry = B - 1 - 3;
        assert('反転位置に置かれる', board[ry * B + rx] === 1);
        assert('着手点には置かれない', board[3 * B + 2] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 4, y: 4 }], 2) === true);
        assert('実着点が占有なら不可', isValidPlacement([{ x: 2, y: 3 }], 2) === false);
        assert('反転位置への着手は空きなら可', isValidPlacement([{ x: rx, y: ry }], 2) === true);
    `,
};
