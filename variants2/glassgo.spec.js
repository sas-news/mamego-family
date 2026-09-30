// GLASSGO — 硝子碁: 砕けた石は周囲の石も連鎖して割る。取りが大火事になる。
const K = require('../gen_kit.js');
module.exports = {
    file: 'glassgo.html',
    en: 'GLASSGO',
    jp: '硝子碁',
    prefix: 'glassgo',
    desc: '砕けた石は周囲の石も連鎖して割る。取りが大火事になる。',
    kind: 'stone',
    spec: [
        ...K.rb('GLASSGO', '硝子碁', 'glassgo'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 硝子碁: 砕けた石に隣接する石 (色問わず) も連鎖して割れる
                const shattered = new Set(captured);
                const queue = [...captured];
                while (queue.length > 0) {
                    const c = queue.shift();
                    getNeighbors(c).forEach(n => {
                        if (!shattered.has(n) && board[n] !== 0) {
                            shattered.add(n);
                            queue.push(n);
                        }
                    });
                }
                shattered.forEach(idx => {
                    const v = board[idx];
                    board[idx] = 0;
                    captures[v === player ? player : opponent]++;
                });
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_ALGO, K.rv(['硝子の石: 取られた石は砕け、隣接する石 (敵味方問わず) も連鎖して割れる。','連鎖は石が触れ合う所を辿って広がる。割れた敵石は自分のアゲハマ、割れた自石は相手のアゲハマ。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0);
        board[I(5,5)] = 2; board[I(6,5)] = 2; // 敵連2石
        board[I(4,5)] = 1; board[I(5,4)] = 1; board[I(6,4)] = 1; board[I(7,5)] = 1; board[I(5,6)] = 1;
        board[I(0,0)] = 1; // 遠くの自石
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // (6,6)で包囲完成
        assert('敵連が砕けた', board[I(5,5)] === 0 && board[I(6,5)] === 0);
        assert('隣の自石も連鎖で割れた', board[I(4,5)] === 0);
        assert('遠い自石は無事', board[I(0,0)] === 1);
    
    `,
};
