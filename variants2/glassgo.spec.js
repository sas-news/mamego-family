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
        K.params([
            { key: 'shatter_depth', label: '連鎖砕けの深さ', min: 1, max: 8, def: 2, unit: '段' },
        ]),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 硝子碁: 砕けた石に隣接する石 (色問わず) も連鎖して割れる。
                // 連鎖は取跡から2段まで — 盤全体が瓦解して収束しないのを防ぐ。
                const SHATTER_DEPTH = 2;
                const depth = new Map(captured.map(i => [i, 0]));
                const queue = [...captured];
                while (queue.length > 0) {
                    const c = queue.shift();
                    if (depth.get(c) >= (P('shatter_depth') || SHATTER_DEPTH)) continue;
                    getNeighbors(c).forEach(n => {
                        if (!depth.has(n) && board[n] !== 0) {
                            depth.set(n, depth.get(c) + 1);
                            queue.push(n);
                        }
                    });
                }
                const shattered = [...depth.keys()];
                shattered.forEach(idx => {
                    const v = board[idx];
                    board[idx] = 0;
                    captures[v === player ? player : opponent]++;
                    fxBurst(idx, 'rgba(200,235,255,0.9)', 7, 1.5); // ガラスの破片
                });
                if (shattered.length > captured.length) {
                    fxShake(4 + Math.min(6, shattered.length), 340);
                    fxText(captured[0], 'パリン!', '#bae6fd', 900);
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_BASE, K.rv(['硝子の石: 取られた石は砕け、隣接する石 (敵味方問わず) も連鎖して割れる。','連鎖は石が触れ合う所を辿って、取跡から2段まで広がる。割れた敵石は自分のアゲハマ、割れた自石は相手のアゲハマ。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0);
        board[I(5,5)] = 2; board[I(6,5)] = 2; // 敵連2石
        board[I(4,5)] = 1; board[I(5,4)] = 1; board[I(6,4)] = 1; board[I(7,5)] = 1; board[I(5,6)] = 1;
        board[I(3,5)] = 1; board[I(2,5)] = 1; // 連鎖の末端 (3段目)
        board[I(0,0)] = 1; // 遠くの自石
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // (6,6)で包囲完成
        assert('敵連が砕けた', board[I(5,5)] === 0 && board[I(6,5)] === 0);
        assert('隣の自石も連鎖で割れた', board[I(4,5)] === 0);
        assert('2段目までは連鎖する', board[I(3,5)] === 0);
        assert('3段目は連鎖しない', board[I(2,5)] === 1);
        assert('遠い自石は無事', board[I(0,0)] === 1);
    
    `,
};
