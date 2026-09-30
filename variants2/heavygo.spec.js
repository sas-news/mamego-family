// HEAVYGO — 重碁: 取るには敵石数の2倍で接し囲む。大きな塊はほぼ不死身。
const K = require('../gen_kit.js');
module.exports = {
    file: 'heavygo.html',
    en: 'HEAVYGO',
    jp: '重碁',
    prefix: 'heavygo',
    desc: '取るには敵石数の2倍で接し囲む。大きな塊はほぼ不死身。',
    kind: 'stone',
    spec: [
        ...K.rb('HEAVYGO', '重碁', 'heavygo'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 重碁: 連1石につき接する敵石2個が必要。足りなければ重くて取れない
                const capSet = new Set(captured);
                const seen = new Set();
                const doomed = [];
                for (const start of captured) {
                    if (seen.has(start)) continue;
                    const group = [];
                    const q = [start];
                    seen.add(start);
                    while (q.length) {
                        const c = q.shift();
                        group.push(c);
                        getNeighbors(c).forEach(n => {
                            if (capSet.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
                        });
                    }
                    const foes = new Set();
                    group.forEach(c => getNeighbors(c).forEach(n => { if (board[n] === player) foes.add(n); }));
                    if (foes.size >= group.length * 2) doomed.push(...group);
                }
                if (doomed.length > 0) {
                    doomed.forEach(idx => board[idx] = 0);
                    captures[player] += doomed.length;
                    soundManager.playCapture();
                    cleanUpPieces();
                } else {
                    soundManager.playPlace();
                }
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_ALGO, K.rv(['重い石: 敵連を取るには、その石数の2倍の自分の石で接し囲む必要がある。','例: 3連を取るには接する敵石が6個必要。コンパクトな塊はほぼ取れない。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0);
        // 角の敵ドミノを3石で包囲: 通常なら取れるが重碁は2x2連=4石必要で生存
        board[I(0,0)] = 2; board[I(0,1)] = 2;
        board[I(1,0)] = 1; board[I(1,1)] = 1;
        executeMove({ cells: [{ x: 0, y: 2 }] }, 1);
        assert('包囲3<4でドミノ生存', board[I(0,0)] === 2 && board[I(0,1)] === 2);
        // 中央の単石は4石包囲 >= 2x1 で取れる
        board.fill(0);
        board[I(5,5)] = 2;
        board[I(4,5)] = 1; board[I(6,5)] = 1; board[I(5,4)] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('厚い包囲なら取れる', board[I(5,5)] === 0 && captures[1] === 1);
    
    `,
};
