// RADENGO — 螺鈿碁: 漆黒 (敵の只中) に嵌め込まれた貝片は輝く — 敵に囲まれて生き残る石に+1目
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
    file: 'radengo.html',
    en: 'RADENGO',
    jp: '螺鈿碁',
    prefix: 'radengo',
    desc: '敵石2個以上に接し味方の無い貝片は螺鈿として輝く — 終局時+1目。',
    kind: 'stone',
    icon: 'radengo',
    spec: [
        ...K.rb('RADENGO', '螺鈿碁', 'radengo'),
        K.params([
            { key: 'raden_foe', label: '螺鈿化に必要な敵石数', min: 1, max: 4, def: 2, unit: '石' },
            { key: 'raden_bonus', label: '螺鈿石1個の得点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, `        function endGameByScore() {`,
`        // 螺鈿: 隣に敵石2個以上・味方0個の石は漆に嵌った貝片 — 1個+1目
        function radenBonus(player) {
            let b = 0;
            const opp = player === 1 ? 2 : 1;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player) continue;
                const nb = getNeighbors(i);
                const foe = nb.filter(n => board[n] === opp).length;
                const ally = nb.filter(n => board[n] === player).length;
                if (foe >= Math.max(1, P('raden_foe') || 2) && ally === 0) b += (P('raden_bonus') ?? 1);
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + radenBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + radenBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>螺鈿の輝き:</span> <strong>黒 \${radenBonus(1)} / 白 \${radenBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...K.STONE_MARKS_SPEC(`            // 輝く貝片: 螺鈿条件を満たす石に虹彩
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const opp = board[i] === 1 ? 2 : 1;
                    const nb = getNeighbors(i);
                    if (nb.filter(n => board[n] === opp).length >= 2 && !nb.some(n => board[n] === board[i])) {
                        const cx = padding + (i % BOARD_SIZE) * cellSize;
                        const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.4);
                        g.addColorStop(0, 'rgba(240,171,252,0.9)');
                        g.addColorStop(0.6, 'rgba(103,232,249,0.5)');
                        g.addColorStop(1, 'rgba(103,232,249,0)');
                        ctx.fillStyle = g;
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            螺鈿碁: 敵石2個以上に接し味方の無い石は漆に嵌った貝片 — 終局時+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '螺鈿: 終局時、敵石2個以上に隣接し味方の石に隣接しない自石は漆に嵌った貝片として輝き+1目。',
            '敵の只中に残った石が報われる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 4] = 1; // 黒 at (4,4)
        board[3 * BOARD_SIZE + 4] = 2; board[5 * BOARD_SIZE + 4] = 2; // 敵2個に挟まれる
        assert('敵2個に挟まれた石は貝片', radenBonus(1) === 1);
        board[4 * BOARD_SIZE + 5] = 1; // 味方が隣に来ると貝片ではない
        assert('味方が隣にあれば貝片ではない', radenBonus(1) === 0);
        board[4 * BOARD_SIZE + 5] = 0;
        board[4 * BOARD_SIZE + 3] = 2; // 敵3個
        assert('敵3個でも輝く', radenBonus(1) === 1);
        assert('白側にもボーナスは対称', radenBonus(2) === 0);
    `,
};
