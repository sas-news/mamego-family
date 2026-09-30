// ORBITALGO — 衛星碁: 着手ごと全石が自分の軌道リングを1マス公転する
const K = require('../gen_kit.js');
module.exports = {
    file: 'orbitalgo.html',
    en: 'ORBITALGO',
    jp: '衛星碁',
    prefix: 'orbitalgo',
    desc: '全石が衛星。着手ごとに自分の軌道リングを反時計回りに1マス公転する。',
    kind: 'stone',
    spec: [
        ...K.rb('ORBITALGO', '衛星碁', 'orbitalgo'),
        // 着手ごと、全石がそれぞれの軌道リング上を反時計回りに1マス公転
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 衛星ルール: 中心からの距離ごとの軌道リングを、全石が反時計回りに1マス進む
            {
                const N = BOARD_SIZE;
                const ring = (d) => {
                    const cs = [];
                    const lo = d, hi = N - 1 - d;
                    for (let x = lo; x <= hi; x++) cs.push([x, lo]);
                    for (let y = lo + 1; y <= hi; y++) cs.push([hi, y]);
                    for (let x = hi - 1; x >= lo; x--) cs.push([x, hi]);
                    for (let y = hi - 1; y > lo; y--) cs.push([lo, y]);
                    return cs;
                };
                const maxd = Math.floor((N - 1) / 2);
                for (let d = 0; d <= maxd; d++) {
                    const cs = ring(d);
                    const vals = cs.map(([x, y]) => board[y * N + x]);
                    cs.forEach(([x, y], k) => {
                        board[y * N + x] = vals[(k + 1) % vals.length];
                    });
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
        // 軌道の描画: 同心円の軌道線
        K.CUE_GRID(`            // 軌道: 中心を囲む淡い同心円
            {
                const c = (BOARD_SIZE - 1) / 2;
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.12);
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                for (let r = 1; r <= Math.ceil(c); r++) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, r * cellSize, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '全石は衛星: 着手ごとに中心からの距離ごとの軌道リングを反時計回りに1マス公転する。',
            '中心の石だけは動かない。同じ軌道上では追いつかれない。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('外の軌道を1歩公転', board[1 * BOARD_SIZE + 0] === 1 && board[0] === 0);
        board.fill(0);
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('中心の石は動かない', board[c * BOARD_SIZE + c] === 1);
        board.fill(0);
        board[2 * BOARD_SIZE + 2] = 1; // 距離2の軌道
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('内側の軌道も1歩公転', board[3 * BOARD_SIZE + 2] === 1 && board[2 * BOARD_SIZE + 2] === 0);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
