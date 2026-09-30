// FADEDGO — 褪色碁: 石は古いほど色が褪せて薄く表示される
const K = require('../gen_kit.js');
module.exports = {
    file: 'fadedgo.html',
    en: 'FADEDGO',
    jp: '褪色碁',
    prefix: 'fadedgo',
    desc: '石は古いほど薄く褪せる。盤面の「年齢」が一目で分かる。',
    kind: 'fade',
    spec: [
        ...K.rb('FADEDGO', '褪色碁', 'fadedgo'),
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 褪色碁: 置いてから時間が経つほど石は薄くなる (下限0.22)
        function fadeAlpha(pc) {
            const age = pc.at === undefined ? 99 : history.length - pc.at;
            return Math.max(0.22, 1 - age * 0.07);
        }

        function drawBoardElements(padding, cellSize) {`],
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length
            });`],
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : fadeAlpha(pc));`],
        ...K.STONE_MARKS_SPEC(`            // 最古の石にはセピアの年輪マーク
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(161, 98, 7, 0.5)';
                ctx.setLineDash([cellSize * 0.07, cellSize * 0.07]);
                ctx.lineWidth = Math.max(1.1, cellSize * 0.04);
                pieces.forEach(pc => {
                    if (pc.at === undefined || history.length - pc.at < 11) return;
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                        ctx.beginPath();
                        ctx.arc(padding + p.x * cellSize, padding + p.y * cellSize, cellSize * 0.44, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            褪色碁: 石は古いほど色が褪せて薄くなる。着手の新陳代謝が見える盤<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いてから手数が経つほど石は薄く褪色する (最低でも22%の濃さは残る)。',
            '古い石ほど消えかけて見える — どの連が「置き忘れ」かが一目で分かる視覚ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        const old = pieces[0];
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        const fresh = pieces[pieces.length - 1];
        assert('新しい石は濃い', fadeAlpha(fresh) === 1);
        assert('古い石は薄い', fadeAlpha(old) < fadeAlpha(fresh));
        const pts = [];
        for (let j = 0; j < board.length && pts.length < 20; j++) if (board[j] === 0) pts.push(j);
        pts.forEach((j, i) => executeMove({ cells: [{ x: j % BOARD_SIZE, y: Math.floor(j / BOARD_SIZE) }] }, i % 2 === 0 ? 1 : 2));
        assert('褪色に下限がある', fadeAlpha(old) >= 0.22);
    `,
};
