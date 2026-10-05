// COBWEBGO — 蛛網碁: 蜘蛛の巣状盤。放射筋と環状筋の交点だけが着手点
const K = require('../gen_kit.js');
module.exports = {
    file: 'cobwebgo.html',
    en: 'COBWEBGO',
    jp: '蛛網碁',
    prefix: 'cobwebgo',
    desc: '蜘蛛の巣状の盤。環状筋と十字の放射筋の交点だけが着手点。',
    kind: 'stone',
    icon: 'cobwebgo',
    spec: [
        ...K.rb('COBWEBGO', '蛛網碁', 'cobwebgo'),
        K.params([
            { key: 'ring_step', label: '環状筋の間隔', min: 1, max: 4, def: 2, unit: '段', hint: '2=偶数距離の環のみ' },
            { key: 'spoke_on', label: '放射筋', options: [{ v: 1, l: 'あり (十字)' }, { v: 0, l: 'なし' }], def: 1 },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 蛛網: 中心からのチェビシェフ距離が偶数の環 + 十字の放射筋のみ着手可
        const WEB_C = Math.floor(BOARD_SIZE / 2);
        function isWebPoint(x, y) {
            const d = Math.max(Math.abs(x - WEB_C), Math.abs(y - WEB_C));
            const ring = d > 0 && d % Math.max(1, P('ring_step') || 2) === 0;
            const spoke = (x === WEB_C || y === WEB_C) && (P('spoke_on') ?? 1) === 1;
            return ring || spoke;
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!isWebPoint(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 巣の間の隙間は空洞
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_CAVE)],
        // 空洞を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        // 巣筋の描画: 環 + 十字筋を薄い糸で (星の直前)
        K.CUE_STARS(`            // 蛛網: 環状筋と放射筋を糸で描く
            {
                ctx.save();
                const cc = padding + WEB_C * cellSize;
                ctx.strokeStyle = 'rgba(226,232,240,0.30)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                for (let d = Math.max(1, P('ring_step') || 2); d <= WEB_C; d += Math.max(1, P('ring_step') || 2)) {
                    const r = d * cellSize;
                    ctx.strokeRect(cc - r, cc - r, r * 2, r * 2);
                }
                if ((P('spoke_on') ?? 1) === 1) {
                    ctx.beginPath();
                    ctx.moveTo(padding, cc); ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize, cc);
                    ctx.moveTo(cc, padding); ctx.lineTo(cc, padding + (BOARD_SIZE - 1) * cellSize);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            蛛網碁: 蜘蛛の巣状盤。環状筋と放射筋の交点だけが着手点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は蜘蛛の巣 — 偶数距離の環状筋と十字の放射筋だけが着手点。隙間は空洞。',
            '筋の交点でつながる連は形が特殊。通常の取り・コウ・パス終局。',
        ])],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const c = Math.floor(BOARD_SIZE / 2);
        resetGame();
        assert('環状筋の点は着手可', board[I(c + 2, c)] === 0 && isValidPlacement([{ x: c + 2, y: c }], 1) === true);
        assert('放射筋の点は着手可', board[I(c, c + 1)] === 0 && isValidPlacement([{ x: c, y: c + 1 }], 1) === true);
        assert('網の隙間は空洞', board[I(c + 1, c + 1)] === 3 && isValidPlacement([{ x: c + 1, y: c + 1 }], 1) === false);
        assert('中央は放射筋で着手可', isValidPlacement([{ x: c, y: c }], 1) === true);
    `,
};
