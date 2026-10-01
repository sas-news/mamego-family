// CAROMGO — 撞球碁: 石はビリヤード球。衝突で敵球をポケットへ落とす (盤端と角がポケット)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'caromgo.html',
    en: 'CAROMGO',
    jp: '撞球碁',
    prefix: 'caromgo',
    desc: '石はビリヤード球。衝突で敵球を転がし、ポケット (盤端) に落とす。',
    kind: 'stone',
    icon: 'caromgo',
    spec: [
        ...K.rb('CAROMGO', '撞球碁', 'caromgo'),
        K.params([
            { key: 'pocket_zone', label: 'ポケットの幅', min: 1, max: 3, def: 1, hint: '盤端からこの幅に達すればポケットイン' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        // 衝突: 隣の敵球を直線に転がし、盤端 (ポケット) に落とす
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 撞球: 隣の敵球をそのままの方向へ転がし、盤端に達すればポケットイン
            {
                const bc = move.cells[0];
                let sunk = 0;
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    const ex = bc.x + dx, ey = bc.y + dy;
                    if (ex < 0 || ey < 0 || ex >= BOARD_SIZE || ey >= BOARD_SIZE) continue;
                    const ei = ey * BOARD_SIZE + ex;
                    if (board[ei] !== opponent) continue;
                    // 同じ方向へ転がる (直線)
                    let tx = ex, ty = ey, stopped = false;
                    for (let d = 1; d < BOARD_SIZE; d++) {
                        const nx = tx + dx, ny = ty + dy;
                        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) break; // ポケットイン
                        if (board[ny * BOARD_SIZE + nx] !== 0) { stopped = true; break; } // クッション (石) で停止
                        tx = nx; ty = ny;
                    }
                    const pz = Math.max(1, P('pocket_zone') || 1);
                    const reachedEdge = tx < pz || ty < pz || tx >= BOARD_SIZE - pz || ty >= BOARD_SIZE - pz;
                    if (reachedEdge && !stopped) {
                        board[ei] = 0;
                        captures[player]++;
                        sunk++;
                        fxBurst(ei, '#f43f5e', 10, 1.8);
                    } else if (tx !== ex || ty !== ey) {
                        const ti2 = ty * BOARD_SIZE + tx;
                        board[ti2] = board[ei];
                        board[ei] = 0;
                        fxSlide(ei, ti2, 420);
                    }
                }
                if (sunk > 0) {
                    const ci = bc.y * BOARD_SIZE + bc.x;
                    fxText(ci, 'ポケットイン!', '#fb7185', 1100);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // ポケット: 4隅を黒穴で描く
        K.CUE_GRID(`            // ポケット: 4隅に黒い穴を描く
            {
                ctx.save();
                const pockets = [[0, 0], [BOARD_SIZE - 1, 0], [0, BOARD_SIZE - 1], [BOARD_SIZE - 1, BOARD_SIZE - 1]];
                pockets.forEach(([px, py]) => {
                    const cx = padding + px * cellSize, cy = padding + py * cellSize;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.42);
                    g.addColorStop(0, 'rgba(0,0,0,0.95)');
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'衝突: 敵球をポケットへ転がす'`),
        [K.ONE, K.INFO_ALGO, `            撞球碁: 隣の敵球を直線に転がし、盤端 (ポケット) に落とす<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石に隣接した敵球は、その方向のまま直線に転がされる。',
            '転がった球が盤端に達すれば「ポケットイン」= アゲハマ。途中で他球に当たれば停止する。',
            '4隅は大きなポケット。中央寄りは安全 — 両者同じ物理。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 白(4,4)の隣に黒(4,5) → 白は上へ転がり上端ポケットへ
        board[I(4, 4)] = 2;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('敵球がポケットに落ちる', board[I(4, 4)] === 0);
        assert('ポケットはアゲハマに', captures[1] === 1);
        // 転がり先に石があればそこで止まる
        board[I(7, 7)] = 2; board[I(7, 4)] = 1;
        executeMove({ cells: [{ x: 7, y: 8 }] }, 1);
        assert('石の前で転がり止まる', board[I(7, 7)] === 0 && board[I(7, 5)] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 3 }], 2) === true);
    `,
};
