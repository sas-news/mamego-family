// SETGO — 集合碁: 領地は集合演算で決まる。両勢力が接する「積集合」領域は折半される
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
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'setgo.html',
    en: 'SETGO',
    jp: '集合碁',
    prefix: 'setgo',
    desc: '集合演算の地: 両勢力が接する領域 (積集合) は黒白で折半される。',
    kind: 'stone',
    icon: 'setgo',
    spec: [
        ...K.rb('SETGO', '集合碁', 'setgo'),
        // 積集合領域 (双方の石に接する空領域) は折半。奇数端数は白へ (コミ寄り)
        [K.ONE, `                    if (touchesBlack && !touchesWhite) blackTerritory += region.length;
                    else if (touchesWhite && !touchesBlack) whiteTerritory += region.length;`,
`                    if (touchesBlack && !touchesWhite) blackTerritory += region.length;
                    else if (touchesWhite && !touchesBlack) whiteTerritory += region.length;
                    else if (touchesBlack && touchesWhite) {
                        // 積集合 (∩): 双方に接する領域は集合の和として折半
                        blackTerritory += Math.floor(region.length / 2);
                        whiteTerritory += Math.ceil(region.length / 2);
                    }`],
        [K.ONE, K.INFO_ALGO, `            集合碁: 両勢力に接する空領域は「積集合」として黒白で折半される<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '領地は集合で決まる: 片方の色だけに接する空領域は通常通りその色の地。',
            '黒と白の両方に接する空領域 (積集合) は2分割して双方の地に加算。接触地帯も無駄にならない。',
            'どちらの色にも接しない補集合領域は従来通り0目。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
        // 全面黒、(5,0)だけ空き、(6,0)は白 → (5,0)は両色に接する積集合 → 折半
        board.fill(1);
        board[5] = 0; board[6] = 2;
        const t = calculateTerritory();
        assert('積集合は折半される', t.black === 0 && t.white === 1);
        // 黒だけに接する領域は黒の地
        board.fill(1); board[5] = 0;
        const t2 = calculateTerritory();
        assert('単色色囲みは従来通り', t2.black === 1 && t2.white === 0);
        // 白だけに接する領域は白の地
        board.fill(2); board[5] = 0;
        const t3 = calculateTerritory();
        assert('白単色領域も従来通り', t3.black === 0 && t3.white === 1);
    `,
};
