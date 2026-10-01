// ZOGANGO — 象嵌碁: 異素材 (敵石) に接する石は象嵌の文様になる — 終局時+0.25目
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
    file: 'zogango.html',
    en: 'ZOGANGO',
    jp: '象嵌碁',
    prefix: 'zogango',
    desc: '敵石に1つでも隣接する石は象嵌に嵌め込まれた文様 — 終局時+0.25目。',
    kind: 'stone',
    icon: 'zogango',
    spec: [
        ...K.rb('ZOGANGO', '象嵌碁', 'zogango'),
        K.params([
            { key: 'zogan_pts', label: '文様1個の点', options: [{ v: 0, l: 'なし' }, { v: 0.25, l: '+0.25' }, { v: 0.5, l: '+0.5' }, { v: 1, l: '+1' }], def: 0.25, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        [K.ONE, `        function endGameByScore() {`,
`        // 象嵌: 敵石に1つ以上隣接する石は異素材の象嵌文様 — 1個+0.25目
        function zoganBonus(player) {
            let b = 0;
            const opp = player === 1 ? 2 : 1;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player) continue;
                if (getNeighbors(i).some(n => board[n] === opp)) b += (P('zogan_pts') ?? 0.25);
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + zoganBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + zoganBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>象嵌の文様:</span> <strong>黒 \${zoganBonus(1)} / 白 \${zoganBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            象嵌碁: 敵石に1つでも隣接する石は象嵌の文様 — 終局時+0.25目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '象嵌: 終局時、敵石に1つ以上隣接する自石は異素材を嵌め込んだ文様として+0.25目。',
            '敵との接点が多いほど文様は豊かになる — 接触戦が報われる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 4] = 1;
        assert('敵に接しない石は文様にならない', zoganBonus(1) === 0);
        board[4 * BOARD_SIZE + 5] = 2; // 敵が隣接
        assert('敵に接する石は象嵌+0.25', zoganBonus(1) === 0.25);
        assert('白石側も対称に象嵌', zoganBonus(2) === 0.25);
    `,
};
