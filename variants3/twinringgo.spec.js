// TWINRINGGO — 双環碁: 2つの環状盤が1点で繋がる8の字盤
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
    file: 'twinringgo.html',
    en: 'TWINRINGGO',
    jp: '双環碁',
    prefix: 'twinringgo',
    desc: '2つの環が1点で繋がる8の字盤。接点の橋渡しが両環の命綱。',
    kind: 'stone',
    icon: 'twinringgo',
    spec: [
        ...K.rb('TWINRINGGO', '双環碁', 'twinringgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 双環: 左右の環 (半径 R の帯) が中央の接点1点で繋がる8の字
        const TR_MID = (BOARD_SIZE - 1) / 2;
        const TR_R = BOARD_SIZE * 0.20;
        const TR_C1 = TR_MID - TR_R, TR_C2 = TR_MID + TR_R;
        const TR_W = 0.62;
        function isRing(x, y) {
            const d1 = Math.hypot(x - TR_C1, y - TR_MID);
            const d2 = Math.hypot(x - TR_C2, y - TR_MID);
            return Math.abs(d1 - TR_R) <= TR_W || Math.abs(d2 - TR_R) <= TR_W;
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!isRing(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 環の外側は深淵
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_RIFT('#1e293b'))],
        ...K.WALL_GUARD_SPEC,
        K.CUE_GRID(`            // 双環: 淡い環のガイドライン
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.setLineDash([cellSize * 0.14, cellSize * 0.10]);
                [[TR_C1, TR_MID], [TR_C2, TR_MID]].forEach(([cx0, cy0]) => {
                    ctx.beginPath();
                    ctx.arc(padding + cx0 * cellSize, padding + cy0 * cellSize, TR_R * cellSize, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            双環碁: 2つの環が1点で繋がる8の字盤<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は2つの環状の帯。内側の窪みと外側は深淵 (着手不可・呼吸なし)。',
            '2つの環は中央の接点付近でのみ繋がる — 接点は両環の生命線。',
            '環の内側を地として囲うか、接点を押さえて敵を両断するか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const m = Math.floor(BOARD_SIZE / 2);
        assert('接点付近は陸地', isRing(m, m) === true || isRing(m - 1, m) === true || isRing(m + 1, m) === true);
        assert('角は深淵', board[I(0, 0)] === 3);
        assert('環の上は着手できる', (() => {
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[I(x, y)] === 0 && isValidPlacement([{ x, y }], 1)) return true;
            }
            return false;
        })());
        assert('深淵には着手できない', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
    `,
};
