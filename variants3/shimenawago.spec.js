// SHIMENAWAGO — 注連碁: 3連以上の連は注連縄。縄の結界に隣接する空点は相手が侵入できない
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
    file: 'shimenawago.html',
    en: 'SHIMENAWAGO',
    jp: '注連碁',
    prefix: 'shimenawago',
    desc: '3連以上の連は注連縄。その結界 (内側の空点) には相手が侵入できない。',
    kind: 'stone',
    icon: 'shimenawago',
    spec: [
        ...K.rb('SHIMENAWAGO', '注連碁', 'shimenawago'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 注連縄: pl色の石3個以上の連が結界 — その連にだけ隣接する空点 (結界点) には相手が打てない
        function shimenawaPoints(pl) {
            const walls = new Set();
            const visited = new Set();
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== pl || visited.has(i)) continue;
                const grp = getConnectedGroup(i, pl);
                grp.forEach(g => visited.add(g));
                if (grp.length < 3) continue;
                // 結界点: この連に隣接する空点
                grp.forEach(g => getNeighbors(g).forEach(n => { if (board[n] === 0) walls.add(n); }));
            }
            return walls;
        }`],
        // 着手禁止: 相手の注連縄の結界点には侵入できない
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `
            // 注連縄の結界: 相手の3連以上の連に隣接する空点は聖域
            {
                const opponent = player === 1 ? 2 : 1;
                const walls = shimenawaPoints(opponent);
                for (const p of cells) {
                    if (walls.has(p.y * BOARD_SIZE + p.x)) return false;
                }
            }`],
        // 注連縄の紙垂を描く: 3連以上の連の石に白い紙垂マーク
        ...K.STONE_MARKS_SPEC(`            // 注連縄の紙垂: 大きな連の石に白い稲妻形
            ctx.save();
            for (const pl of [1, 2]) {
                const seen = new Set();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== pl || seen.has(i)) continue;
                    const grp = getConnectedGroup(i, pl);
                    grp.forEach(g => seen.add(g));
                    if (grp.length < 3) continue;
                    grp.forEach(g => {
                        const x = g % BOARD_SIZE, y = (g / BOARD_SIZE) | 0;
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.strokeStyle = pl === 1 ? 'rgba(255,255,255,0.8)' : 'rgba(120,40,40,0.8)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.06);
                        ctx.beginPath();
                        ctx.moveTo(cx - cellSize * 0.1, cy - cellSize * 0.18);
                        ctx.lineTo(cx + cellSize * 0.08, cy - cellSize * 0.02);
                        ctx.lineTo(cx - cellSize * 0.06, cy + cellSize * 0.02);
                        ctx.lineTo(cx + cellSize * 0.1, cy + cellSize * 0.18);
                        ctx.stroke();
                    });
                }
            }
            ctx.restore();`),
        [K.ONE, K.INFO_ALGO, `            注連碁: 3連以上の連は注連縄。縄に隣接する空点は聖域 — 相手は打てない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石3個以上の連は注連縄となり紙垂が下がる — 聖域の結界。',
            '注連縄に隣接する空点は聖域: 相手はそこに打てない (取りに来れない!)。',
            '縄が切れて3連未満になれば結界は消える。縄を繋いで境内を守れ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        // 黒の3連: (4,4)(5,4)(6,4) → 結界点はその隣接空点
        board[I(4, 4)] = 1; board[I(5, 4)] = 1; board[I(6, 4)] = 1;
        assert('結界点が認識される', shimenawaPoints(1).has(I(5, 5)));
        assert('白には結界なし', shimenawaPoints(2).size === 0);
        assert('白は結界に侵入できない', isValidPlacement([{ x: 5, y: 5 }], 2) === false);
        assert('白は結界外なら打てる', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        // 2連は注連縄でない
        board.fill(0);
        board[I(4, 4)] = 1; board[I(5, 4)] = 1;
        assert('2連は結界を張らない', shimenawaPoints(1).size === 0);
        assert('2連の隣は打てる', isValidPlacement([{ x: 4, y: 5 }], 2) === true);
    `,
};
