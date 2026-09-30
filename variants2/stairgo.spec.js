// STAIRGO — 階段碁: 段差のある階段状の盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'stairgo.html',
    en: 'STAIRGO',
    jp: '階段碁',
    prefix: 'stairgo',
    desc: '右へ行くほど高くなる階段盤。低い段からしか上へ登れない地形。',
    kind: 'stone',
    spec: [
        ...K.rb('STAIRGO', '階段碁', 'stairgo'),
        // 階段形状: 列ごとに2段ずつせり上がる (右端が最も高い)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const top = Math.max(0, (BOARD_SIZE - 1) - Math.floor(x / 2) * 2);
                if (y < top) board[y * BOARD_SIZE + x] = 3;
            }`],
        ...K.WALL_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は右へ2列ごとに1段高くなる階段状。削れた部分には置けない。',
            '低い段から高い段へ石を進めていく立体的な攻防。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('最下段の上は壁', board[0] === 3);
        assert('壁には置けない', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('最下段の裾は置ける', isValidPlacement([{ x: 0, y: BOARD_SIZE - 1 }], 1) === true);
        assert('最高段の頂点は置ける', isValidPlacement([{ x: BOARD_SIZE - 1, y: 0 }], 1) === true);
        let walls = 0;
        for (const v of board) if (v === 3) walls++;
        assert('階段状に削れている', walls > 30);
    `,
};
