// HARMONYGO — 和声碁: 和音(連)の大きさが協和(3・5・7)なら得点、不協和(2・6)は失点
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'harmonygo.html',
    en: 'HARMONYGO',
    jp: '和声碁',
    prefix: 'harmonygo',
    desc: '連の大きさが和音。3連・5連は協和+1目、7連で+2目。2連・6連は不協和で相手に+1。',
    kind: 'stone',
    icon: 'harmonygo',
    spec: [
        ...K.rb('HARMONYGO', '和声碁', 'harmonygo'),
        K.params([
            { key: 'consonant_bonus', label: '協和 (3・5連) の得点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'perfect_bonus', label: '完全協和 (7連) の得点', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'dissonant_bonus', label: '不協和 (2・6連) の献上点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.8, step: 0.05 },
        ]),
        // 和声ルール: 着手した連の大きさで協和/不協和が決まる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 和声: 連の大きさが 3・5 で協和+1、7 で完全協和+2、2・6 で不協和 (相手+1)
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (board[mi] === player) {
                    const s = getConnectedGroup(mi, player).length;
                    if (s === 3 || s === 5) {
                        captures[player] += (P('consonant_bonus') || 1);
                        fxGlow(mi, '#4ade80', 650);
                        fxText(mi, '協和音 +' + (P('consonant_bonus') || 1), '#4ade80', 1100);
                    } else if (s === 7) {
                        captures[player] += (P('perfect_bonus') || 2);
                        fxGlow(mi, '#facc15', 800);
                        fxText(mi, '完全協和 +' + (P('perfect_bonus') || 2), '#facc15', 1300);
                    } else if (s === 2 || s === 6) {
                        captures[opponent] += (P('dissonant_bonus') || 1);
                        fxText(mi, '不協和…', '#f87171', 1100);
                    }
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'協和=3・5連(+1) 7連(+2) / 不協和=2・6連'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            和声碁: 連の大きさが和音。3連・5連で+1目、7連で+2目。2連・6連は不協和で相手に+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した連の大きさが和音の度合いを決める: 3連・5連は協和で+1目、7連は完全協和で+2目。',
            '2連・6連は不協和 — 相手に+1目を献上する。単石と4連・8連以上は無音 (中立)。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 2連 → 不協和
        assert('2連は不協和で相手+1', captures[2] === 1);
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1); // 3連 → 協和
        assert('3連で協和+1', captures[1] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 単石は無音
        assert('単石は無音', captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 2) === true);
    `,
};
