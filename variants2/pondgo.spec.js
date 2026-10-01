// PONDGO — 池庭碁: 中央に大きな池のある環状庭園盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'pondgo.html',
    en: 'PONDGO',
    jp: '池庭碁',
    prefix: 'pondgo',
    desc: '中央に広がる大きな池。池を囲む環状の庭で戦う。',
    kind: 'stone',
    spec: [
        ...K.rb('PONDGO', '池庭碁', 'pondgo'),
        K.params([{ key: 'pond_ratio', label: '池の大きさ', min: 0.5, max: 2, step: 0.05, def: 1, hint: '盤幅の1/4を1とする' }]),
        // 中央に正方形の池
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2), k = Math.floor(BOARD_SIZE / 4 * (P('pond_ratio') || 1));
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (Math.abs(x - c) <= k && Math.abs(y - c) <= k) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        // 池は深く揺れる水面
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#14476e', '#07233a'))],
        ...K.WALL_GUARD_SPEC,
        // 池のさざ波
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央に大きな池が広がる。池には置けず呼吸にもならない。',
            '池を囲む環状の庭が唯一の戦場。回遊するように地を取れ。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, c = Math.floor(N / 2), k = Math.floor(N / 4);
        assert('池の中は置けない', isValidPlacement([{ x: c, y: c }], 1) === false);
        assert('池のふちは置ける', isValidPlacement([{ x: c - k - 1, y: c }], 1) === true);
        assert('外周の庭は置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        let w = 0;
        for (const v of board) if (v === 3) w++;
        assert('池は大きい', w >= (2 * k + 1) * (2 * k + 1));
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
