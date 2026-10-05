// FADEDGO — 褪色碁: 石は古いほど色が褪せて薄く表示される
const K = require('../gen_kit.js');
module.exports = {
    file: 'fadedgo.html',
    en: 'FADEDGO',
    jp: '褪色碁',
    prefix: 'fadedgo',
    desc: '石は古いほど薄く褪せる。盤面の「年齢」が一目で分かる。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'fade',
    spec: [
        ...K.rb('FADEDGO', '褪色碁', 'fadedgo'),
        K.params([
            { key: 'fade_rate', label: '褪色の速さ', min: 0.02, max: 0.2, def: 0.07, step: 0.01, hint: '1手ごとの濃さ低下' },
            { key: 'fade_min', label: '褪色の下限', min: 0.1, max: 0.6, def: 0.22, step: 0.02 },
            { key: 'ring_age', label: '年輪マークの出る手数', min: 5, max: 40, def: 11, unit: '手' },
        ]),
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 褪色碁: 置いてから時間が経つほど石は薄くなる (下限0.22)
        function fadeAlpha(pc) {
            const age = pc.at === undefined ? 99 : history.length - pc.at;
            return Math.max(P('fade_min') || 0.22, 1 - age * (P('fade_rate') || 0.07));
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
                    if (pc.at === undefined || history.length - pc.at < Math.max(1, P('ring_age') || 11)) return;
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                        ctx.beginPath();
                        ctx.arc(padding + p.x * cellSize, padding + p.y * cellSize, cellSize * 0.44, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            褪色碁: 石は古いほど色が褪せて薄くなる。着手の新陳代謝が見える盤<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '置いてから手数が経つほど石は薄く褪色する (最低でも22%の濃さは残る)。',
            '古い石ほど消えかけて見える — どの連が「置き忘れ」かが一目で分かる視覚ルール。',
        ])],
        // 褪色: 盤に舞い落ちるセピア色の塵と年月のヴィネット
        [K.ONE, '        let obstaclePainter = null;',
`        let obstaclePainter = null;
        // 褪色碁: セピアの塵が静かに降り積もる常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            for (let k = 0; k < 12; k++) {
                const ph = (now / 3400 + k * 0.173) % 1;
                const x = (Math.sin(k * 12.9898) * 0.5 + 0.5) * w;
                const y = ((k * 0.618 + ph) % 1) * w;
                ctx2.globalAlpha = 0.05 + 0.08 * Math.sin(ph * Math.PI);
                ctx2.fillStyle = '#a16207';
                ctx2.beginPath();
                ctx2.arc(x, y, cs * 0.06, 0, Math.PI * 2);
                ctx2.fill();
            }
            const g = ctx2.createRadialGradient(w / 2, w / 2, w * 0.3, w / 2, w / 2, w * 0.75);
            g.addColorStop(0, 'rgba(120,84,20,0)');
            g.addColorStop(1, 'rgba(120,84,20,0.10)');
            ctx2.globalAlpha = 1;
            ctx2.fillStyle = g;
            ctx2.fillRect(0, 0, w, w);
            ctx2.restore();
        });`],
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
