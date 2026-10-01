// PIERGO — 橋脚碁: 盤は橋の上。橋脚の点の石は河床に根を張り、どんなに囲まれても取られない
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'piergo.html',
    en: 'PIERGO',
    jp: '橋脚碁',
    prefix: 'piergo',
    desc: '橋の上の碁。橋脚の点の石は絶対に取られない強い足場。',
    kind: 'stone',
    icon: 'piergo',
    spec: [
        ...K.rb('PIERGO', '橋脚碁', 'piergo'),
        K.params([{ key: 'pier_pos', label: '橋脚の位置', min: 0.1, max: 0.5, step: 0.02, def: 0.28, hint: '盤辺からの比率' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' }]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 橋脚: 川面に立つ5本の脚。その点の石は根を張って取られない
        let PIER_SET = new Set();
        function rebuildPier() {
            PIER_SET = new Set();
            const m = Math.floor(BOARD_SIZE / 2);
            const q = Math.max(1, Math.round(BOARD_SIZE * (P('pier_pos') || 0.28)));
            [[q, m], [m, q], [m, BOARD_SIZE - 1 - q], [BOARD_SIZE - 1 - q, m]]
                .forEach(([x, y]) => PIER_SET.add(y * BOARD_SIZE + x));
        }
        rebuildPier();
        function onVariantParam() { rebuildPier(); }`],
        // 橋脚の石は取られない — 捕獲走査から除外 (連もそこで切れる)
        [K.ONE, `                if (boardState[i] === player && !visited[i]) {`,
`                if (boardState[i] === player && !visited[i] && !PIER_SET.has(i)) {`],
        [K.ALL, `} else if (boardState[n] === player && !visited[n]) {`,
`} else if (boardState[n] === player && !visited[n] && !PIER_SET.has(n)) {`],
        // 橋脚の描画: 石の脚と水面の縞
        K.CUE_GRID(`            // 橋脚: 水面上の脚柱
            {
                ctx.save();
                PIER_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(120, 84, 44, 0.45)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    ctx.fillStyle = 'rgba(72, 52, 30, 0.85)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(40, 28, 16, 0.9)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            橋脚碁: 橋脚の点の石は取られない強い足場<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は川に架かる橋の上。4つの橋脚の点だけが河床に根を張る強い足場。',
            '橋脚の上の石は絶対に取られない (連もそこで切れる)。',
            '足場を早く押さえた側が、取り合いで大きく有利になる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('橋脚が4本ある', PIER_SET.size === 4);
        const pi = [...PIER_SET][0];
        const px = pi % BOARD_SIZE, py = (pi / BOARD_SIZE) | 0;
        board.fill(0);
        // 橋脚の石を敵で取り囲んでも取られない
        board[pi] = 1;
        getNeighbors(pi).forEach(n => { board[n] = 2; });
        assert('橋脚の石は囲まれても死なない', getCapturedStones(board, 1).length === 0);
        // 橋脚でない石は普通に取られる (対照)
        board.fill(0);
        const c2 = I(1, 1); board[c2] = 1;
        board[I(0, 1)] = 2; board[I(2, 1)] = 2; board[I(1, 0)] = 2; board[I(1, 2)] = 2;
        assert('橋脚でない石は取られる', getCapturedStones(board, 1).includes(c2));
        assert('橋脚には着手できる', board.fill(0) && isValidPlacement([{ x: px, y: py }], 1) === true);
    `,
};
