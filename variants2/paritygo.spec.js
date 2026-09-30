// PARITYGO — 偶奇碁: 偶数手は偶数点、奇数手は奇数点にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'paritygo.html',
    en: 'PARITYGO',
    jp: '偶奇碁',
    prefix: 'paritygo',
    desc: '奇数手はx+yが奇数の点、偶数手は偶数の点のみ。市松に染め分かる盤。',
    kind: 'parity',
    spec: [
        ...K.rb('PARITYGO', '偶奇碁', 'paritygo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 偶奇碁ルール: 奇数手は (x+y)が奇数の点、偶数手は偶数の点のみ着手可
            {
                const evenMove = (history.length + 1) % 2 === 0;
                for (const p of cells) {
                    const evenPoint = (p.x + p.y) % 2 === 0;
                    if (evenMove !== evenPoint) return false;
                }
            }`],
        ...K.EVENT_CHIP_SPEC(`'着点: ' + ((history.length + 1) % 2 === 0 ? '偶数点' : '奇数点')`),
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '奇数手は x+y が奇数の交点、偶数手は偶数の交点にのみ着手できる。',
            '黒白どちらの手番でも手数で許可領域が決まる。打てる点が尽きたらパス。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        history.length = 0;
        // 1手目(奇数手): x+y が奇数の点のみ
        assert('奇数手は奇数点', isValidPlacement([{ x: 1, y: 0 }], 1) === true);
        assert('奇数手に偶数点は不可', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        board.fill(0);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        // 2手目(偶数手): x+y が偶数の点のみ
        assert('偶数手は偶数点', isValidPlacement([{ x: 1, y: 1 }], 2) === true);
        assert('偶数手に奇数点は不可', isValidPlacement([{ x: 2, y: 1 }], 2) === false);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
