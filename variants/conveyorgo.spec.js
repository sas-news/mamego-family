// CONVEYORGO — 搬送碁: 中央行が石を右へ運ぶコンベアベルト
const K = require('../gen_kit.js');
module.exports = {
    file: 'conveyorgo.html',
    en: 'CONVEYORGO',
    jp: '搬送碁',
    prefix: 'conveyorgo',
    desc: '中央行は石を右へ運ぶベルトコンベア。右端で降りるか渋滞する。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('CONVEYORGO', '搬送碁', 'conveyorgo'),
        K.params([
            { key: 'belt_dir', label: 'ベルトの向き', options: [{ v: 'right', l: '右へ' }, { v: 'left', l: '左へ' }], def: 'right' },
            { key: 'belt_speed', label: 'ベルトの速さ', min: 1, max: 3, def: 1, unit: 'マス/手' },
        ]),
        // 着手ごと、中央ベルト行の石を1マス右へ運ぶ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 搬送ルール: 中央行の石をベルト向きへ運ぶ (詰まったら停止・端は降車済み)
            {
                const N = BOARD_SIZE, by = Math.floor(N / 2);
                const _spd = Math.max(1, P('belt_speed') || 1);
                const _dir = P('belt_dir') === 'left' ? -1 : 1;
                for (let _s = 0; _s < _spd; _s++) {
                for (let k = 0; k < N - 1; k++) {
                    const x = _dir === 1 ? N - 2 - k : 1 + k; // 流出側から処理して追い越しを防ぐ
                    const i = by * N + x;
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    if (board[i + _dir] === 0) {
                        board[i + _dir] = board[i]; board[i] = 0;
                        fxSlide(i, i + _dir, 340); // ベルトで運ばれる軌跡
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
        // ベルト帯と進行方向の矢印
        K.CUE_GRID(`            // 搬送ベルト帯の描画
            {
                const by = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.10);
                ctx.fillRect(padding - cellSize / 2, padding + (by - 0.5) * cellSize,
                    cellSize * BOARD_SIZE, cellSize);
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.55);
                ctx.font = 'bold ' + Math.round(cellSize * 0.55) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let x = 0; x < BOARD_SIZE; x += 2) {
                    ctx.fillText(P('belt_dir') === 'left' ? '◀' : '▶', padding + x * cellSize, padding + by * cellSize);
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '中央行は右へ流れるベルトコンベア。着手ごとに上の石が1マス右へ運ばれる。',
            '右端に達した石はベルトを降りて留まる。詰まった石は動かない。',
        ])],
        // ベルトの回転: 縁の破線が右へ流れ続ける
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const by = Math.floor(BOARD_SIZE / 2);
            const y0 = pad + (by - 0.5) * cs, y1 = pad + (by + 0.5) * cs;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(110,130,150,0.4)';
            ctx2.lineWidth = Math.max(1.2, cs * 0.055);
            ctx2.lineCap = 'round';
            ctx2.setLineDash([cs * 0.20, cs * 0.28]);
            ctx2.lineDashOffset = -(now / 28) % (cs * 0.48);
            ctx2.beginPath();
            ctx2.moveTo(pad - cs * 0.5, y0); ctx2.lineTo(pad + (BOARD_SIZE - 0.5) * cs, y0);
            ctx2.moveTo(pad - cs * 0.5, y1); ctx2.lineTo(pad + (BOARD_SIZE - 0.5) * cs, y1);
            ctx2.stroke();
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        const by = Math.floor(BOARD_SIZE / 2);
        board.fill(0);
        executeMove({ cells: [{ x: 2, y: by }] }, 1);
        assert('ベルトで右へ運ばれる', board[by * BOARD_SIZE + 3] === 1 && board[by * BOARD_SIZE + 2] === 0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('次の手でもさらに右へ', board[by * BOARD_SIZE + 4] === 1);
        board.fill(0);
        board[by * BOARD_SIZE + BOARD_SIZE - 1] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('右端の石は降りて留まる', board[by * BOARD_SIZE + BOARD_SIZE - 1] === 1);
        board.fill(0);
        board[by * BOARD_SIZE + BOARD_SIZE - 2] = 1;
        board[by * BOARD_SIZE + BOARD_SIZE - 1] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('前が詰まっていたら動かない', board[by * BOARD_SIZE + BOARD_SIZE - 2] === 1);
    `,
};
