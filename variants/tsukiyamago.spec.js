// TSUKIYAMAGO — 築山碁: 星点の「築山」を築くと庭の主景に。過半数占拠で即勝ち
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
    file: 'tsukiyamago.html',
    en: 'TSUKIYAMAGO',
    jp: '築山碁',
    prefix: 'tsukiyamago',
    desc: '星点は築山候補地。半数以上を占拠すれば主景完成で即勝ち。占拠ごとに+4目。',
    kind: 'stone',
    icon: 'tsukiyamago',
    spec: [
        ...K.rb('TSUKIYAMAGO', '築山碁', 'tsukiyamago'),
        K.params([
            { key: 'hill_bonus', label: '築山ごとのボーナス', min: 1, max: 12, def: 4, unit: '目' },
            { key: 'win_ratio', label: '即勝ちに必要な占有率', min: 0.3, max: 1, step: 0.05, def: 0.5 },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 築山: 占拠している星点の数
        function hillCount(player) {
            return getStarPoints(BOARD_SIZE).filter(p => board[p.y * BOARD_SIZE + p.x] === player).length;
        }
        function hillBonus(player) { return hillCount(player) * (P('hill_bonus') || 4); }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + hillBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + hillBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>築山:</span> <strong>黒 \${hillBonus(1)} / 白 \${hillBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 築山判定: 着手側が山ポイントの過半数を占めていれば即勝ち
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 築山ルール: 星点の過半数を自石で占拠 → 主景完成で即勝ち
            {
                const need = Math.ceil(getStarPoints(BOARD_SIZE).length * (P('win_ratio') || 0.5));
                if (hillCount(player) >= need) {
                    const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxGlow(mi, '#facc15', 950);
                    fxText(mi, '築山完成!', '#f59e0b', 1400);
                    fxShake(5, 360);
                    winByRule(player, '築山完成', '築山の過半数を占拠して庭の主景にしました'); return;
                }
            }

            turn = opponent;`],
        // 山の描画: 空いている星点に小さな築山を描く
        K.CUE_STARS(`            // 築山: 空の星点に小さな山を描く
            {
                getStarPoints(BOARD_SIZE).forEach(p => {
                    if (board[p.y * BOARD_SIZE + p.x] !== 0) return;
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    ctx.save();
                    ctx.fillStyle = 'rgba(110,90,60,0.35)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.24);
                    ctx.lineTo(cx - cellSize * 0.28, cy + cellSize * 0.18);
                    ctx.lineTo(cx + cellSize * 0.28, cy + cellSize * 0.18);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`'築山 黒' + hillCount(1) + '/白' + hillCount(2) + ' (要' + Math.ceil(getStarPoints(BOARD_SIZE).length * (P('win_ratio') || 0.5)) + ')'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            築山碁: 星点は築山候補地。過半数を占拠すると庭の主景が完成し即勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '星点は「築山候補地」。着手終了時にその過半数を自石で占めていれば築山完成で即勝ち。',
            '即勝ちに届かなくても、終局時に占拠した築山ごとに+4目のボーナス。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const hp = getStarPoints(BOARD_SIZE);
        assert('星点がある', hp.length >= 5);
        executeMove({ cells: [hp[0]] }, 1);
        executeMove({ cells: [hp[1]] }, 1);
        assert('2山ではまだ続行', gameOver === false);
        executeMove({ cells: [hp[2]] }, 1);
        assert('3山で築山完成', gameOver === true);
        assert('結果に築山', !!gameResultData && gameResultData.title.indexOf('築山') >= 0);
    `,
};
