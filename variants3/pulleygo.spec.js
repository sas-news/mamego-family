// PULLEYGO — 滑車碁: 置いた石の縦軸ミラー位置にある敵石が1段下がる。盤から落ちれば捕獲
const K = require('../gen_kit.js');
module.exports = {
    file: 'pulleygo.html',
    en: 'PULLEYGO',
    jp: '滑車碁',
    prefix: 'pulleygo',
    desc: '縦軸で鏡映した位置の敵石が1段下がる滑車。盤の下に落ちた石はこちらのアゲハマになる。',
    kind: 'stone',
    icon: 'pulleygo',
    spec: [
        ...K.rb('PULLEYGO', '滑車碁', 'pulleygo'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 滑車ルール: 縦軸ミラーの敵石が1段下がる。最下段から落ちたら捕獲
            {
                const px = move.cells[0].x, py = move.cells[0].y;
                const mx = BOARD_SIZE - 1 - px;
                const mi = py * BOARD_SIZE + mx;
                if (board[mi] === opponent) {
                    const ny = py + 1;
                    if (ny >= BOARD_SIZE) {
                        // 盤から落下 → 捕獲
                        board[mi] = 0; captures[player]++;
                        fxBurst(mi, '#fbbf24', 8, 1.6);
                        fxText(mi, '落下!', '#d97706', 1200);
                        cleanUpPieces();
                    } else {
                        const ni = ny * BOARD_SIZE + mx;
                        if (board[ni] === 0) {
                            board[ni] = opponent; board[mi] = 0;
                            fxSlide(mi, ni, 300);
                            cleanUpPieces();
                        }
                    }
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        // 縦軸の滑車軸を描画
        K.CUE_STARS(`            // 滑車の軸 (縦中央線)
            {
                const ax = padding + (BOARD_SIZE - 1) * cellSize / 2;
                ctx.save();
                ctx.strokeStyle = 'rgba(217,119,6,0.4)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.setLineDash([cellSize * 0.16, cellSize * 0.12]);
                ctx.beginPath();
                ctx.moveTo(ax, padding - cellSize * 0.5);
                ctx.lineTo(ax, padding + (BOARD_SIZE - 0.5) * cellSize);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手すると、その縦軸ミラー位置にある敵石が1段下がる (滑車)。',
            '最下段からさらに下がった石は盤から落ち、着手側のアゲハマになる。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const N = BOARD_SIZE;
        board[3 * N + (N - 1 - 2)] = 2; // (N-3,3) に白 (ミラー: (2,3))
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1);
        assert('ミラーの敵石が1段下がる', board[4 * N + (N - 3)] === 2 && board[3 * N + (N - 3)] === 0);
        // 落下捕獲: 最下段の敵のミラーに着手
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[(N - 1) * N + (N - 3)] = 2; // 最下段に白
        executeMove({ cells: [{ x: 2, y: N - 1 }] }, 1);
        assert('最下段の敵は落下して捕獲', board[(N - 1) * N + (N - 3)] === 0 && captures[1] === 1);
    `,
};
