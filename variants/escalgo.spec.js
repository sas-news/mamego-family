// ESCALGO — 昇降碁: 中央列が3手ごとに循環するエスカレーター (上から最下へ戻る)
const K = require('../gen_kit.js');
module.exports = {
    file: 'escalgo.html',
    en: 'ESCALGO',
    jp: '昇降碁',
    prefix: 'escalgo',
    desc: '中央列は循環エスカレーター。石は上へ運ばれ、天辺から底へ回る。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('ESCALGO', '昇降碁', 'escalgo'),
        K.params([
            { key: 'escal_interval', label: 'エスカレーターの間隔', min: 1, max: 12, def: 3, unit: '手' },
        ]),
        // 3手ごと、中央列の中身が丸ごと1マス上へ循環
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 昇降ルール: 中央列は3手ごとに循環するエスカレーター。列の全セルが1マス上へ動き、
            //             最上段の内容は最下段へ回る。
            if (history.length % Math.max(1, P('escal_interval') || 3) === 0) {
                const N = BOARD_SIZE, c = Math.floor(N / 2);
                const first = board[c];
                for (let y = 0; y < N - 1; y++) {
                    board[y * N + c] = board[(y + 1) * N + c];
                    if (board[y * N + c] !== 0) fxSlide((y + 1) * N + c, y * N + c, 420); // 昇る石
                }
                board[(N - 1) * N + c] = first;
                if (first === 1 || first === 2) fxSlide(c, (N - 1) * N + c, 560); // 天辺→最下の循環
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
        [K.ONE, K.RV_BASE, K.rv([
            '中央列は循環するエスカレーター: 3手ごとに列の全セルが1マス上へ運ばれる。',
            '最上段に達した石は最下段へ回ってくる。乗せた石は毎手動き続ける。',
        ])],
        // エスカレーターの縁ラインが上へ流れ続ける
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const c = Math.floor(BOARD_SIZE / 2);
            const x0 = pad + (c - 0.5) * cs, x1 = pad + (c + 0.5) * cs;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(110,130,150,0.4)';
            ctx2.lineWidth = Math.max(1.2, cs * 0.055);
            ctx2.lineCap = 'round';
            ctx2.setLineDash([cs * 0.20, cs * 0.28]);
            ctx2.lineDashOffset = (now / 28) % (cs * 0.48); // 上へ流れる
            ctx2.beginPath();
            ctx2.moveTo(x0, pad - cs * 0.5); ctx2.lineTo(x0, pad + (BOARD_SIZE - 0.5) * cs);
            ctx2.moveTo(x1, pad - cs * 0.5); ctx2.lineTo(x1, pad + (BOARD_SIZE - 0.5) * cs);
            ctx2.stroke();
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        const c = Math.floor(BOARD_SIZE / 2);
        board.fill(0); history.length = 2;
        executeMove({ cells: [{ x: c, y: 6 }] }, 1); // 3手目で循環
        assert('エスカレーターで昇る', board[5 * BOARD_SIZE + c] === 1 && board[6 * BOARD_SIZE + c] === 0);
        board.fill(0); history.length = 2;
        board[0 * BOARD_SIZE + c] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('天辺から最下へ循環する', board[(BOARD_SIZE - 1) * BOARD_SIZE + c] === 1 && board[0 * BOARD_SIZE + c] === 0);
        board.fill(0); history.length = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('列の外の石は動かない', board[0] === 1);
    `,
};
