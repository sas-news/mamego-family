// PARASITEGO — 寄生碁: 打ち込んだ石が敵連に食い込み、接する敵石を自色に変える
const K = require('../gen_kit.js');
module.exports = {
    file: 'parasitego.html',
    en: 'PARASITEGO',
    jp: '寄生碁',
    prefix: 'parasitego',
    desc: '着手点に接する敵石は寄生で自色に変わる。敵連の内側から侵食する。',
    kind: 'stone',
    spec: [
        ...K.rb('PARASITEGO', '寄生碁', 'parasitego'),
        K.params([
            { key: 'bite_max', label: '1手で寄生できる敵石数', min: 1, max: 4, def: 4, unit: '個' },
        ]),
        [K.ONE, K.CAPTURE_BLOCK, `            // 寄生: 着手点に接する敵石を自色に変える (連から削り取る)
            {
                const anchor = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const bitten = getNeighbors(anchor).filter(n => board[n] === opponent).slice(0, P('bite_max') || 4);
                if (bitten.length > 0) {
                    bitten.forEach(i => {
                        board[i] = player;
                        // 寄生する胞子が敵石を塗り替える演出
                        fxGlow(i, '#a3e635', 700);
                        fxBurst(i, '#65a30d', 8, 1.2);
                    });
                    fxText(anchor, '寄生', '#a3e635', 900);
                    captures[player] += bitten.length;
                }
            }

            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手した石に接する敵石は寄生で自分の色に変わる。',
            '敵連に打ち込むと端から侵食していく。奪った石はアゲハマにも計上される。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[5 * BOARD_SIZE + 5] = 2; board[5 * BOARD_SIZE + 6] = 2;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1); // (5,5) に接して着手
        assert('接した敵石が寝返る', board[5 * BOARD_SIZE + 5] === 1);
        assert('連の残りは敵のまま', board[5 * BOARD_SIZE + 6] === 2);
        assert('侵食分は取り計上', captures[1] === 1);
        board.fill(0); pieces = []; captures[1] = 0;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('敵に接しない着手は通常', board[3 * BOARD_SIZE + 3] === 1 && captures[1] === 0);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
