// PINWHEELGO — 風車碁: 四隅を回転対称に削った風車形盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'pinwheelgo.html',
    en: 'PINWHEELGO',
    jp: '風車碁',
    prefix: 'pinwheelgo',
    desc: '四隅を回転対称に削った風車形。非対称な地形が生む癖のある碁。',
    kind: 'stone',
    spec: [
        ...K.rb('PINWHEELGO', '風車碁', 'pinwheelgo'),
        // 各隅を90°回転対称にノッチ状に削る
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const m = BOARD_SIZE - 1;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const notch = (x < 2 && y < 5) || (x > m - 5 && y < 2)
                        || (x > m - 2 && y > m - 5) || (x < 5 && y > m - 2);
                    if (notch) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        ...K.WALL_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '四隅を回転対称に削った風車形の盤。',
            '欠けた隅で呼吸点が偏り、辺ごとに異なる戦い方を強いられる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const m = BOARD_SIZE - 1;
        assert('左上のノッチは壁', board[0] === 3 && isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('回転対称に削れている', board[m] === 3 && board[m * BOARD_SIZE] === 3 && board[m * BOARD_SIZE + m] === 3);
        let w = 0;
        for (const v of board) if (v === 3) w++;
        assert('4つのノッチ分の壁', w >= 30);
        assert('羽根の部分は置ける', isValidPlacement([{ x: 0, y: 6 }], 1) === true);
        assert('中央は普通に置ける', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
