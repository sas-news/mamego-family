// UNBANGO — 雲版碁: 8手ごとに雲版(うんぱん)が鳴り禅堂の時が進む。両者に+1の功徳
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
    file: 'unbango.html',
    en: 'UNBANGO',
    jp: '雲版碁',
    prefix: 'unbango',
    desc: '8手ごとに雲版が鳴って禅の刻が進む。鳴るたびに両者へ+1目の功徳。',
    kind: 'stone',
    icon: 'unbango',
    spec: [
        ...K.rb('UNBANGO', '雲版碁', 'unbango'),
        K.params([
            { key: 'bell_interval', label: '雲版の間隔', min: 2, max: 20, def: 8, unit: '手' },
            { key: 'merit', label: '雲版ごとの功徳', min: 1, max: 5, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        // 雲版: 合計8手ごとに鳴り両者+1
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 雲版ルール: 合計8手ごとに雲版が鳴り、両者に+1の功徳 (対称)
            if (history.length % Math.max(1, P('bell_interval') || 8) === 0) {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                captures[1] += P('merit') || 1;
                captures[2] += P('merit') || 1;
                fxGlow(mi, '#94a3b8', 900);
                fxText(mi, '雲版の刻', '#cbd5e1', 1300);
                fxShake(4, 300);
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'雲版まで ' + (Math.max(1, P('bell_interval') || 8) - (history.length % Math.max(1, P('bell_interval') || 8))) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            雲版碁: 合計8手ごとに雲版が鳴って禅堂の時が進み、両者へ+1目の功徳<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手数の合計が8の倍数になるたび雲版(禅堂の時告げ板)が鳴り、時が進む。',
            '鳴るたび両者に+1目 — 誰の手で鳴っても功徳は均等の対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        for (let i = 0; i < 7; i++) executeMove({ cells: [{ x: i * 2, y: 0 }] }, i % 2 === 0 ? 1 : 2);
        assert('7手ではまだ鳴らない', captures[1] === 0 && captures[2] === 0);
        executeMove({ cells: [{ x: 0, y: 2 }] }, 1);
        assert('8手目で両者+1', captures[1] === 1 && captures[2] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
