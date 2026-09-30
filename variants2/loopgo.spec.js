// LOOPGO — 周回碁: 最外周から1周ずつ内側へしか侵攻できない
const K = require('../gen_kit.js');
module.exports = {
    file: 'loopgo.html',
    en: 'LOOPGO',
    jp: '周回碁',
    prefix: 'loopgo',
    desc: '最外周からしか攻め込めない。石が置かれた環の1つ内側が次に解放される。',
    kind: 'loop',
    spec: [
        ...K.rb('LOOPGO', '周回碁', 'loopgo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 周回碁ルール: 最外周=環0から侵攻開始。
            // 石が存在する最も深い環の1つ内側までが着手可能 (侵攻は1環ずつ進む)
            {
                const ringOf = (x, y) => Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
                let maxDepth = -1;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 0) continue;
                    const r = ringOf(i % BOARD_SIZE, Math.floor(i / BOARD_SIZE));
                    if (r > maxDepth) maxDepth = r;
                }
                const maxRing = maxDepth + 1;
                for (const p of cells) {
                    if (ringOf(p.x, p.y) > maxRing) return false;
                }
            }`],
        ...K.LEGAL_DOTS_SPEC,
        K.CUE_GRID(`            // 周回: 侵攻可能な最深環を薄く照らす
            {
                const ringOf2 = (x, y) => Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
                let mR = -1;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 0) continue;
                    const r = ringOf2(i % BOARD_SIZE, Math.floor(i / BOARD_SIZE));
                    if (r > mR) mR = r;
                }
                const front = mR + 1;
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.5);
                ctx.lineWidth = Math.max(2, cellSize * 0.10);
                const off = front + 0.5;
                if (front * 2 < BOARD_SIZE) {
                    ctx.strokeRect(padding + (front - 0.5) * cellSize, padding + (front - 0.5) * cellSize,
                        (BOARD_SIZE - 2 * front) * cellSize, (BOARD_SIZE - 2 * front) * cellSize);
                }
                ctx.restore();
            }`),
        // 周回: 侵攻フロントの環が外へ向かって脈動する (1環ずつ内へ攻めるルール)
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const ringOf = (x, y) => Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
            let mR = -1;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === 0) continue;
                const r = ringOf(i % BOARD_SIZE, Math.floor(i / BOARD_SIZE));
                if (r > mR) mR = r;
            }
            const front = mR + 1;
            if (front * 2 >= BOARD_SIZE) return;
            const t = (now % 1600) / 1600;
            const e = t * 0.45;
            ctx2.save();
            ctx2.strokeStyle = alphaColor(currentTheme.lineColor, 0.5 * (1 - t));
            ctx2.lineWidth = Math.max(1.6, cs * 0.09);
            ctx2.strokeRect(pad + (front - 0.5 - e) * cs, pad + (front - 0.5 - e) * cs,
                (BOARD_SIZE - 2 * front + 2 * e) * cs, (BOARD_SIZE - 2 * front + 2 * e) * cs);
            ctx2.restore();
        });`],
        [K.ONE, K.RV_ALGO, K.rv([
            '初手は最外周 (環0) にのみ着手できる。',
            '石が存在する最も深い環の1つ内側まで着手可能になる。同心円状に内へ侵攻する。',
            '最深部の石が取られると侵攻深度も後退する。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const N = BOARD_SIZE;
        assert('空盤: 外周は置ける', isValidPlacement([{ x: 3, y: 0 }], 1) === true);
        assert('空盤: 1つ内側は不可', isValidPlacement([{ x: 1, y: 1 }], 1) === false);
        assert('空盤: 中央は不可', isValidPlacement([{ x: 4, y: 4 }], 1) === false);
        board[0 * N + 4] = 1; // 環0に石
        assert('環0の石で環1が解放', isValidPlacement([{ x: 2, y: 1 }], 2) === true);
        assert('環2はまだ不可', isValidPlacement([{ x: 2, y: 2 }], 2) === false);
        board[1 * N + 4] = 2; // 環1に石
        assert('環1の石で環2が解放', isValidPlacement([{ x: 2, y: 2 }], 1) === true);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
