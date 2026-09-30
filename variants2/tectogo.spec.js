// TECTOGO — 地殻碁: 左右のプレートが逆方向にずれ、端の石は沈み込む
const K = require('../gen_kit.js');
module.exports = {
    file: 'tectogo.html',
    en: 'TECTOGO',
    jp: '地殻碁',
    prefix: 'tectogo',
    desc: '盤の左右半分が逆方向にずれる地殻断層。端の石は沈没してアゲハマに。',
    kind: 'stone',
    spec: [
        ...K.rb('TECTOGO', '地殻碁', 'tectogo'),
        // 着手ごと、左半分は下・右半分は上へ1マスずれ、盤外の石は沈没
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 地殻ルール: 中央の断層を境に左プレートは下・右プレートは上へ1マスずれる。
            //             端から沈み込んだ石は相手のアゲハマになる。
            {
                const N = BOARD_SIZE, c = Math.floor(N / 2);
                const lost = { 1: 0, 2: 0 };
                // 左プレート: 下へ (下から処理)
                for (let y = N - 1; y >= 0; y--) for (let x = 0; x < c; x++) {
                    const i = y * N + x;
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    if (y === N - 1) { lost[board[i]]++; board[i] = 0; continue; }
                    if (board[i + N] === 0) { board[i + N] = board[i]; board[i] = 0; }
                }
                // 右プレート: 上へ (上から処理)
                for (let y = 0; y < N; y++) for (let x = c; x < N; x++) {
                    const i = y * N + x;
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    if (y === 0) { lost[board[i]]++; board[i] = 0; continue; }
                    if (board[i - N] === 0) { board[i - N] = board[i]; board[i] = 0; }
                }
                captures[1] += lost[2];
                captures[2] += lost[1];
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
        // 断層線とずれ方向の矢印
        K.CUE_GRID(`            // 地殻断層: 中央のずれ線と上下の流れ矢印
            {
                const c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.5);
                ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                const fx = padding + (c - 0.5) * cellSize;
                ctx.setLineDash([cellSize * 0.25, cellSize * 0.18]);
                ctx.beginPath();
                ctx.moveTo(fx, padding - cellSize * 0.5);
                ctx.lineTo(fx, padding + (BOARD_SIZE - 0.5) * cellSize);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.55);
                ctx.font = 'bold ' + Math.round(cellSize * 0.5) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let y = 0; y < BOARD_SIZE; y += 2) {
                    ctx.fillText('▼', padding + Math.max(0, c - 2) * cellSize, padding + y * cellSize);
                    ctx.fillText('▲', padding + Math.min(BOARD_SIZE - 1, c + 1) * cellSize, padding + y * cellSize);
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の中央に地殻断層がある: 左半分の石は1手ごとに下へ、右半分は上へずれていく。',
            '盤端から沈み込んだ石は相手のアゲハマになる。断層を越えて戦線がねじれる。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        const c = Math.floor(BOARD_SIZE / 2);
        board.fill(0);
        executeMove({ cells: [{ x: 1, y: 4 }] }, 1);
        assert('左プレートは下へずれる', board[5 * BOARD_SIZE + 1] === 1 && board[4 * BOARD_SIZE + 1] === 0);
        executeMove({ cells: [{ x: c + 1, y: 4 }] }, 2);
        assert('右プレートは上へずれる', board[3 * BOARD_SIZE + c + 1] === 2);
        board.fill(0);
        board[(BOARD_SIZE - 1) * BOARD_SIZE + 1] = 1;
        const w0 = captures[2];
        executeMove({ cells: [{ x: c + 1, y: 5 }] }, 2);
        assert('下端の石は沈没してアゲハマ', board[(BOARD_SIZE - 1) * BOARD_SIZE + 1] === 0 && captures[2] === w0 + 1);
    `,
};
