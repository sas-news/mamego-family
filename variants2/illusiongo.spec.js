// ILLUSIONGO — 幻影碁: 中央3路帯の石は幻影となり、敵色に見える
const K = require('../gen_kit.js');
module.exports = {
    file: 'illusiongo.html',
    en: 'ILLUSIONGO',
    jp: '幻影碁',
    prefix: 'illusiongo',
    desc: '中央の帯は幻影地帯。そこに置いた石は敵色に見える。',
    kind: 'illusion',
    spec: [
        ...K.rb('ILLUSIONGO', '幻影碁', 'illusiongo'),
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 幻影碁: 中央3行の帯は幻影エリア — その中の石は敵色に見える
        function inIllusion(x, y) {
            const c = (BOARD_SIZE - 1) / 2;
            return Math.abs(y - c) <= 1;
        }

        function drawBoardElements(padding, cellSize) {`],
        K.CUE_GRID(`            // 幻影帯を虹のうねりで示す
            {
                const c = (BOARD_SIZE - 1) / 2;
                ctx.save();
                ctx.fillStyle = 'rgba(168, 85, 247, 0.10)';
                ctx.fillRect(0, padding + (c - 1 - 0.5) * cellSize,
                    padding * 2 + (BOARD_SIZE - 1) * cellSize, cellSize * 3);
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
                ctx.setLineDash([cellSize * 0.18, cellSize * 0.14]);
                ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                [-1, 1].forEach(s => {
                    ctx.beginPath();
                    ctx.moveTo(0, padding + (c + s * 1.5 - s * 0.5) * cellSize);
                    ctx.lineTo(padding * 2 + (BOARD_SIZE - 1) * cellSize, padding + (c + s * 1.5 - s * 0.5) * cellSize);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                const ill = alive.length && inIllusion(alive[0].x, alive[0].y);
                const if_ = ill ? (pc.player === 1 ? currentTheme.p2Fill : currentTheme.p1Fill) : fill;
                const is_ = ill ? (pc.player === 1 ? currentTheme.p2Stroke : currentTheme.p1Stroke) : stroke;
                drawPieceShape(alive, padding, cellSize, if_, is_, isDead ? 0.35 : 1);`],
        ...K.STONE_MARKS_SPEC(`            // 幻影帯の石に薄紫の輪
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
                ctx.setLineDash([cellSize * 0.08, cellSize * 0.08]);
                ctx.lineWidth = Math.max(1.1, cellSize * 0.04);
                board.forEach((v, i) => {
                    if (v !== 1 && v !== 2) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    if (!inIllusion(x, y)) return;
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.46, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            幻影碁: 中央3路の帯は幻影地帯。その中の石は敵色に見える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の中央3行は幻影地帯 (薄紫の帯)。その中の石は全て敵色に見える。',
            '幻影は見た目だけ — 取り・呼吸・地は実際の色で判定される。帯の中を疑ってかかれ。',
        ])],
        // 幻影帯に打つと「幻影」と一瞬表示
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 幻影碁: 幻影帯への着手は「幻影」テキストと虹色の輪で発火
            {
                const ic = move.cells[0];
                if (ic && inIllusion(ic.x, ic.y)) {
                    const ii = ic.y * BOARD_SIZE + ic.x;
                    fxGlow(ii, '#c084fc', 700);
                    fxText(ii, '幻影', '#d8b4fe', 1000);
                }
            }

            turn = opponent;`],
        // 幻影帯を横切る虹のうねり — 「ここは見た目が嘘をつく帯」を常時演出
        [K.ONE, '        let obstaclePainter = null;',
`        let obstaclePainter = null;
        // 幻影碁: 幻影帯を虹の光の筋が揺らめきながら流れる常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            const c = (BOARD_SIZE - 1) / 2;
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            for (let k = 0; k < 3; k++) {
                const ph = (now / 2200 + k * 0.33) % 1;
                const lx = ph * w;
                const ly = pad + (c - 0.5 + k) * cs + Math.sin(now / 600 + k * 2.4) * cs * 0.2;
                const g = ctx2.createLinearGradient(lx - cs * 2, ly, lx + cs * 2, ly);
                g.addColorStop(0, 'rgba(192,132,252,0)');
                g.addColorStop(0.5, 'rgba(192,132,252,0.28)');
                g.addColorStop(1, 'rgba(192,132,252,0)');
                ctx2.strokeStyle = g;
                ctx2.lineWidth = Math.max(1.5, cs * 0.10);
                ctx2.beginPath();
                ctx2.moveTo(lx - cs * 2, ly);
                ctx2.lineTo(lx + cs * 2, ly);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        const c = (BOARD_SIZE - 1) / 2;
        assert('中央行は幻影帯', inIllusion(Math.floor(c), Math.floor(c)) === true);
        assert('帯の端も幻影', inIllusion(0, Math.floor(c) - 1) === true);
        assert('帯の外は幻影でない', inIllusion(0, 0) === false);
        assert('幻影帯でも着手可', isValidPlacement([{ x: Math.floor(c), y: Math.floor(c) }], 1) === true);
    `,
};
