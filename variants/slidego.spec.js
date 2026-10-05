// SLIDEGO — 滑走碁: 盤は斜めの滑り台。全石が右下へ1マスずつ滑る
const K = require('../gen_kit.js');
module.exports = {
    file: 'slidego.html',
    en: 'SLIDEGO',
    jp: '滑走碁',
    prefix: 'slidego',
    desc: '盤は右下がりの滑り台。全石が1手ごとに斜め1マス滑って谷に集まる。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('SLIDEGO', '滑走碁', 'slidego'),
        K.params([
            { key: 'slide_interval', label: '滑走の間隔', min: 1, max: 5, def: 1, unit: '手ごと' },
        ]),
        // 着手ごと、全石が右下へ1マス滑る (連鎖的に滑る雪崩式)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 滑走ルール: 全石が右下へ1マス滑る。下流から処理するので連鎖的に滑り落ちる
            if (history.length % (P('slide_interval') || 1) === 0) {
                const N = BOARD_SIZE;
                for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) {
                    const i = y * N + x;
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const nx = x + 1, ny = y + 1;
                    if (nx >= N || ny >= N) continue;
                    if (board[ny * N + nx] === 0) {
                        board[ny * N + nx] = board[i]; board[i] = 0;
                        fxSlide(i, ny * N + nx, 380); // 滑走経路を可視化
                    }
                }
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


            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 斜面の描画: 右下へ暗くなる傾斜
        K.CUE_GRID(`            // 斜面: 右下へ向かう淡い傾斜シェード
            {
                ctx.save();
                const w = (BOARD_SIZE - 1) * cellSize;
                const g = ctx.createLinearGradient(padding, padding, padding + w, padding + w);
                g.addColorStop(0, 'rgba(255,255,255,0.06)');
                g.addColorStop(1, 'rgba(0,0,0,0.10)');
                ctx.fillStyle = g;
                ctx.fillRect(padding - cellSize * 0.5, padding - cellSize * 0.5, w + cellSize, w + cellSize);
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.4);
                ctx.font = 'bold ' + Math.round(cellSize * 0.5) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('↘', padding - cellSize * 0.6, padding - cellSize * 0.6);
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '盤は右下がりの滑り台: 着手ごとに全石が右下へ1マス滑り落ちる。',
            '右端や下端に達した石は壁に止まる。連鎖的に滑るので石はどんどん谷に集まる。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('石は右下へ滑る', board[5 * BOARD_SIZE + 5] === 1 && board[4 * BOARD_SIZE + 4] === 0);
        board.fill(0);
        board[0 * BOARD_SIZE + 0] = 1;
        board[1 * BOARD_SIZE + 1] = 2; // 斜めに並ぶ2石
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('連鎖的に滑り落ちる', board[1 * BOARD_SIZE + 1] === 1 && board[2 * BOARD_SIZE + 2] === 2 && board[0] === 0);
        board.fill(0);
        board[(BOARD_SIZE - 1) * BOARD_SIZE + BOARD_SIZE - 1] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('隅の石は止まる', board[(BOARD_SIZE - 1) * BOARD_SIZE + BOARD_SIZE - 1] === 1);
    `,
};
