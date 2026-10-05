// MAKIEGO — 蒔絵碁: 同色で隣接するほど文様が描かれる — 同色の隣接辺1本ごとに+0.25目
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
    file: 'makiego.html',
    en: 'MAKIEGO',
    jp: '蒔絵碁',
    prefix: 'makiego',
    desc: '同色の石が隣接する辺1本ごとに金粉+0.25目。繋げるほど文様が豊かになる。',
    kind: 'stone',
    icon: 'makiego',
    spec: [
        ...K.rb('MAKIEGO', '蒔絵碁', 'makiego'),
        K.params([
            { key: 'edge_pts', label: '隣接辺の得点', min: 0, max: 1, def: 0.25, step: 0.05, hint: '同色隣接辺1本ごとの終局加点' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, `        function endGameByScore() {`,
`        // 蒔絵: 同色の隣接辺1本ごとに+0.25目 (各辺を重複なく数える)
        function makiBonus(player) {
            let edges = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                if (x + 1 < BOARD_SIZE && board[i + 1] === player) edges++;
                if (y + 1 < BOARD_SIZE && board[i + BOARD_SIZE] === player) edges++;
            }
            return edges * (P('edge_pts') ?? 0.25);
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + makiBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + makiBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>蒔絵の文様:</span> <strong>黒 \${makiBonus(1)} / 白 \${makiBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            蒔絵碁: 同色の石が隣接する辺1本ごとに金粉+0.25目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '蒔絵の文様: 同じ色の石が上下左右に隣接する辺1本ごとに終局時+0.25目。',
            '細かく繋げて文様を豊かに描こう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('石が無ければ文様0', makiBonus(1) === 0);
        board[0] = 1; board[1] = 1; board[BOARD_SIZE] = 1; // L字: 辺2本
        assert('同色の隣接辺は2本', makiBonus(1) === 0.5);
        board[3] = 2; board[4] = 2; board[5] = 2; board[4 + BOARD_SIZE] = 2; // 白: 辺3本
        assert('白の文様も数える', makiBonus(2) === 0.75);
    `,
};
