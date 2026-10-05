// CENTRIFUGO — 遠心碁: 着手ごと全石が外へ放り出され、盤端の石は飛び散る
const K = require('../gen_kit.js');
module.exports = {
    file: 'centrifugo.html',
    en: 'CENTRIFUGO',
    jp: '遠心碁',
    prefix: 'centrifugo',
    desc: '遠心力で全石が外へ放られる。盤端に渋滞した石は呼吸を失いやすい。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('CENTRIFUGO', '遠心碁', 'centrifugo'),
        K.params([
            { key: 'cap_moves', label: '打ち切り手数', min: 60, max: 480, def: 240, unit: '手' },
        ]),
        // 着手ごと、全石が中心から外へ1マス放たれ、盤外の石は飛び散る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 遠心ルール: 全石が中心から遠ざかる向きに1マス放たれる。
            //             盤端に着いた石はこれ以上飛び出せず渋滞して留まる。真ん中の石は均衡で静止。
            {
                const N = BOARD_SIZE, c = Math.floor(N / 2);
                // 外側から処理して追い越しを防ぐ
                const idxs = [...board.keys()].sort((a, b) => {
                    const da = Math.max(Math.abs(a % N - c), Math.abs(Math.floor(a / N) - c));
                    const db = Math.max(Math.abs(b % N - c), Math.abs(Math.floor(b / N) - c));
                    return db - da;
                });
                for (const i of idxs) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % N, y = Math.floor(i / N);
                    const dx = Math.sign(x - c), dy = Math.sign(y - c);
                    if (dx === 0 && dy === 0) continue;
                    const tries = [[dx, dy], [dx, 0], [0, dy]];
                    for (const [tx2, ty2] of tries) {
                        if (tx2 === 0 && ty2 === 0) continue;
                        const nx = x + tx2, ny = y + ty2;
                        if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue; // 盤端では外へ出られず留まる
                        const j = ny * N + nx;
                        if (board[j] === 0) { board[j] = board[i]; board[i] = 0; fxSlide(i, j, 380); break; }
                    }
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

            // 遠心渋滞で盤が埋まるのが遅いため、既定の手数で自動的に点数計算して終局
            if (history.length >= (P('cap_moves') || 240) && !gameOver) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 遠心の描画: 外向きの放射線
        K.CUE_GRID(`            // 遠心: 中心から外への放射線
            {
                const c = (BOARD_SIZE - 1) / 2;
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.15);
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                for (let k = 0; k < 8; k++) {
                    const a = k * Math.PI / 4 + Math.PI / 8;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a) * cellSize * 0.8, cy + Math.sin(a) * cellSize * 0.8);
                    ctx.lineTo(cx + Math.cos(a) * cellSize * (BOARD_SIZE / 2), cy + Math.sin(a) * cellSize * (BOARD_SIZE / 2));
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '盤が回る遠心機: 着手ごとに全石が中心から遠ざかる向きへ1マス放たれる。',
            '盤端に追い込まれた石はこれ以上飛び出せず渋滞して留まる。中心真ん中の石だけ均衡で動かない。',
            '240手に達したら自動的に点数計算して終局。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        const c = Math.floor(BOARD_SIZE / 2);
        board.fill(0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('隅の石は盤端で留まる', board[0] === 1);
        board.fill(0);
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('中心の石は均衡で動かない', board[c * BOARD_SIZE + c] === 1);
        board.fill(0);
        board[c * BOARD_SIZE + c - 1] = 1;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 2);
        assert('中心脇の石は外へ1マス', board[c * BOARD_SIZE + c - 2] === 1 && board[c * BOARD_SIZE + c - 1] === 0);
        // 手数上限で自動終局
        history = new Array(239).fill(null); gameOver = false;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('240手で自動終局', gameOver === true);
    `,
};
