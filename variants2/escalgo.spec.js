// ESCALGO — 昇降碁: 中央列が循環するエスカレーター (上から最下へ戻る)
const K = require('../gen_kit.js');
module.exports = {
    file: 'escalgo.html',
    en: 'ESCALGO',
    jp: '昇降碁',
    prefix: 'escalgo',
    desc: '中央列は循環エスカレーター。石は上へ運ばれ、天辺から底へ回る。',
    kind: 'stone',
    spec: [
        ...K.rb('ESCALGO', '昇降碁', 'escalgo'),
        // 着手ごと、中央列の中身が丸ごと1マス上へ循環
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 昇降ルール: 中央列は循環エスカレーター。列の全セルが1マス上へ動き、
            //             最上段の内容は最下段へ回る。
            {
                const N = BOARD_SIZE, c = Math.floor(N / 2);
                const first = board[c];
                for (let y = 0; y < N - 1; y++) board[y * N + c] = board[(y + 1) * N + c];
                board[(N - 1) * N + c] = first;
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
        // エスカレーター列の描画
        K.CUE_GRID(`            // 中央列のエスカレーター帯と上向き矢印
            {
                const c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.10);
                ctx.fillRect(padding + (c - 0.5) * cellSize, padding - cellSize * 0.5,
                    cellSize, cellSize * BOARD_SIZE);
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.55);
                ctx.font = 'bold ' + Math.round(cellSize * 0.55) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let y = 1; y < BOARD_SIZE; y += 2) {
                    ctx.fillText('▲', padding + c * cellSize, padding + y * cellSize);
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '中央列は循環するエスカレーター: 着手ごとに列の全セルが1マス上へ運ばれる。',
            '最上段に達した石は最下段へ回ってくる。乗せた石は毎手動き続ける。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        const c = Math.floor(BOARD_SIZE / 2);
        board.fill(0);
        executeMove({ cells: [{ x: c, y: 6 }] }, 1);
        assert('エスカレーターで昇る', board[5 * BOARD_SIZE + c] === 1 && board[6 * BOARD_SIZE + c] === 0);
        board.fill(0);
        board[0 * BOARD_SIZE + c] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('天辺から最下へ循環する', board[(BOARD_SIZE - 1) * BOARD_SIZE + c] === 1 && board[0 * BOARD_SIZE + c] === 0);
        board.fill(0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('列の外の石は動かない', board[0] === 1);
    `,
};
