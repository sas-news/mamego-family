// PINGGO — 乒乓碁: 跳ね回るボール石が石を押し出す
const K = require('../gen_kit.js');
module.exports = {
    file: 'pinggo.html',
    en: 'PINGGO',
    jp: '乒乓碁',
    prefix: 'pinggo',
    desc: 'ボールが盤を跳ね回り、当たった石を1マス押し出して跳ね返る。',
    kind: 'stone',
    spec: [
        ...K.rb('PINGGO', '乒乓碁', 'pinggo'),
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
        let ballPos = 0, ballDx = 1, ballDy = 1; // ボールの位置と進行方向`],
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            ballPos = 0; ballDx = 1; ballDy = 1;`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 乒乓: ボールが1マス進み、石に当たれば押し出して跳ね返る
            {
                const bx = ballPos % BOARD_SIZE, by = Math.floor(ballPos / BOARD_SIZE);
                let nx = bx + ballDx, ny = by + ballDy;
                if (nx < 0 || nx >= BOARD_SIZE) ballDx = -ballDx;
                if (ny < 0 || ny >= BOARD_SIZE) ballDy = -ballDy;
                nx = bx + ballDx; ny = by + ballDy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                    const ni = ny * BOARD_SIZE + nx;
                    if (board[ni] === 1 || board[ni] === 2) {
                        const qx = nx + ballDx, qy = ny + ballDy;
                        if (qx >= 0 && qx < BOARD_SIZE && qy >= 0 && qy < BOARD_SIZE
                            && board[qy * BOARD_SIZE + qx] === 0) {
                            board[qy * BOARD_SIZE + qx] = board[ni];
                            board[ni] = 0;
                            cleanUpPieces();
                        }
                        ballDx = -ballDx; ballDy = -ballDy;
                    } else if (board[ni] === 0) {
                        ballPos = ni;
                    }
                }
            }

            turn = opponent;`],
        // ボール描画 (赤い小球)
        ...K.STONE_MARKS_SPEC(`            {
                const bx = ballPos % BOARD_SIZE, by = Math.floor(ballPos / BOARD_SIZE);
                const cx = padding + bx * cellSize, cy = padding + by * cellSize;
                ctx.save();
                ctx.fillStyle = '#e04030';
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.22, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.arc(cx - cellSize * 0.07, cy - cellSize * 0.08, cellSize * 0.07, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            乒乓碁: ボール石が盤を跳ね回り、当たった石を押し出す<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '毎手番、赤いボールが斜めに1マス進む。盤端で反射して跳ね回り続ける。',
            'ボールが石に当たると、その石を進行方向へ1マス押し出し、自身は跳ね返る。',
            '押し出しで連が切れたり呼吸点が変わったりする — 軌道を先読みしよう。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        ballPos = 0; ballDx = 1; ballDy = 0;
        board[1] = 2;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('ボールが石を押し出す', board[1] === 0 && board[2] === 2);
        assert('当たると跳ね返る', ballDx === -1);
        board.fill(0); pieces = [];
        ballPos = 0; ballDx = 1; ballDy = 0;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('空き地ならボールが進む', ballPos === 1);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
