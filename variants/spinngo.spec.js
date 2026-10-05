// SPINNGO — 自転碁: 着手ごとに盤面ごと90°時計回りに自転する
const K = require('../gen_kit.js');
module.exports = {
    file: 'spinngo.html',
    en: 'SPINNGO',
    jp: '自転碁',
    prefix: 'spinngo',
    desc: '着手ごとに盤が90°自転する。自分の形も相手の形も丸ごと回る。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('SPINNGO', '自転碁', 'spinngo'),
        K.params([
            { key: 'ply_extra', label: '打ち切りの余分', min: 0, max: 6, def: 2, step: 1, unit: '行', hint: '交点数+この行数で打ち切り' },
        ]),
        // 着手ごと、盤面全体が90°時計回りに回転
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 自転ルール: 盤面ごと90°時計回りに回転する
            {
                const N = BOARD_SIZE;
                const nb = board.slice();
                for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
                    board[x * N + (N - 1 - y)] = nb[y * N + x];
                    if (nb[y * N + x] !== 0) fxSlide(y * N + x, x * N + (N - 1 - y), 400);
                }
                fxShake(2, 160);
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
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + (P('ply_extra') || 2))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 自転の描画: 盤外周に回転矢印
        K.CUE_STARS(`            // 自転: 盤の外周に回転矢印
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.6);
                ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                const w = (BOARD_SIZE - 1) * cellSize;
                ctx.beginPath();
                ctx.arc(padding + w / 2, padding + w / 2, w / 2 + cellSize * 0.55, -Math.PI * 0.15, Math.PI * 0.4);
                ctx.stroke();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.6);
                ctx.font = 'bold ' + Math.round(cellSize * 0.7) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('↻', padding + w + cellSize * 0.35, padding + w * 0.5);
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '着手ごとに盤面全体が90°時計回りに自転する。4手で一周して元に戻る。',
            '打った石も次の瞬間には別の座標へ。回転を見越して形を作る新感覚の碁。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1);
        // 90°時計回り: (x,y) → (N-1-y, x)
        const n1 = BOARD_SIZE;
        assert('盤ごと90°回転', board[1 * n1 + (n1 - 1 - 2)] === 1 && board[2 * n1 + 1] === 0);
        board.fill(0);
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('中心の石は回転しても同じ場所', board[c * n1 + c] === 1);
        board.fill(0);
        board[0] = 1; board[1] = 1; board[BOARD_SIZE] = 2;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2);
        assert('全石が一緒に回る', board[12] === 1 && board[25] === 1 && board[11] === 2);
    `,
};
