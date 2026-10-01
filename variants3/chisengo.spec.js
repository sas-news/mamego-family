// CHISENGO — 池泉碁: 中央の池(水区域)は着手不可。池に隣接する景石が得点になる
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
    file: 'chisengo.html',
    en: 'CHISENGO',
    jp: '池泉碁',
    prefix: 'chisengo',
    desc: '中央の十字形の池は打てない水場。池に面する景石ごとに+2目の庭師点。',
    kind: 'stone',
    icon: 'chisengo',
    spec: [
        ...K.rb('CHISENGO', '池泉碁', 'chisengo'),
        K.params([
            { key: 'pond_pts', label: '景石ボーナス', min: 0, max: 5, def: 2, unit: '目/個' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 池泉: 中央の十字形の池 (board=3 = 水場・着手不可・呼吸点にもならない)
        function pondIdxs() {
            const c = Math.floor(BOARD_SIZE / 2);
            return [c * BOARD_SIZE + c, (c - 1) * BOARD_SIZE + c, (c + 1) * BOARD_SIZE + c,
                    c * BOARD_SIZE + c - 1, c * BOARD_SIZE + c + 1];
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            // 池を設置
            pondIdxs().forEach(i => { board[i] = 3; });`],
        // 景石ボーナス: 池に隣接する自石ごとに+2
        [K.ONE, `        function endGameByScore() {`,
`        function pondBonus(player) {
            const pond = new Set(pondIdxs());
            let n = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player) continue;
                if (getNeighbors(i).some(m => pond.has(m))) n++;
            }
            return n * (P('pond_pts') ?? 2);
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + pondBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + pondBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>景石:</span> <strong>黒 \${pondBonus(1)} / 白 \${pondBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 水面テクスチャ + 壁ガード
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1d6fa5', '#0a2f4a'))],
        ...K.WALL_GUARD_SPEC,
        ...K.EVENT_CHIP_SPEC(`'景石 黒' + (pondBonus(1) / Math.max(1, P('pond_pts') ?? 2)) + '/白' + (pondBonus(2) / Math.max(1, P('pond_pts') ?? 2))`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            池泉碁: 中央の十字形の池は着手不可の水場。池に面した景石ごとに+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '中央の十字形は「池」— 水場なので着手できず、呼吸点にもならない (壁と同じ)。',
            '池に隣接する自分の石は「景石」として終局時に1つ+2目。池を眺める位置取りが勝負。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const c = Math.floor(BOARD_SIZE / 2);
        assert('池には着手不可', isValidPlacement([{ x: c, y: c }], 1) === false);
        executeMove({ cells: [{ x: c - 2, y: c }] }, 1); // 池の西に景石
        assert('景石ボーナス+2', pondBonus(1) === 2 && pondBonus(2) === 0);
        executeMove({ cells: [{ x: c - 1, y: c - 1 }] }, 1); // 池の北西 (腕に隣接)
        assert('景石2つで+4', pondBonus(1) === 4);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
