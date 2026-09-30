// DIMGO — 薄暮碁: 中央領域だけが明るく、外周は薄暮に霞む
const K = require('../gen_kit.js');
module.exports = {
    file: 'dimgo.html',
    en: 'DIMGO',
    jp: '薄暮碁',
    prefix: 'dimgo',
    desc: '明るいのは中央だけ。外周の石は薄暮に霞んで読みにくい。',
    kind: 'dusk',
    spec: [
        ...K.rb('DIMGO', '薄暮碁', 'dimgo'),
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 薄暮碁: 中央1/2領域の外側は薄暮エリア
        function isDim(x, y) {
            const c = (BOARD_SIZE - 1) / 2;
            return Math.max(Math.abs(x - c), Math.abs(y - c)) > BOARD_SIZE / 4;
        }

        function drawBoardElements(padding, cellSize) {`],
        K.CUE_GRID(`            // 薄暮: 中央領域だけ明るく、外周を宵闇で覆う
            {
                const c = (BOARD_SIZE - 1) / 2, rr = BOARD_SIZE / 4;
                const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                const x0 = padding + (c - rr) * cellSize - cellSize * 0.5;
                const y0 = padding + (c - rr) * cellSize - cellSize * 0.5;
                ctx.save();
                ctx.beginPath();
                ctx.rect(-cellSize, -cellSize, w + cellSize * 2, w + cellSize * 2);
                ctx.rect(x0, y0, (2 * rr + 1) * cellSize, (2 * rr + 1) * cellSize);
                ctx.fillStyle = 'rgba(30, 27, 75, 0.20)';
                try { ctx.fill('evenodd'); } catch (e) { ctx.fill(); }
                // 明るさの境界にオレンジの残照ライン
                ctx.strokeStyle = 'rgba(251, 146, 60, 0.40)';
                ctx.setLineDash([cellSize * 0.2, cellSize * 0.15]);
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                ctx.strokeRect(x0, y0, (2 * rr + 1) * cellSize, (2 * rr + 1) * cellSize);
                ctx.restore();
            }`),
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                const dimA = (alive.length && isDim(alive[0].x, alive[0].y)) ? 0.55 : 1;
                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : dimA);`],
        [K.ONE, K.INFO_ALGO, `            薄暮碁: 明るいのは中央領域だけ。外周の石は薄暮に霞んで読みにくい<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の中央1/2領域だけが明るい。外周の薄暮エリアの石は薄く霞んで見える。',
            '隅での細かい戦いは薄暮の中 — 地取りは中央が読みやすく、隅は肌感覚が物を言う。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const c = Math.floor((BOARD_SIZE - 1) / 2);
        assert('中央は薄暮でない', isDim(c, c) === false);
        assert('隅は薄暮', isDim(0, 0) === true);
        assert('端の中点も薄暮', isDim(c, 0) === true);
        assert('薄暮エリアでも着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
