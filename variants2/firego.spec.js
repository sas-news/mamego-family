// FIREGO — 燎原碁: 隅の火点から1手ごとに火が燃え広がり、石を焼き尽くす
const K = require('../gen_kit.js');
module.exports = {
    file: 'firego.html',
    en: 'FIREGO',
    jp: '燎原碁',
    prefix: 'firego',
    desc: '左上角の火点から1手ごとに火が燃え広がる。焼けた石はアゲハマに。',
    kind: 'stone',
    spec: [
        ...K.rb('FIREGO', '燎原碁', 'firego'),
        // 火は左上隅から1手ごとに斜め1マスずつ燃え広がる (x+y<=手数が燃焼域)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 燎原ルール: 左上隅の火点から1手ごとに斜め1マスずつ燃え広がる。
            //             燃焼域 (x+y<=手数) の石は焼けて相手のアゲハマになる。
            {
                const N = BOARD_SIZE, r = history.length;
                let burned = 0;
                for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
                    if (x + y > r) continue;
                    const i = y * N + x;
                    if (board[i] === 1 || board[i] === 2) {
                        captures[board[i] === 1 ? 2 : 1]++;
                        board[i] = 0;
                        // 焼け落ちる演出: 炎の粒 + 余熱リング
                        fxBurst(i, '#f97316', 8, 1.4);
                        fxBurst(i, '#fbbf24', 4, 1.0);
                        burned++;
                    }
                }
                if (burned >= 2) fxShake(3, 200);
                cleanUpPieces();
            }

            // 燃え尽きで強制終局: 火面が全盤を覆った時点で死に石確認フェーズへ
            if (history.length >= 2 * (BOARD_SIZE - 1)) {
                startDeadStoneSelectionPhase();
            }

            turn = opponent;`],
        // 燃焼域の描画
        K.CUE_GRID(`            // 燎原: 燃え広がる炎の帯 (炎線は揺らめく)
            {
                const r = history.length, now = fxNow();
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (x + y > r) continue;
                    const front = (x + y === r);
                    const fl = Math.sin(now / 130 + x * 2.1 + y * 1.7);
                    ctx.fillStyle = front
                        ? 'rgba(255,' + (110 + Math.round(60 * fl)) + ',20,' + (0.42 + fl * 0.14) + ')'
                        : 'rgba(200,60,20,0.22)';
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize,
                        cellSize, cellSize);
                    // 火線の火の粉
                    if (front && ((x * 7 + y * 3 + ((now / 200) | 0)) % 4 === 0)) {
                        ctx.fillStyle = 'rgba(255,220,120,0.9)';
                        ctx.beginPath();
                        ctx.arc(padding + x * cellSize + fl * cellSize * 0.15,
                            padding + y * cellSize - cellSize * (0.1 + 0.15 * fl),
                            Math.max(1.2, cellSize * 0.07), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'燃焼域 ' + Math.min(history.length, 2 * BOARD_SIZE - 2) + ' 歩'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '左上隅の火点から1手ごとに火が斜め1マスずつ燃え広がる (x+yが手数以下の領域)。',
            '燃焼域の石は焼けて相手のアゲハマになる。全盤が燃え尽きた時点で終局となる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // 1手目: 燃焼域 x+y<=1
        assert('燃焼域の外は無事', board[3 * BOARD_SIZE + 3] === 1);
        const cells = [[8, 8], [7, 8], [8, 7], [9, 9], [10, 10]];
        for (let k = 0; k < 5; k++) executeMove({ cells: [{ x: cells[k][0], y: cells[k][1] }] }, k % 2 + 1);
        // 6手目: 燃焼域 x+y<=6 → (3,3)は燃える
        assert('燃え広がった火が石を焼く', board[3 * BOARD_SIZE + 3] === 0);
        board.fill(0);
        const c2 = captures[2];
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 火点上は即燃える
        assert('火点に置くと即座に焼ける', board[0] === 0 && captures[2] === c2 + 1);
        board.fill(0); history.length = 2 * (BOARD_SIZE - 1) - 1;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // この着手で火面が全盤を覆う
        assert('燃え尽きで終局フェーズへ', gamePhase === 'dead_stone_selection' || gameOver);
    `,
};
