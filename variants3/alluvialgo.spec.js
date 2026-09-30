// ALLUVIALGO — 扇状碁: 盤は扇状地。扇央は豊か(+1呼吸)、扇外の荒れ地は痩せる(-1呼吸)
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
    file: 'alluvialgo.html',
    en: 'ALLUVIALGO',
    jp: '扇状碁',
    prefix: 'alluvialgo',
    desc: '扇状地の盤。扇央は豊か(+1呼吸)、扇外の荒れ地は痩せる(-1呼吸)。',
    kind: 'stone',
    icon: 'alluvialgo',
    spec: [
        ...K.rb('ALLUVIALGO', '扇状碁', 'alluvialgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 扇状地: 扇頂(上辺中央)から扇状に広がる土壌。+1=扇央(豊か) -1=扇外(痩せ地)
        let SOIL = new Int8Array(BOARD_SIZE * BOARD_SIZE);
        function rebuildSoil() {
            SOIL = new Int8Array(BOARD_SIZE * BOARD_SIZE);
            const c = (BOARD_SIZE - 1) / 2;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const i = y * BOARD_SIZE + x;
                const d = Math.abs(x - c) + y;
                if (d <= BOARD_SIZE * 0.36) SOIL[i] = 1;
                else if (Math.abs(x - c) > (y + 1) * 0.95) SOIL[i] = -1;
            }
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            rebuildSoil();`],
        // 呼吸判定に土壌を反映 (捕獲側)
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        liberties += SOIL[curr]; // 扇央+1 / 扇外-1
                    }

                    if (liberties <= 0) {`],
        // 呼吸判定に土壌を反映 (呼吸数側)
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                liberties += SOIL[curr]; // 扇央+1 / 扇外-1
            }
            return liberties;`],
        // 扇状地の描画 (土壌グラデーション)
        K.CUE_GRID(`            // 扇状地: 扇央=肥えた緑、扇外=痩せた黄土
            {
                ctx.save();
                const c0 = (BOARD_SIZE - 1) / 2;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = y * BOARD_SIZE + x;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    if (SOIL[i] === 1) {
                        ctx.fillStyle = 'rgba(96,165,80,0.22)';
                        ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    } else if (SOIL[i] === -1) {
                        ctx.fillStyle = 'rgba(168,128,62,0.20)';
                        ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    }
                }
                // 扇縁の輪郭線
                ctx.strokeStyle = 'rgba(96,130,80,0.55)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.beginPath();
                ctx.moveTo(padding + c0 * cellSize, padding);
                ctx.lineTo(padding, padding + (BOARD_SIZE - 1) * cellSize);
                ctx.moveTo(padding + c0 * cellSize, padding);
                ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize, padding + (BOARD_SIZE - 1) * cellSize);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            扇状碁: 盤は扇状地。扇央(緑)は豊かで+1呼吸、扇外(黄土)は痩せて-1呼吸<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は上辺中央を扇頂とする扇状地。扇央 (緑地) の石は呼吸点+1の肥えた土壌。',
            '扇の外側 (黄地) は痩せ地で呼吸点-1。隅は特に脆い。',
            '扇央を制して根を張るか、痩せ地の敵を攻めるか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const c = (BOARD_SIZE - 1) / 2;
        assert('扇央は+1', SOIL[c] === 1);
        assert('扇外は-1', SOIL[BOARD_SIZE + 0] === -1);
        assert('扇内中程は通常', SOIL[6 * BOARD_SIZE + 6] === 0);
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[c] = 1;
        assert('扇央の石は呼吸+1', getLiberties(board, c) === 4);
        board.fill(0);
        board[0] = 1; // 隅 (0,0) は扇外の痩せ地
        assert('扇外の石は呼吸-1', getLiberties(board, 0) === 1);
    `,
};
