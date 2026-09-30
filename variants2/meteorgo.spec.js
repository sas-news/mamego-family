// METEORGO — 隕石碁: 7手ごとに隕石が落ち、十字のクレーター(壁)ができる
const K = require('../gen_kit.js');
module.exports = {
    file: 'meteorgo.html',
    en: 'METEORGO',
    jp: '隕石碁',
    prefix: 'meteorgo',
    desc: '7手ごとに隕石が落下し十字のクレーターができる。直撃した石は消える。',
    kind: 'stone',
    spec: [
        ...K.rb('METEORGO', '隕石碁', 'meteorgo'),
        // 7手ごとに隕石落下: 十字形のクレーター(壁)が穿たれ、直撃した石は消滅
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 隕石ルール: 7手ごとに隕石が落ち、十字形のクレーター(壁)ができる。
            //             直撃した石は相手のアゲハマになる。
            if (history.length % 7 === 0) {
                const N = BOARD_SIZE, n = history.length;
                const mx = (n * 5 + 2) % N, my = (n * 7 + 3) % N;
                const crater = [[mx, my], [mx - 1, my], [mx + 1, my], [mx, my - 1], [mx, my + 1]];
                for (const [x, y] of crater) {
                    if (x < 0 || x >= N || y < 0 || y >= N) continue;
                    const i = y * N + x;
                    if (board[i] === 1 || board[i] === 2) captures[board[i] === 1 ? 2 : 1]++;
                    board[i] = 3;
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        ...K.WALL_SPEC,
        ...K.EVENT_CHIP_SPEC(`'隕石まで ' + (7 - history.length % 7) + ' 手'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '7手ごとに隕石が落下し、十字形のクレーター(壁)が穿たれる。直撃した石は消滅する。',
            'クレーターは壁となり、呼吸点も地も失う。落下位置は手数で決まり読める。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('隕石前は壁なし', board.every(v => v !== 3));
        const cells = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [0, 2]];
        for (let k = 0; k < 6; k++) executeMove({ cells: [{ x: cells[k][0], y: cells[k][1] }] }, k % 2 + 1);
        // 7手目の隕石: mx=(7*5+2)%13=11, my=(7*7+3)%13=0 → クレーターは(11,0)中心
        const N = BOARD_SIZE;
        const mx = (7 * 5 + 2) % N, my = (7 * 7 + 3) % N;
        assert('クレーターが穿たれた', board[my * N + mx] === 3);
        let w = 0;
        for (const v of board) if (v === 3) w++;
        assert('十字に壁ができる', w >= 3);
        assert('壁には置けない', isValidPlacement([{ x: mx, y: my }], 1) === false);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
