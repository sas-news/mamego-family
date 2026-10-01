// KITEFLYGO — 凧揚碁: 敵陣に深く侵入した連ほど高く凧を揚げている。採点で高さボーナス
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kiteflygo.html',
    en: 'KITEFLYGO',
    jp: '凧揚碁',
    prefix: 'kiteflygo',
    desc: '敵陣深くに伸びる連ほど凧が高い。採点時に最大高度がボーナス。',
    kind: 'stone',
    icon: 'kiteflygo',
    spec: [
        ...K.rb('KITEFLYGO', '凧揚碁', 'kiteflygo'),
        K.params([
            { key: 'kite_mult', label: '高度ボーナス倍率', min: 0, max: 4, def: 1, step: 0.5, hint: '侵入深度×この倍率' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 高度ボーナス: 双方の半分を跨ぐ連の侵入深度を採点に加算
        [K.ONE, `        function endGameByScore() {`,
`        // 凧高度: 両半分を跨ぐ自連の敵陣侵入深度 (最高値)
        function kiteBonus(player) {
            const mid = (BOARD_SIZE - 1) / 2;
            const seen = new Set();
            let best = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || seen.has(i)) continue;
                const grp = getConnectedGroup(i, player);
                grp.forEach(g => seen.add(g));
                const ys = grp.map(g => Math.floor(g / BOARD_SIZE));
                const lo = Math.min(...ys), hi = Math.max(...ys);
                // 双方の半分に跨る連のみ (凧と糸)
                if (lo < mid && hi > mid) {
                    // 黒は上 (白陣) へ、白は下 (黒陣) へ侵入した深さ
                    const depth = player === 1 ? mid - lo : hi - mid;
                    best = Math.max(best, depth);
                }
            }
            return Math.round(best * (P('kite_mult') ?? 1));
        }
        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + kiteBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + kiteBonus(2);`],
        // 中央線と高度チップ
        K.CUE_GRID(`            // 中間線: 敵陣境界 (水平ダッシュ線)
            {
                const my = padding + ((BOARD_SIZE - 1) / 2) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(56,130,246,0.35)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                ctx.setLineDash([cellSize * 0.3, cellSize * 0.18]);
                ctx.beginPath();
                ctx.moveTo(padding - cellSize * 0.5, my + cellSize * 0.5);
                ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize + cellSize * 0.5, my + cellSize * 0.5);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'凧高度: 黒' + kiteBonus(1) + ' / 白' + kiteBonus(2)`),
        [K.ONE, K.INFO_ALGO, `            凧揚碁: 両半分に跨る連の敵陣侵入深度が採点ボーナスになる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自連が中央線を跨いで敵陣に深く伸びているほど、凧が高く揚がっている。',
            '採点時に最大高度 (跨ぐ連の最深行までの距離) が点数ボーナスになる。',
            '連が切られれば凧も落ちる — 糸 (連の繋がり) を守りながら高く揚げよう。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const mid = (BOARD_SIZE - 1) / 2;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 跨がない連は高度0
        board[I(4, 4)] = 1; board[I(4, 5)] = 1;
        assert('跨がない連は高度0', kiteBonus(1) === 0);
        // 黒の連が中央線を跨いで白陣 (上半分) へ y=3 まで伸びる → 高度3
        board[I(4, mid)] = 1; board[I(4, mid + 1)] = 1; board[I(4, mid - 2)] = 1; board[I(4, mid - 3)] = 1;
        assert('跨ぐ連は高度あり', kiteBonus(1) === 3);
        // 白も同様に黒陣 (下半分) へ y=9 まで伸びる → 高度3
        board[I(8, mid)] = 2; board[I(8, mid - 1)] = 2; board[I(8, mid + 1)] = 2; board[I(8, mid + 2)] = 2; board[I(8, mid + 3)] = 2;
        assert('白も対称に高度あり', kiteBonus(2) === 3);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
