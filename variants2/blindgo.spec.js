// BLINDGO — 盲点碁: 各側に死角エリアがあり、自分の死角の石は幽霊のように見えない
const K = require('../gen_kit.js');
module.exports = {
    file: 'blindgo.html',
    en: 'BLINDGO',
    jp: '盲点碁',
    prefix: 'blindgo',
    desc: '盤の対角に死角エリア。自分の死角に置いた石は自分にも見えない。',
    kind: 'blind',
    spec: [
        ...K.rb('BLINDGO', '盲点碁', 'blindgo'),
        K.params([
            { key: 'blind_size', label: '死角エリアの大きさ', min: 1, max: 8, def: 4, hint: '盤サイズ13で4 (元は盤の1/3)' },
        ]),
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 盲点碁: 黒は左下三角、白は右上三角が死角エリア
        function inBlind(x, y, pl) {
            const k = P('blind_size') || Math.floor(BOARD_SIZE / 3);
            return pl === 1 ? (x + (BOARD_SIZE - 1 - y)) < k : ((BOARD_SIZE - 1 - x) + y) < k;
        }

        function drawBoardElements(padding, cellSize) {`],
        K.CUE_GRID(`            // 盲点碁: 両者の死角エリアを暗い三角で翳らせる
            {
                const k = P('blind_size') || Math.floor(BOARD_SIZE / 3);
                ctx.save();
                ctx.fillStyle = 'rgba(30, 27, 75, 0.16)';
                [[0, BOARD_SIZE - 1, 1, -1], [BOARD_SIZE - 1, 0, -1, 1]].forEach(([ox, oy, sx, sy]) => {
                    ctx.beginPath();
                    ctx.moveTo(padding + ox * cellSize, padding + oy * cellSize);
                    ctx.lineTo(padding + (ox + sx * k) * cellSize, padding + oy * cellSize);
                    ctx.lineTo(padding + ox * cellSize, padding + (oy + sy * k) * cellSize);
                    ctx.closePath();
                    ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                const blindA = (alive.length && inBlind(alive[0].x, alive[0].y, pc.player)) ? 0.15 : 1;
                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : blindA);`],
        ...K.STONE_MARKS_SPEC(`            // 死角の石には「?」マーク — 自分でもよく見えない
            {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.max(10, cellSize * 0.5) + 'px sans-serif';
                ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
                board.forEach((v, i) => {
                    if (v !== 1 && v !== 2) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    if (!inBlind(x, y, v)) return;
                    ctx.fillText('?', padding + x * cellSize, padding + y * cellSize);
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            盲点碁: 盤の対角に死角エリア。自分の死角にある自分の石はかすかにしか見えない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '黒は左下、白は右上の三角エリアが「死角」。死角内の自分の石は幽霊のように見える。',
            '死角の石も呼吸・取り・地には普通に働く — 見えにくい石を巡る読み合いが生まれる。',
        ])],
        // 死角に打った手は「死角」と一瞬表示して分かるようにする
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 盲点碁: 自分の死角に置いた石は「死角」テキストと輪で発火
            {
                const bc = move.cells[0];
                if (bc && inBlind(bc.x, bc.y, player)) {
                    const bi = bc.y * BOARD_SIZE + bc.x;
                    fxGlow(bi, '#818cf8', 700);
                    fxText(bi, '死角', '#a5b4fc', 1000);
                }
            }

            turn = opponent;`],
        // 死角エリアに漂う影の靄 — 「ここが見えない領域」を常時演出
        [K.ONE, '        let obstaclePainter = null;',
`        let obstaclePainter = null;
        // 盲点碁: 死角エリアに影の靄が漂う常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let k = 0; k < 10; k++) {
                const ph = now / 2600 + k * 1.93;
                const pl = k % 2 === 0 ? 1 : 2;
                const bx = (Math.sin(ph * 0.83 + k * 2.7) * 0.5 + 0.5) * BOARD_SIZE;
                const by = (Math.sin(ph * 1.17 + k * 4.1) * 0.5 + 0.5) * BOARD_SIZE;
                const x = Math.max(0, Math.min(BOARD_SIZE - 1, bx));
                const y = Math.max(0, Math.min(BOARD_SIZE - 1, by));
                if (!inBlind(x, y, pl)) continue;
                const cx = pad + x * cs, cy = pad + y * cs;
                ctx2.fillStyle = pl === 1 ? 'rgba(67,56,202,0.10)' : 'rgba(30,41,82,0.10)';
                ctx2.beginPath();
                ctx2.arc(cx, cy, cs * (0.55 + 0.2 * Math.sin(ph * 2)), 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('黒の死角は左下', inBlind(0, BOARD_SIZE - 1, 1) === true);
        assert('白の死角は右上', inBlind(BOARD_SIZE - 1, 0, 2) === true);
        assert('中央は死角でない', inBlind(Math.floor(BOARD_SIZE / 2), Math.floor(BOARD_SIZE / 2), 1) === false);
        assert('黒にとって右上は死角でない', inBlind(BOARD_SIZE - 1, 0, 1) === false);
        assert('通常着手可', isValidPlacement([{ x: 0, y: BOARD_SIZE - 1 }], 1) === true);
    `,
};
