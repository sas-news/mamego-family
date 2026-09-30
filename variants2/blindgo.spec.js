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
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 盲点碁: 黒は左下三角、白は右上三角が死角エリア
        function inBlind(x, y, pl) {
            const k = Math.floor(BOARD_SIZE / 3);
            return pl === 1 ? (x + (BOARD_SIZE - 1 - y)) < k : ((BOARD_SIZE - 1 - x) + y) < k;
        }

        function drawBoardElements(padding, cellSize) {`],
        K.CUE_GRID(`            // 盲点碁: 両者の死角エリアを暗い三角で翳らせる
            {
                const k = Math.floor(BOARD_SIZE / 3);
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
        [K.ONE, K.INFO_ALGO, `            盲点碁: 盤の対角に死角エリア。自分の死角にある自分の石はかすかにしか見えない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '黒は左下、白は右上の三角エリアが「死角」。死角内の自分の石は幽霊のように見える。',
            '死角の石も呼吸・取り・地には普通に働く — 見えにくい石を巡る読み合いが生まれる。',
        ])],
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
