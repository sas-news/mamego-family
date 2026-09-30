// RIVERGO — 大河碁: 中央2行の大河が石を下流へ運び、端から流れ落ちる
const K = require('../gen_kit.js');
module.exports = {
    file: 'rivergo.html',
    en: 'RIVERGO',
    jp: '大河碁',
    prefix: 'rivergo',
    desc: '中央2行を流れる大河。乗った石は下流へ運ばれ、右端から流れ落ちる。',
    kind: 'stone',
    spec: [
        ...K.rb('RIVERGO', '大河碁', 'rivergo'),
        // 着手ごと、川筋(中央2行)の石を1マス右へ流し、右端の石は流れ落ちる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 大河ルール: 中央2行を流れる川。川筋の石は1手ごとに1マス下流(右)へ運ばれ、
            //             右端の石は流れ落ちて相手のアゲハマになる。
            {
                const N = BOARD_SIZE;
                const c = Math.floor(N / 2);
                const lost = { 1: 0, 2: 0 };
                for (const ry of [c, c + 1]) {
                    if (ry >= N) continue;
                    const last = ry * N + (N - 1);
                    if (board[last] === 1 || board[last] === 2) {
                        lost[board[last]]++;
                        board[last] = 0;
                        fxSplash(last, 'rgba(124,196,255,0.9)', 10); // 流れ落ちる水しぶき
                        fxText(last, '流れ', 'rgba(150,210,255,0.95)', 900);
                    }
                    for (let x = N - 2; x >= 0; x--) {
                        const i = ry * N + x;
                        if (board[i] !== 1 && board[i] !== 2) continue;
                        if (board[i + 1] === 0) {
                            board[i + 1] = board[i]; board[i] = 0;
                            fxSlide(i, i + 1, 380); // 川で運ばれる軌跡
                        }
                    }
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
        // 川面の描画
        K.CUE_GRID(`            // 大河: 中央2行を青い流れで描く
            {
                const c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.fillStyle = 'rgba(70,130,220,0.20)';
                const y0 = padding + (c - 0.5) * cellSize;
                const h = Math.min(2, BOARD_SIZE - c) * cellSize;
                ctx.fillRect(padding - cellSize * 0.5, y0, cellSize * BOARD_SIZE, h);
                ctx.strokeStyle = 'rgba(120,180,255,0.5)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                for (let k = 0; k < 2; k++) {
                    const gy = y0 + h * (0.3 + 0.4 * k);
                    ctx.beginPath();
                    for (let x = 0; x <= BOARD_SIZE; x++) {
                        const px = padding + (x - 0.5) * cellSize;
                        const py = gy + Math.sin(x * 1.3 + k * 2) * cellSize * 0.1;
                        if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の中央2行を大河が流れる。川筋の石は着手ごとに1マス下流へ運ばれる。',
            '右端まで運ばれた石は流れ落ちて相手のアゲハマになる。乗るなら早めに降りよ。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 川面のきらめきと流れる波紋 (常時)
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const c = Math.floor(BOARD_SIZE / 2);
            const y0 = pad + (c - 0.5) * cs;
            const h = Math.min(2, BOARD_SIZE - c) * cs;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(150,205,255,0.30)';
            ctx2.lineWidth = Math.max(1, cs * 0.045);
            ctx2.lineCap = 'round';
            for (let k = 0; k < 4; k++) {
                const ph = now / 1400 + k * 1.7;
                const gy = y0 + h * (0.18 + 0.22 * k);
                ctx2.beginPath();
                for (let x = 0; x <= BOARD_SIZE; x++) {
                    const px = pad + (x - 0.5) * cs;
                    const py = gy + Math.sin(x * 1.4 + ph * 3) * cs * 0.09;
                    if (x === 0) ctx2.moveTo(px, py); else ctx2.lineTo(px, py);
                }
                ctx2.stroke();
            }
            // 流れ筋 (右へ流れる短い筋)
            ctx2.strokeStyle = 'rgba(190,225,255,0.35)';
            for (let k = 0; k < 10; k++) {
                const t = ((now / 1300) + k * 0.31) % 1;
                const px = pad - cs * 0.5 + t * cs * BOARD_SIZE;
                const py = y0 + (((k * 53.1) % 1) * (h - cs * 0.3)) + cs * 0.15;
                ctx2.beginPath();
                ctx2.moveTo(px - cs * 0.3, py);
                ctx2.lineTo(px, py);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        const c = Math.floor(BOARD_SIZE / 2);
        board.fill(0);
        executeMove({ cells: [{ x: 2, y: c }] }, 1);
        assert('川筋の石は下流へ', board[c * BOARD_SIZE + 3] === 1 && board[c * BOARD_SIZE + 2] === 0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('さらに下流へ', board[c * BOARD_SIZE + 4] === 1);
        board.fill(0);
        board[c * BOARD_SIZE + BOARD_SIZE - 1] = 1;
        const w0 = captures[2];
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('右端の石は流れ落ちる', board[c * BOARD_SIZE + BOARD_SIZE - 1] === 0 && captures[2] === w0 + 1);
        executeMove({ cells: [{ x: 1, y: c + 1 }] }, 1);
        assert('下の川筋段も流れる', board[(c + 1) * BOARD_SIZE + 2] === 1);
    `,
};
