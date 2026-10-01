// SPOKEGO — 車軸碁: 中心から放射する8本の筋のみ着手可能 (縦横・斜めの4直線)
const K = require('../gen_kit.js');
module.exports = {
    file: 'spokego.html',
    en: 'SPOKEGO',
    jp: '車軸碁',
    prefix: 'spokego',
    desc: '中心から放射する8本の筋のみ着手可能。車輪の軸上での接近戦。',
    kind: 'stone',
    icon: 'spokego',
    spec: [
        ...K.rb('SPOKEGO', '車軸碁', 'spokego'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2, def: 0.9, step: 0.1, hint: '交点数の倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        const SPOKE_C = (BOARD_SIZE - 1) / 2;
        function isSpokeCell(x, y) {
            return x === SPOKE_C || y === SPOKE_C || x === y || x + y === BOARD_SIZE - 1;
        }`],
        // 車軸以外は深淵
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let i = 0; i < board.length; i++) {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                if (!isSpokeCell(x, y)) board[i] = 3;
            }`],
        // 車軸に沿った近傍 (筋の方向のみ連結・呼吸する)
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];
            // そのマスが乗る車軸の方向ごとに、筋に沿った隣を返す
            const dirs = [];
            if (x === SPOKE_C) dirs.push([0, -1], [0, 1]);       // 縦軸
            if (y === SPOKE_C) dirs.push([-1, 0], [1, 0]);       // 横軸
            if (x === y) dirs.push([-1, -1], [1, 1]);            // 斜め軸 \
            if (x + y === BOARD_SIZE - 1) dirs.push([1, -1], [-1, 1]); // 斜め軸 /
            dirs.forEach(([dx, dy]) => {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && isSpokeCell(nx, ny)) {
                    neighbors.push(ny * BOARD_SIZE + nx);
                }
            });
            return neighbors;
        }`],
        // 深淵の描画
        [K.ONE, K.COVERED_ANCHOR, K.voidDraw(`'rgba(30,27,25,0.82)'`)],
        // 車軸とハブの描画
        ...K.STONE_MARKS_SPEC(`            {
                const cc = padding + SPOKE_C * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(180,83,9,0.55)';
                ctx.beginPath();
                ctx.arc(cc, cc, cellSize * 0.30, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(120,53,15,0.8)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                ctx.stroke();
                ctx.restore();
            }`),
        // 深淵セルを死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_ALGO, `            車軸碁: 中心ハブから放射する8本の筋のみ着手可能。軸上での接近戦<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手できるのは中心ハブから放射する縦横・斜めの8筋 (車軸) のみ。',
            '軸の交差する中心ハブが最重要拠点。幅1マスの細い戦線で食い合う。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
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
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = (BOARD_SIZE - 1) / 2;
        assert('車軸上は打てる', isValidPlacement([{ x: c, y: 0 }], 1) === true);
        assert('車軸外は打てない', isValidPlacement([{ x: 1, y: 2 }], 1) === false);
        assert('斜めの車軸も打てる', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
        assert('車軸外のマスは深淵', board[I(1, 2)] === 3);
        assert('中心ハブは打てる', isValidPlacement([{ x: c, y: c }], 1) === true);
    `,
};
