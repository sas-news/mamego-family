// RIVERBRIDGEGO — 橋渡碁: 盤は川に分断され、3本の橋の点だけが両岸を結ぶ
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
    file: 'riverbridgego.html',
    en: 'RIVERBRIDGEGO',
    jp: '橋渡碁',
    prefix: 'riverbridgego',
    desc: '盤を3行の川が分断。3本の橋だけが両岸を結ぶ。',
    kind: 'stone',
    icon: 'riverbridgego',
    spec: [
        ...K.rb('RIVERBRIDGEGO', '橋渡碁', 'riverbridgego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 川: 中央3行。橋は3列に架かる
        const RIVER_Y0 = Math.floor(BOARD_SIZE / 2) - 1;
        const BRIDGE_X = [Math.floor(BOARD_SIZE * 0.18), Math.floor(BOARD_SIZE / 2), BOARD_SIZE - 1 - Math.floor(BOARD_SIZE * 0.18)];
        const BRIDGE_SET = new Set();
        BRIDGE_X.forEach(bx => {
            for (let y = RIVER_Y0; y < RIVER_Y0 + 3; y++) BRIDGE_SET.add(y * BOARD_SIZE + bx);
        });
        function isRiver(x, y) {
            if (y < RIVER_Y0 || y >= RIVER_Y0 + 3) return false;
            return !BRIDGE_SET.has(y * BOARD_SIZE + x);
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (isRiver(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        K.CUE_GRID(`            // 橋: 木の橋桁と欄干
            {
                ctx.save();
                BRIDGE_X.forEach(bx => {
                    for (let y = RIVER_Y0; y < RIVER_Y0 + 3; y++) {
                        const cx = padding + bx * cellSize, cy = padding + y * cellSize;
                        ctx.fillStyle = 'rgba(146, 104, 56, 0.55)';
                        ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                        ctx.strokeStyle = 'rgba(80, 54, 26, 0.7)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.04);
                        ctx.beginPath();
                        ctx.moveTo(cx - cellSize * 0.5, cy); ctx.lineTo(cx + cellSize * 0.5, cy);
                        ctx.stroke();
                    }
                    // 欄干
                    const x0 = padding + bx * cellSize - cellSize * 0.42;
                    const x1 = padding + bx * cellSize + cellSize * 0.42;
                    const y0 = padding + RIVER_Y0 * cellSize - cellSize * 0.4;
                    const y1 = padding + (RIVER_Y0 + 2) * cellSize + cellSize * 0.4;
                    ctx.strokeStyle = 'rgba(64, 42, 20, 0.9)';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.moveTo(x0, y0); ctx.lineTo(x0, y1);
                    ctx.moveTo(x1, y0); ctx.lineTo(x1, y1);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            橋渡碁: 盤を3行の川が分断。3本の橋だけが両岸を結ぶ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の中央3行は流れの速い川 (着手不可・呼吸なし)。',
            '川に架かる3本の橋だけが両岸を結ぶ — 連も呼吸も橋経由。',
            '橋を押さえる側が盤を制する。橋の上の石は交通の要衝。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const mid = Math.floor(BOARD_SIZE / 2);
        assert('橋が3本ある', BRIDGE_SET.size === 9);
        assert('川は壁', board[I(0, mid)] === 3);
        const bx = BRIDGE_X[0];
        assert('橋は通行可', board[I(bx, mid)] !== 3 && isValidPlacement([{ x: bx, y: mid }], 1) === true);
        // 橋経由で両岸が繋がる
        board[I(bx, mid - 1)] = 1; board[I(bx, mid)] = 1; board[I(bx, mid + 1)] = 1;
        const libs = getLiberties(board, I(bx, mid));
        assert('橋の連は呼吸できる', libs > 0);
    `,
};
