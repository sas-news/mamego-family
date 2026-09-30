// MAGNETGO — 磁石碁: 同色は引き寄せ合い、異色は隣接で反発する
const K = require('../gen_kit.js');
module.exports = {
    file: 'magnetgo.html',
    en: 'MAGNETGO',
    jp: '磁石碁',
    prefix: 'magnetgo',
    desc: '石は磁石。異色と隣接すると反発し、同色から2マスの石は引き寄せられる。',
    kind: 'stone',
    spec: [
        ...K.rb('MAGNETGO', '磁石碁', 'magnetgo'),
        // 着手ごと磁力解決: 異色隣接は反発、同色距離2は引寄
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 磁石ルール: 敵石と隣接する石は逆向きに1マス押し出され、
            //             同色からちょうど2マスの石は1マス引き寄せられる
            {
                const N = BOARD_SIZE;
                const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                const moved = new Set();
                // 反発
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if ((v !== 1 && v !== 2) || moved.has(i)) continue;
                    const x = i % N, y = Math.floor(i / N);
                    for (const [dx, dy] of dirs) {
                        const nx = x + dx, ny = y + dy;
                        if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;
                        const enemy = board[ny * N + nx];
                        if (enemy !== 1 && enemy !== 2) continue;
                        if (enemy === v) continue;
                        const tx = x - dx, ty = y - dy;
                        if (tx < 0 || tx >= N || ty < 0 || ty >= N) continue;
                        const t = ty * N + tx;
                        if (board[t] === 0) {
                            board[t] = v; board[i] = 0; moved.add(t);
                            fxSlide(i, t, 330); // 反発で離れる
                            break;
                        }
                    }
                }
                // 引寄
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    const x = i % N, y = Math.floor(i / N);
                    for (const [dx, dy] of dirs) {
                        const mx = x + dx, my = y + dy;
                        const fx = x + dx * 2, fy = y + dy * 2;
                        if (fx < 0 || fx >= N || fy < 0 || fy >= N) continue;
                        const mid = my * N + mx, far = fy * N + fx;
                        if (board[mid] === 0 && board[far] === v && !moved.has(far)) {
                            board[mid] = v; board[far] = 0; moved.add(mid);
                            fxSlide(far, mid, 330); // 同色に引き寄せられる
                            break;
                        }
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

            turn = opponent;`],
        // 磁力の表現: 異色隣接の間に反発ライン、同色距離2に引寄ライン
        K.CUE_STARS(`            // 磁力線: 反発=赤い二重線、引寄=青い破線
            {
                const N = BOARD_SIZE;
                ctx.save();
                ctx.lineWidth = Math.max(1, cellSize * 0.06);
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    const x = i % N, y = Math.floor(i / N);
                    // 右隣が敵なら反発ライン
                    if (x + 1 < N) {
                        const e = board[i + 1];
                        if ((e === 1 || e === 2) && e !== v) {
                            ctx.strokeStyle = 'rgba(239,68,68,0.55)';
                            const cx = padding + (x + 0.5) * cellSize, cy = padding + y * cellSize;
                            ctx.beginPath();
                            ctx.moveTo(cx - cellSize * 0.15, cy - cellSize * 0.3);
                            ctx.lineTo(cx + cellSize * 0.15, cy + cellSize * 0.3);
                            ctx.moveTo(cx + cellSize * 0.15, cy - cellSize * 0.3);
                            ctx.lineTo(cx - cellSize * 0.15, cy + cellSize * 0.3);
                            ctx.stroke();
                        }
                    }
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石は磁石: 敵石と隣接した石は反発して1マス離れる (行き場がなければ留まる)。',
            '同色からちょうど2マス離れた石は1マス引き寄せられる。磁力で連が伸縮する。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        board[4 * BOARD_SIZE + 4] = 1;
        board[4 * BOARD_SIZE + 5] = 2; // 敵同士が隣接
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('異色は反発して離れる', board[4 * BOARD_SIZE + 3] === 1 && board[4 * BOARD_SIZE + 4] === 0 && board[4 * BOARD_SIZE + 5] === 2);
        board.fill(0);
        board[2 * BOARD_SIZE + 2] = 1;
        board[2 * BOARD_SIZE + 4] = 1; // 同色が距離2
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('同色は引き寄せられる', board[2 * BOARD_SIZE + 2] === 1 && board[2 * BOARD_SIZE + 3] === 1 && board[2 * BOARD_SIZE + 4] === 0);
        board.fill(0);
        board[0 * BOARD_SIZE + 0] = 1;
        board[1 * BOARD_SIZE + 0] = 2;
        board[2 * BOARD_SIZE + 0] = 1; // 白を上下で挟んで退路を塞ぐ
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('押し出し先がなければ留まる', board[1 * BOARD_SIZE + 0] === 2);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
