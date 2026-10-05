// FORKGO — 分岐碁: Y字に分岐した2本の腕盤。分岐点 (中心) の争奪が核心
const K = require('../gen_kit.js');
module.exports = {
    file: 'forkgo.html',
    en: 'FORKGO',
    jp: '分岐碁',
    prefix: 'forkgo',
    desc: 'Y字に分岐した腕盤。分岐点を制する者が戦線を制する。',
    kind: 'stone',
    icon: 'forkgo',
    spec: [
        ...K.rb('FORKGO', '分岐碁', 'forkgo'),
        K.params([
            { key: 'fork_width', label: 'Y字の腕の太さ', min: 1, max: 3, def: 1, unit: '列', hint: '新しい対局で反映' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // Y字: 胴 (中央縦) + 左右の腕 (対角線) — 幅3
        const FORK_C = (BOARD_SIZE - 1) / 2;
        function isForkCell(x, y) {
            const N = BOARD_SIZE;
            // 胴: 中心より下の縦3列
            const _fw = P('fork_width') || 1;
            if (Math.abs(x - FORK_C) <= _fw && y >= FORK_C) return true;
            // 左腕: (0,0)-(c,c) の対角線 ±1
            if (y <= FORK_C && Math.abs(x - y) <= _fw) return true;
            // 右腕: (N-1,0)-(c,c) の対角線 ±1
            if (y <= FORK_C && Math.abs(x - (N - 1 - y)) <= _fw) return true;
            return false;
        }`],
        // Y字の外は深淵
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let i = 0; i < board.length; i++) {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                if (!isForkCell(x, y)) board[i] = 3;
            }`],
        // 深淵の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_RIFT('rgba(96,140,200,0.5)'))],
        // 分岐点の描画
        ...K.STONE_MARKS_SPEC(`            {
                const cc = padding + FORK_C * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(180,83,9,0.8)';
                ctx.lineWidth = Math.max(2, cellSize * 0.09);
                ctx.beginPath();
                ctx.arc(cc, cc, cellSize * 0.40, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        // 深淵を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_BASE, `            分岐碁: Y字に分岐した腕盤。分岐点 (橙の輪) を制する者が戦線を制する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手できるのはY字の腕盤のみ (胴1本+対角の腕2本、幅3)。',
            '中央の分岐点を押さえれば両腕の連絡を断てる。腕先は死にやすい袋小路。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = (BOARD_SIZE - 1) / 2;
        assert('分岐点は打てる', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('胴の下端は打てる', isValidPlacement([{ x: c, y: BOARD_SIZE - 1 }], 1) === true);
        assert('左腕の先は打てる', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('Y字の外は打てない', isValidPlacement([{ x: c, y: c - 2 }], 1) === false);
        assert('Y字の外は深淵', board[I(c, c - 2)] === 3);
    `,
};
