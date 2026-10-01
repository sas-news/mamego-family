// SLUICEGO — 水門碁: 盤中央を水路が走る。8手ごとに水門が開き、水路の石が下流へ流される
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
    file: 'sluicego.html',
    en: 'SLUICEGO',
    jp: '水門碁',
    prefix: 'sluicego',
    desc: '中央の水路を8手ごとの放水が洗う。水路の石は下流へ流される。',
    kind: 'stone',
    icon: 'sluicego',
    spec: [
        ...K.rb('SLUICEGO', '水門碁', 'sluicego'),
        K.params([
            { key: 'flush_interval', label: '放水の間隔', min: 2, max: 20, def: 8, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 水路: 中央1行が西→東へ流れる用水路 (着手可・呼吸も通常)
        const SLUICE_Y = Math.floor(BOARD_SIZE / 2);`],
        // 8手ごとの放水: 水路の石を下流 (+x) へ1マス流す。端からは海に流れ出る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 水門碁: 8手ごとに放水 — 水路の石が下流へ流れる
            if (history.length > 0 && history.length % (P('flush_interval') || 8) === 0) {
                let drifted = false;
                for (let x = BOARD_SIZE - 1; x >= 0; x--) {
                    const i = SLUICE_Y * BOARD_SIZE + x;
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    const ni = i + 1;
                    if (x === BOARD_SIZE - 1) {
                        board[i] = 0; // 河口から海へ流出
                        fxSplash(i, '#38bdf8', 10);
                        drifted = true;
                    } else if (board[ni] === 0) {
                        board[ni] = v;
                        board[i] = 0;
                        fxSlide(i, ni, 420);
                        drifted = true;
                    }
                }
                if (drifted) {
                    fxText(SLUICE_Y * BOARD_SIZE, '放水!', '#38bdf8', 1100);
                    fxShake(4, 260);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 水路の描画: 中央行を青く、下流方向の矢印
        K.CUE_GRID(`            // 水路: 青い帯と下流へ向かう波の筋
            {
                ctx.save();
                const cy = padding + SLUICE_Y * cellSize;
                const g = ctx.createLinearGradient(0, cy - cellSize * 0.5, 0, cy + cellSize * 0.5);
                g.addColorStop(0, 'rgba(30, 120, 190, 0.35)');
                g.addColorStop(0.5, 'rgba(80, 180, 240, 0.42)');
                g.addColorStop(1, 'rgba(30, 120, 190, 0.35)');
                ctx.fillStyle = g;
                ctx.fillRect(padding - cellSize * 0.5, cy - cellSize * 0.5, cellSize * BOARD_SIZE, cellSize);
                ctx.strokeStyle = 'rgba(190, 230, 255, 0.8)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                for (let x = 0; x < BOARD_SIZE; x += 2) {
                    const ax = padding + x * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(ax - cellSize * 0.2, cy - cellSize * 0.2);
                    ctx.lineTo(ax + cellSize * 0.2, cy);
                    ctx.lineTo(ax - cellSize * 0.2, cy + cellSize * 0.2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'放水まで ' + ((P('flush_interval') || 8) - history.length % (P('flush_interval') || 8)) + '手'`),
        [K.ONE, K.INFO_ALGO, `            水門碁: 中央の水路を8手ごとの放水が洗う。水路の石は下流へ流される<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の中央1行は東へ流れる水路 (着手も呼吸も通常通り)。',
            '8手ごとに水門が開き放水 — 水路の石は全て1マス下流へ流される。',
            '河口 (右端) から押し出された石は海に流れて失われる。両者同じ周期で効く。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('水路は中央行', SLUICE_Y === Math.floor(BOARD_SIZE / 2));
        // 水路の石が放水で下流へ流れる
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[I(3, SLUICE_Y)] = 1;
        for (let k = 0; k < 7; k++) executeMove({ cells: [{ x: k % BOARD_SIZE, y: BOARD_SIZE - 1 }] }, k % 2 === 0 ? 1 : 2);
        executeMove({ cells: [{ x: 7, y: BOARD_SIZE - 1 }] }, 1); // 8手目 → 放水
        assert('放水で石が下流へ', board[I(4, SLUICE_Y)] === 1 && board[I(3, SLUICE_Y)] === 0);
        // 河口の石は海に流される
        board.fill(0); history.length = 0;
        board[I(BOARD_SIZE - 1, SLUICE_Y)] = 2;
        for (let k = 0; k < 8; k++) executeMove({ cells: [{ x: k % BOARD_SIZE, y: BOARD_SIZE - 1 }] }, 1);
        assert('河口の石は海へ流出', board[I(BOARD_SIZE - 1, SLUICE_Y)] === 0);
    `,
};
