// KOCHUGO — 講中碁: 終局時、4石以上の連(講)1つごとに共同参拝の得点+3
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kochugo.html',
    en: 'KOCHUGO',
    jp: '講中碁',
    prefix: 'kochugo',
    desc: '終局時、4石以上の連 (講) 1つごとに共同参拝の得点+3。',
    kind: 'stone',
    icon: 'kochugo',
    spec: [
        ...K.rb('KOCHUGO', '講中碁', 'kochugo'),
        K.params([
            { key: 'kochu_min', label: '講と認める連の最小石数', min: 2, max: 10, def: 4, unit: '石' },
            { key: 'kochu_pts', label: '講1つの得点', min: 0, max: 10, def: 3, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 講数えヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 講中: pl の4石以上の連の数を数える
        function kochuGroups(pl) {
            const seen = new Set();
            let count = 0;
            for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                if (board[i] !== pl || seen.has(i)) continue;
                const stack = [i], g = [i];
                seen.add(i);
                while (stack.length) {
                    getNeighbors(stack.pop()).forEach(nb => {
                        if (!seen.has(nb) && board[nb] === pl) { seen.add(nb); g.push(nb); stack.push(nb); }
                    });
                }
                if (g.length >= (P('kochu_min') || 4)) count++;
            }
            return count;
        }

        function endGameByScore() {`],
        // 採点に講点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + kochuGroups(1) * (P('kochu_pts') ?? 3);
            const whiteTotal = territory.white + captures[2] + komi + kochuGroups(2) * (P('kochu_pts') ?? 3);`],
        // 4石以上の連に小さな講の印 (結び) を描く
        ...K.STONE_MARKS_SPEC(`            // 講中: 4石以上の連の中央に小さな講の印
            {
                ctx.save();
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                const seen = new Set();
                for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                    if (board[i] === 0 || board[i] === 4 || seen.has(i)) continue;
                    const pl = board[i];
                    const stack = [i], g = [i];
                    seen.add(i);
                    while (stack.length) {
                        getNeighbors(stack.pop()).forEach(nb => {
                            if (!seen.has(nb) && board[nb] === pl) { seen.add(nb); g.push(nb); stack.push(nb); }
                        });
                    }
                    if (g.length >= (P('kochu_min') || 4)) {
                        const mid = g[Math.floor(g.length / 2)];
                        const x = mid % BOARD_SIZE, y = Math.floor(mid / BOARD_SIZE);
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.fillStyle = pl === 1 ? 'rgba(251,191,36,0.95)' : 'rgba(217,70,239,0.9)';
                        ctx.beginPath();
                        ctx.moveTo(cx, cy - cellSize * 0.18);
                        ctx.lineTo(cx + cellSize * 0.18, cy);
                        ctx.lineTo(cx, cy + cellSize * 0.18);
                        ctx.lineTo(cx - cellSize * 0.18, cy);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            講中碁: 終局時、4石以上の連 (講) 1つごとに共同参拝の得点+3<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '終局時、自分の4石以上つながった連 (講) 1つごとに+3点。連の中の石数ではなく連の個数。',
            '小さな連を並べるより大きな講を組む方が得。講の中心には結びの印が出る。',
            '双方同じ条件。取られれば講は崩れる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('空盤は講0', kochuGroups(1) === 0);
        board[0] = 1; board[1] = 1; board[2] = 1; // 3連は講ではない
        assert('3連は講ではない', kochuGroups(1) === 0);
        board[3] = 1; // 4連に
        assert('4連は講1', kochuGroups(1) === 1);
        board[B] = 2; board[B + 1] = 2; board[2 * B] = 2; board[2 * B + 1] = 2; // 白4連
        assert('白も同条件', kochuGroups(2) === 1);
        board[1] = 0; // 黒4連を分断
        assert('分断で講は崩れる', kochuGroups(1) === 0);
    `,
};
