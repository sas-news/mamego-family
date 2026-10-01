// WILDGO — 無手碁: 5手ごとのワイルド手は同じプレイヤーが続けてもう1手
const K = require('../gen_kit.js');
module.exports = {
    file: 'wildgo.html',
    en: 'WILDGO',
    jp: '無手碁',
    prefix: 'wildgo',
    desc: '5手ごとのワイルド手は手番が変わらず連続2手。溜めて崩す大局観。',
    kind: 'stone',
    spec: [
        ...K.rb('WILDGO', '無手碁', 'wildgo'),
        K.params([
            { key: 'wild_interval', label: 'ワイルド手の間隔', min: 2, max: 10, def: 5, unit: '手' },
            { key: 'cap_rows', label: '打ち切りの余裕', min: 0, max: 9, def: 2, hint: '交点数+N行分の着手で終局' },
        ]),
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
        let moveCount = 0;`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 無手碁: 5手ごとのワイルド手は手番が変わらず、同じ側がもう1手打てる
            moveCount++;

            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + (P('cap_rows') ?? 2))) {
                endGameByScore();
                return;
            }

            if (moveCount % (P('wild_interval') || 5) !== 0) turn = opponent;
            else if (lastMove && lastMove.cells[0]) {
                const wi = lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x;
                fxText(wi, 'WILD!', '#f472b6', 1200);
                fxGlow(wi, '#f472b6', 750);
            }`],
        ...K.EVENT_CHIP_SPEC('moveCount % (P("wild_interval") || 5) === (P("wild_interval") || 5) - 1 ? "次はワイルド手!" : ""'),
        [K.ONE, K.INFO_ALGO, `            無手碁: 5手ごとのワイルド手は同じ側が続けてもう1手<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '5手ごとのワイルド手では手番が交代せず、同じプレイヤーが続けてもう1手打てる。',
            'ワイルド手を取れるのは着手した側 — 4手目の布石でワイルドを誰が拾うかが読みどころ。',
            '連続2手での囲み・取り・反撃が通常碁にはない爆発力を生む。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; moveCount = 4;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('ワイルド手は続けて打てる', turn === 1);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('その次は通常交代', turn === 2);
        moveCount = 0;
        executeMove({ cells: [{ x: 2, y: 0 }] }, 2);
        assert('通常は交互着手', turn === 1);
    `,
};
