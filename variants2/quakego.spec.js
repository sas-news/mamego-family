// QUAKEGO — 地震碁: 6手ごとに盤が揺れ、全石がランダム方向へ1マス散る
const K = require('../gen_kit.js');
module.exports = {
    file: 'quakego.html',
    en: 'QUAKEGO',
    jp: '地震碁',
    prefix: 'quakego',
    desc: '6手ごとに大地震。全石がバラバラの方向へ1マス散らばる。',
    kind: 'stone',
    spec: [
        ...K.rb('QUAKEGO', '地震碁', 'quakego'),
        // 6手ごとに地震: 全石がそれぞれ擬似ランダムな方向へ1マス散る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 地震ルール: 6手ごとに盤が揺れ、全石がバラバラの方向へ1マス散る
            if (history.length % 6 === 0) {
                const N = BOARD_SIZE;
                const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
                const scat = []; // 散る移動を先に全部決めてから適用 (1手1マス)
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const d = dirs[(i * 7 + history.length) % 4]; // 位置+手数で決まる揺れ方向
                    const x = i % N, y = Math.floor(i / N);
                    const nx = x + d[0], ny = y + d[1];
                    if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;
                    const j = ny * N + nx;
                    if (board[j] === 0) scat.push([i, j]);
                }
                // 散る移動を実際にアニメ化: 出発点→到着点のスライドで「どこへ飛んだか」が見える
                scat.forEach(([i, j]) => {
                    if (board[j] === 0) { board[j] = board[i]; board[i] = 0; fxSlide(i, j, 380); }
                });
                // 地震自体: 盤面全体が揺れ、中心に警告文字
                fxShake(7, 380);
                fxText((((N - 1) >> 1) * N + ((N - 1) >> 1)), '地震!', '#fdba74', 800);
                // 変動後処理: 呼吸のなくなった連を両色について除去
                for (const pl of [1, 2]) {
                    const dead = getCapturedStones(board, pl);
                    if (dead.length) {
                        dead.forEach(i => { board[i] = 0; });
                        captures[pl === 1 ? 2 : 1] += dead.length;
                    }
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'地震まで ' + (6 - history.length % 6) + ' 手'`),
        // 地割れの描画
        K.CUE_GRID(`            // 地割れ: 盤を走るジグザグの裂け目
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.18);
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                const w = (BOARD_SIZE - 1) * cellSize;
                for (let k = 0; k < 3; k++) {
                    const y0 = padding + ((k * 4 + 1) % BOARD_SIZE) * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(padding - cellSize * 0.4, y0);
                    for (let x = 0; x <= BOARD_SIZE; x++) {
                        ctx.lineTo(padding + (x - 0.5) * cellSize, y0 + ((x + k) % 2 ? 1 : -1) * cellSize * 0.3);
                    }
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '6手ごとに大地震が起き、全石がそれぞれバラバラの方向へ1マス散らされる。',
            '揺れで連が分断され、せっかくの包囲も崩れる。次の地震は右上のチップで確認。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('地震前は動かない', board[4 * BOARD_SIZE + 4] === 1);
        // 手数を5手進めて6手目で地震を起こす
        const cells = [[8, 8], [2, 7], [7, 2], [9, 9], [3, 10]];
        for (let k = 0; k < 5; k++) executeMove({ cells: [{ x: cells[k][0], y: cells[k][1] }] }, k % 2 + 1);
        assert('6手目の地震で黒が散る', board[4 * BOARD_SIZE + 4] === 0);
        // 地震の移動先は位置と手数で決まる: idx=4*N+4, dir=dirs[(idx*7+6)%4]=左
        assert('散り先は決定論的 (左へ)', board[4 * BOARD_SIZE + 3] === 1);
        board.fill(0);
        assert('盤はリセットできる', board.every(v => v === 0));
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
