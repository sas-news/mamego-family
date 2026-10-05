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
        K.params([
            { key: 'dim_grow', label: '薄暮エリアの広さ調整', min: -2, max: 2, def: 0, step: 0.5, hint: '−で薄暮が広く、+で狭くなる' },
        ]),
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 薄暮碁: 中央1/2領域の外側は薄暮エリア (広さは設定で微調整可)
        function isDim(x, y) {
            const c = (BOARD_SIZE - 1) / 2;
            const t = BOARD_SIZE / 4 + (P('dim_grow') ?? 0);
            return Math.max(Math.abs(x - c), Math.abs(y - c)) > t;
        }

        function drawBoardElements(padding, cellSize) {`],
        K.CUE_GRID(`            // 薄暮: 中央領域だけ明るく、外周を宵闇で覆う
            {
                const c = (BOARD_SIZE - 1) / 2, rr = Math.max(0.5, BOARD_SIZE / 4 + (P('dim_grow') ?? 0));
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
        [K.ONE, K.INFO_BASE, `            薄暮碁: 明るいのは中央領域だけ。外周の石は薄暮に霞んで読みにくい<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の中央1/2領域だけが明るい。外周の薄暮エリアの石は薄く霞んで見える。',
            '隅での細かい戦いは薄暮の中 — 地取りは中央が読みやすく、隅は肌感覚が物を言う。',
        ])],
        // 薄暮エリアを舞う蛍火 — 「ここは霞んでいる」ことを常時演出
        [K.ONE, '        let obstaclePainter = null;',
`        let obstaclePainter = null;
        // 薄暮碁: 外周の薄暮に蛍火が漂い、夕日の残照が境界で揺れる
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let k = 0; k < 14; k++) {
                const ph = now / 3000 + k * 2.39;
                const x = (Math.sin(ph * 0.71 + k * 3.1) * 0.5 + 0.5) * (BOARD_SIZE - 1);
                const y = (Math.sin(ph * 0.97 + k * 1.7) * 0.5 + 0.5) * (BOARD_SIZE - 1);
                if (!isDim(x, y)) continue;
                const tw = Math.sin(ph * 3.3 + k);
                if (tw < 0.1) continue;
                ctx2.globalAlpha = 0.10 + tw * 0.22;
                ctx2.fillStyle = '#fdba74';
                ctx2.beginPath();
                ctx2.arc(pad + x * cs, pad + y * cs, cs * 0.07, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
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
