// SASHIKOGO — 刺子碁: 同色2個が1点空けで並ぶと間の空点は「縫い目」。相手は縫い目を切り込めない
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
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
];
module.exports = {
    file: 'sashikogo.html',
    en: 'SASHIKOGO',
    jp: '刺子碁',
    prefix: 'sashikogo',
    desc: '同色2個が1点空けで並ぶと間は縫い目。相手は縫い目に打てない。',
    kind: 'stone',
    icon: 'sashikogo',
    spec: [
        ...K.rb('SASHIKOGO', '刺子碁', 'sashikogo'),
        K.params([
            { key: 'seam_gap', label: '縫い目の間隔', min: 1, max: 3, def: 1, unit: '点', hint: '同色対の空き数' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 縫い目: pl色の石が1点空けで挟む空点 (縦・横)
        function isSeam(b, idx, pl) {
            const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
            const d = Math.max(1, P('seam_gap') || 1);
            if (x >= d && x < BOARD_SIZE - d && b[idx - d] === pl && b[idx + d] === pl) return true;
            if (y >= d && y < BOARD_SIZE - d && b[idx - d * BOARD_SIZE] === pl && b[idx + d * BOARD_SIZE] === pl) return true;
            return false;
        }`],
        // 着手禁止: 相手の縫い目は補強済み — 切り込めない
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `
            // 刺し子の縫い目: 相手の同色対に挟まれた空点は切り込めない
            {
                const opponent = player === 1 ? 2 : 1;
                for (const p of cells) {
                    if (isSeam(board, p.y * BOARD_SIZE + p.x, opponent)) return false;
                }
            }`],
        // 縫い目の破線を描く
        ...K.STONE_MARKS_SPEC(`            // 縫い目: 同色対に挟まれた空点に破線
            ctx.save();
            ctx.lineWidth = Math.max(1.2, cellSize * 0.07);
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) continue;
                const pl = isSeam(board, i, 1) ? 1 : (isSeam(board, i, 2) ? 2 : 0);
                if (!pl) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.strokeStyle = pl === 1 ? 'rgba(240,240,240,0.9)' : 'rgba(40,40,40,0.9)';
                ctx.setLineDash([cellSize * 0.1, cellSize * 0.08]);
                ctx.beginPath();
                const d = Math.max(1, P('seam_gap') || 1);
                if (x >= d && x < BOARD_SIZE - d && board[i - d] === pl && board[i + d] === pl) {
                    ctx.moveTo(cx - cellSize * 0.3, cy); ctx.lineTo(cx + cellSize * 0.3, cy);
                }
                if (y >= d && y < BOARD_SIZE - d && board[i - d * BOARD_SIZE] === pl && board[i + d * BOARD_SIZE] === pl) {
                    ctx.moveTo(cx, cy - cellSize * 0.3); ctx.lineTo(cx, cy + cellSize * 0.3);
                }
                ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.restore();`),
        [K.ONE, K.INFO_ALGO, `            刺子碁: 同色2個が1点空けで縦横に並ぶと間は「縫い目」。相手は縫い目に打てない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '同色の石を縦か横に1点空けで並べると、間の空点は破線の「縫い目」になる。',
            '相手は縫い目に打てない — 補強された布は切り込めない。自分は打てる。',
            '縫い目の両端の石自体は普通に取られる。縫い目を繋いで布を強くしろ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[I(3, 3)] = 1; board[I(5, 3)] = 1; // 横の刺し子
        assert('縫い目が認識される', isSeam(board, I(4, 3), 1) === true);
        assert('白には縫い目でない', isSeam(board, I(4, 3), 2) === false);
        assert('白は縫い目を切り込めない', isValidPlacement([{ x: 4, y: 3 }], 2) === false);
        assert('黒は自分の縫い目に打てる', isValidPlacement([{ x: 4, y: 3 }], 1) === true);
        assert('縫い目でない点は打てる', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        // 縦の刺し子
        board.fill(0);
        board[I(8, 8)] = 2; board[I(8, 10)] = 2;
        assert('縦の縫い目', isSeam(board, I(8, 9), 2) === true);
        assert('黒は縦縫い目に打てない', isValidPlacement([{ x: 8, y: 9 }], 1) === false);
    `,
};
