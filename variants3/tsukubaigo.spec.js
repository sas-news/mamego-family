// TSUKUBAIGO — 蹲踞碁: 蹲踞(つくばい)のある4点で手を清める。置くと自軍の損石が2つ洗い流される
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
    file: 'tsukubaigo.html',
    en: 'TSUKUBAIGO',
    jp: '蹲踞碁',
    prefix: 'tsukubaigo',
    desc: '四隅の蹲踞(つくばい)に置くと手が清められ、取られた自石2つ分が帳消しになる。',
    kind: 'stone',
    icon: 'tsukubaigo',
    spec: [
        ...K.rb('TSUKUBAIGO', '蹲踞碁', 'tsukubaigo'),
        K.params([
            { key: 'wash', label: '洗い流すアゲハマ数', min: 1, max: 6, def: 2, unit: '個' },
            { key: 'tsukubai_bonus', label: '蹲踞の終局ボーナス', min: 1, max: 10, def: 3, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 蹲踞: 四隅の低い水盤の点
        function tsukubaiIdxs() {
            const n = BOARD_SIZE;
            return [2 * n + 2, 2 * n + (n - 3), (n - 3) * n + 2, (n - 3) * n + (n - 3)];
        }`],
        // 蹲踞清め + 心静めボーナス
        [K.ONE, `        function endGameByScore() {`,
`        function tsukubaiBonus(player) {
            return tsukubaiIdxs().filter(i => board[i] === player).length * (P('tsukubai_bonus') || 3);
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + tsukubaiBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + tsukubaiBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>蹲踞:</span> <strong>黒 \${tsukubaiBonus(1)} / 白 \${tsukubaiBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 蹲踞で手を清める: 着手点が蹲踞なら相手のアゲハマ (自分の損失) を2つ洗い流す
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 蹲踞ルール: 蹲踞点に置くと手を清め — 相手のアゲハマを2つ洗い流す
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (tsukubaiIdxs().includes(mi)) {
                    const washed = Math.min(P('wash') || 2, captures[opponent]);
                    if (washed > 0) {
                        captures[opponent] -= washed;
                        fxText(mi, '清め -' + washed, '#38bdf8', 1300);
                    } else {
                        fxText(mi, '清め', '#7dd3fc', 1100);
                    }
                    fxGlow(mi, '#38bdf8', 800);
                }
            }

            turn = opponent;`],
        // 蹲踞の描画: 四隅に小さな水盤
        K.CUE_STARS(`            // 蹲踞: 四隅の水盤 (空点のみ描く)
            {
                tsukubaiIdxs().forEach(i => {
                    if (board[i] !== 0) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(80,110,140,0.6)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.26, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(125,211,252,0.35)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.16, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`'蹲踞 黒' + (tsukubaiBonus(1) / (P('tsukubai_bonus') || 3)) + '/白' + (tsukubaiBonus(2) / (P('tsukubai_bonus') || 3))`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            蹲踞碁: 四隅の蹲踞(つくばい)に置くと手が清められ、取られた自石2つ分が帳消し。終局時+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の四隅にある「蹲踞」(つくばい=手を清める低い水盤) に着手すると、その瞬間に相手のアゲハマが2つ洗い流される。',
            '取り返しの効かない損失を帳消しにする救済点。終局時に占有していればさらに+3目。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 3 };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('蹲踞に置ける', board[2 * BOARD_SIZE + 2] === 1);
        assert('清めでアゲハマ減少', captures[2] === 1);
        assert('蹲踞ボーナス+3', tsukubaiBonus(1) === 3);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 2) === true);
    `,
};
