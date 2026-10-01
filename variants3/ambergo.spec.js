// AMBERGO — 琥珀碁: 取られた石は消えず琥珀に封じ込められる。琥珀は二度と動かせない
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
    file: 'ambergo.html',
    en: 'AMBERGO',
    jp: '琥珀碁',
    prefix: 'ambergo',
    desc: '取られた石は消えず琥珀に封じ込められ、その場に永久の障害物として残る。',
    kind: 'stone',
    icon: 'ambergo',
    spec: [
        ...K.rb('AMBERGO', '琥珀碁', 'ambergo'),
        K.params([
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        // 取られた石は琥珀 (障害物) に封じ込められる — アゲハマは通常通り数える
        [K.ONE, `                captured.forEach(idx => board[idx] = 0);`,
`                captured.forEach(idx => {
                    board[idx] = 3;
                    fxGlow(idx, '#fbbf24', 900);
                });
                if (captured.length) fxText(captured[0], '封入!', '#fbbf24', 1100);`],
        // 琥珀の描画: 金色の樹脂に封じられた石
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(`                    // 琥珀: 金色の樹脂に封じられた石の影
                    const g = ctx.createRadialGradient(cx - cellSize * 0.08, cy - cellSize * 0.08, 0, cx, cy, cellSize * 0.75);
                    g.addColorStop(0, 'rgba(253, 224, 71, 0.9)');
                    g.addColorStop(0.6, 'rgba(217, 119, 6, 0.85)');
                    g.addColorStop(1, 'rgba(146, 64, 14, 0.9)');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    ctx.fillStyle = 'rgba(60, 30, 5, 0.55)';
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, cellSize * 0.17, cellSize * 0.13, 0.6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255, 240, 180, 0.5)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.3, cy - cellSize * 0.3);
                    ctx.lineTo(cx - cellSize * 0.08, cy - cellSize * 0.42);
                    ctx.stroke();`)],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_ALGO, `            琥珀碁: 取られた石は琥珀に封じ込められ障害物として残る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '取られた石は消えず、その場で琥珀 (金色の障害物) に封じ込められる。',
            'アゲハマは通常通り数えるが、取っても空地にはならない — 琥珀は永久に動かせない。',
            '取り合いのたびに盤が化石で埋まっていく。両者同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        // 取られた石は琥珀に封じ込められる
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[I(1, 1)] = 2;
        board[I(0, 1)] = 1; board[I(1, 0)] = 1; board[I(1, 2)] = 1;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1);
        assert('取った石は琥珀になる', board[I(1, 1)] === 3);
        assert('アゲハマは数える', captures[1] === 1);
        // 琥珀は着手不可の障害物
        assert('琥珀は置けない', isValidPlacement([{ x: 1, y: 1 }], 2) === false);
        assert('琥珀は呼吸点にならない', getLiberties(board, I(2, 1)) === 3);
    `,
};
