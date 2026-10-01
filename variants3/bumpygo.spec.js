// BUMPYGO — 凸凹碁: 盤に起伏がある。着いた石は低い隣接点へ転がり落ちる
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'bumpygo.html',
    en: 'BUMPYGO',
    jp: '凸凹碁',
    prefix: 'bumpygo',
    desc: '起伏のある盤。着いた石は低い方へ転がり、窪地に落ちると潰れることも。',
    kind: 'stone',
    icon: 'bumpygo',
    spec: [
        ...K.rb('BUMPYGO', '凸凹碁', 'bumpygo'),
        K.params([
            { key: 'height_max', label: '起伏の最大高さ', min: 3, max: 8, def: 5, hint: '高さは0〜この値-1' },
            { key: 'roll_scale', label: '転がり上限 (盤の倍数)', min: 4, max: 40, def: 13, hint: '13路で13 (元は盤の2乗ステップ)' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.9, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 起伏: 各交点の高さ 0(窪)〜4(峰) を決定的に持つ
        const BUMP_H = (x, y) => (x * 31 + y * 17 + ((x * y) % 7) * 5) % (P('height_max') || 5);`],
        // 着いた石は下り坂を転がる — 止まった先で再度取り判定
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 凸凹碁: 着いた石が低い方へ滑り落ちる
            {
                const p0 = move.cells[0];
                let cx = p0.x, cy = p0.y;
                let rolled = false;
                for (let guard = 0; guard < (P('roll_scale') || 13) * BOARD_SIZE; guard++) {
                    const here = BUMP_H(cx, cy);
                    let bx = -1, by = -1, bh = here;
                    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                        const nx = cx + dx, ny = cy + dy;
                        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return;
                        if (board[ny * BOARD_SIZE + nx] !== 0) return;
                        const h = BUMP_H(nx, ny);
                        if (h < bh) { bh = h; bx = nx; by = ny; }
                    });
                    if (bx < 0) break;
                    board[cy * BOARD_SIZE + cx] = 0;
                    board[by * BOARD_SIZE + bx] = player;
                    fxSlide(cy * BOARD_SIZE + cx, by * BOARD_SIZE + bx, 300);
                    cx = bx; cy = by; rolled = true;
                }
                if (rolled) {
                    const lastPc = pieces[pieces.length - 1];
                    if (lastPc && lastPc.cells.length === 1) lastPc.cells = [{ x: cx, y: cy }];
                    // 転がり止まった先で敵の取りを再判定
                    const got = getCapturedStones(board, opponent);
                    if (got.length) {
                        got.forEach(i => { board[i] = 0; });
                        captures[player] += got.length;
                        soundManager.playCapture();
                    }
                    // 窪地に落ちて呼吸ゼロなら転落死 (敵のアゲハマ)
                    if (board[cy * BOARD_SIZE + cx] === player && getLiberties(board, cy * BOARD_SIZE + cx) === 0) {
                        board[cy * BOARD_SIZE + cx] = 0;
                        captures[opponent]++;
                        fxText(cy * BOARD_SIZE + cx, '転落!', '#a8a29e', 1000);
                    }
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 起伏の描画: 高いほど暗い土色、低いほど明るい窪地
        K.CUE_GRID(`            // 起伏: 高い点ほど暗く、窪みは明るい色
            {
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const h = BUMP_H(x, y);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(90, 64, 38, ' + (h * 0.09) + ')';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    if (h === 0) {
                        ctx.strokeStyle = 'rgba(140, 180, 210, 0.6)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.04);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.16, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            凸凹碁: 起伏のある盤。着いた石は低い方へ転がり落ちる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の各交点には高さ (0〜4) がある。着いた石はより低い空き点へ転がり続ける。',
            '止まった地点で敵の連を取れる。取りの決着は転がり終わってから。',
            '窪み (高さ0) は落とし穴 — 呼吸ゼロに止まった石は転落死して相手のアゲハマになる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('高さは0〜4', (() => { for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) { const h = BUMP_H(x, y); if (h < 0 || h > 4) return false; } return true; })());
        // 高い点に着くと低い点へ転がる
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        let hx = -1, hy = -1;
        outer: for (let y = 1; y < BOARD_SIZE - 1; y++) for (let x = 1; x < BOARD_SIZE - 1; x++) {
            if (BUMP_H(x, y) >= 3) {
                for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                    if (BUMP_H(x + dx, y + dy) < BUMP_H(x, y)) { hx = x; hy = y; break outer; }
                }
            }
        }
        assert('転がれる起点がある', hx >= 0);
        executeMove({ cells: [{ x: hx, y: hy }] }, 1);
        assert('石は坂を転がり落ちる', board[I(hx, hy)] !== 1);
        const ended = board.some((v, i) => v === 1 && BUMP_H(i % BOARD_SIZE, (i / BOARD_SIZE) | 0) < BUMP_H(hx, hy));
        assert('着地は起点より低い (or 転落死)', ended || !board.includes(1));
    `,
};
