// SPEARHEADGO — 矛先碁: 着手で直線3連以上を完成させると矛となり、延長線上の敵石を貫く
const K = require('../gen_kit.js');
module.exports = {
    file: 'spearheadgo.html',
    en: 'SPEARHEADGO',
    jp: '矛先碁',
    prefix: 'spearheadgo',
    desc: '着手で直線に3連以上を作ると矛になる。矛の延長線上3マス以内の敵石を貫いて取る。',
    kind: 'stone',
    icon: 'spearheadgo',
    spec: [
        ...K.rb('SPEARHEADGO', '矛先碁', 'spearheadgo'),
        K.params([
            { key: 'spear_len', label: '矛に必要な連数', min: 3, max: 6, def: 3, unit: '連' },
            { key: 'spear_reach', label: '矛の射程', min: 1, max: 8, def: 3, unit: 'マス' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        // 矛の貫き: 直線3連の完成で、延長線上3マス以内の敵石を貫いて取る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 矛先ルール: 着手が直線3連以上の先端なら延長線上の敵石を貫く
            {
                const p = move.cells[0];
                const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
                dirs.forEach(([dx, dy]) => {
                    // 着手の両側の自石連を数える (先端の石が矛の穂先になる)
                    let back = 0;
                    let bx = p.x - dx, by = p.y - dy;
                    while (bx >= 0 && bx < BOARD_SIZE && by >= 0 && by < BOARD_SIZE &&
                           board[by * BOARD_SIZE + bx] === player) { back++; bx -= dx; by -= dy; }
                    let fwd = 0;
                    let fx = p.x + dx, fy = p.y + dy;
                    while (fx >= 0 && fx < BOARD_SIZE && fy >= 0 && fy < BOARD_SIZE &&
                           board[fy * BOARD_SIZE + fx] === player) { fwd++; fx += dx; fy += dy; }
                    // 先端条件: 一方が2連以上でもう一方が0 → 空いている側へ矛を突き出す
                    let pdx = 0, pdy = 0;
                    if (back >= (P('spear_len') || 3) - 1 && fwd === 0) { pdx = dx; pdy = dy; }
                    else if (fwd >= (P('spear_len') || 3) - 1 && back === 0) { pdx = -dx; pdy = -dy; }
                    else return;
                    for (let k = 1; k <= (P('spear_reach') || 3); k++) {
                        const sx = p.x + pdx * k, sy = p.y + pdy * k;
                        if (sx < 0 || sx >= BOARD_SIZE || sy < 0 || sy >= BOARD_SIZE) break;
                        const si = sy * BOARD_SIZE + sx;
                        if (board[si] === opponent) {
                            board[si] = 0;
                            captures[player] += 1;
                            cleanUpPieces();
                            fxBurst(si, '#f87171', 8, 1.5);
                            fxText(si, '矛で貫いた +1', '#f87171', 1200);
                            break;
                        } else if (board[si] === player) {
                            break; // 自石で矛が止まる
                        }
                    }
                });
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        // 直線3連以上の矛を金色の筋で示す
        ...K.STONE_MARKS_SPEC(`            {
                const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
                ctx.save();
                [1, 2].forEach(pl => {
                    dirs.forEach(([dx, dy]) => {
                        for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                            const px = x - dx, py = y - dy;
                            if (px >= 0 && px < BOARD_SIZE && py >= 0 && py < BOARD_SIZE &&
                                board[py * BOARD_SIZE + px] === pl) continue;
                            let len = 0, cx = x, cy = y;
                            while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE &&
                                   board[cy * BOARD_SIZE + cx] === pl) { len++; cx += dx; cy += dy; }
                            if (len >= (P('spear_len') || 3)) {
                                ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
                                ctx.lineWidth = Math.max(1.5, cellSize * 0.1);
                                ctx.beginPath();
                                ctx.moveTo(padding + x * cellSize, padding + y * cellSize);
                                ctx.lineTo(padding + (x + dx * (len - 1)) * cellSize, padding + (y + dy * (len - 1)) * cellSize);
                                ctx.stroke();
                            }
                        }
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            矛先碁: 直線3連で矛が完成。延長線上3マス以内の敵石を貫いて取る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手で縦横斜めいずれかに自分の石が3連以上になると「矛」が完成する。',
            '矛は連の延長線上3マス以内の最初の敵石を貫いて取る (自石で止まる)。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof executeMove === 'function');
        // 横3連の先に敵石 → 貫く
        board[3 * BOARD_SIZE + 3] = 1; board[3 * BOARD_SIZE + 4] = 1;
        board[3 * BOARD_SIZE + 7] = 2;
        executeMove({ cells: [{ x: 5, y: 3 }] }, 1); // 3連完成
        assert('延長線上の敵を貫く', board[3 * BOARD_SIZE + 7] === 0);
        assert('貫いた石はアゲハマ', captures[1] === 1);
        // 2連では矛にならない
        board.fill(0); captures = { 1: 0, 2: 0 };
        board[5 * BOARD_SIZE + 5] = 1;
        board[5 * BOARD_SIZE + 8] = 2;
        executeMove({ cells: [{ x: 6, y: 5 }] }, 1); // 2連
        assert('2連は貫かない', board[5 * BOARD_SIZE + 8] === 2);
        assert('アゲハマなし', captures[1] === 0);
    `,
};
