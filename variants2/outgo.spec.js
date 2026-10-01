// OUTGO — 前哨碁: 星点を占拠している手数がそのまま得点に積算される
const K = require('../gen_kit.js');
module.exports = {
    file: 'outgo.html',
    en: 'OUTGO',
    jp: '前哨碁',
    prefix: 'outgo',
    desc: '星点を保持し続けると得点が溜まる。前哨基地を巡る攻防。',
    kind: 'star',
    spec: [
        ...K.rb('OUTGO', '前哨碁', 'outgo'),
        K.params([
            { key: 'outpost_pts', label: '星点1個の累積点', min: 0, max: 5, def: 1, step: 0.5, unit: '点/手' },
        ]),
        // 状態: 前哨得点の累積
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let outpostScore = { 1: 0, 2: 0 }; // 星点保持の累積得点`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            outpostScore = { 1: 0, 2: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                outpostScore: { ...outpostScore }
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.outpostScore) outpostScore = { ...snap.outpostScore };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    outpostScore,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (s.outpostScore) outpostScore = s.outpostScore;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                outpostScore,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (data.outpostScore) outpostScore = data.outpostScore;`],
        // 毎手: 占拠中の星点数を前哨得点に加算
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 前哨ルール: 着手した側が現在占拠している星点数を累積
            {
                const held = getStarPoints(BOARD_SIZE).filter(pt => board[pt.y * BOARD_SIZE + pt.x] === player);
                const __pts = (P('outpost_pts') === 0 ? 0 : (P('outpost_pts') || 1));
                outpostScore[player] += held.length * __pts;
                if (held.length > 0 && __pts > 0) {
                    held.forEach(pt => fxGlow(pt.y * BOARD_SIZE + pt.x, '#fbbf24', 600));
                    if (lastMove && lastMove.cells[0]) {
                        fxText(lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x, '前哨+' + (held.length * __pts), '#fbbf24', 1100);
                    }
                }
            }

            turn = opponent;`],
        // 前哨点を終局スコアに加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + outpostScore[1];
            const whiteTotal = territory.white + captures[2] + komi + outpostScore[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の前哨点:</span> <strong>\${outpostScore[1]}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の前哨点:</span> <strong>\${outpostScore[2]}</strong></div>`],
        // 星点に光の輪を描く (前哨基地の演出)
        K.CUE_STARS(`            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.starColor, 0.65);
                ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                getStarPoints(BOARD_SIZE).forEach(pt => {
                    const ox = padding + pt.x * cellSize, oy = padding + pt.y * cellSize;
                    ctx.beginPath();
                    ctx.arc(ox, oy, cellSize * 0.26, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '星点は前哨基地。自分の手番終了時に占拠している星点1つにつき1点が累積される。',
            '終局時に 地 + アゲハマ + 前哨点 の合計で勝敗を決める。星を取り合って長く保持せよ。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        // 前哨旗: 占拠中の星点に小旗を立てる
        ...K.STONE_MARKS_SPEC(`            getStarPoints(BOARD_SIZE).forEach(pt => {
                const v = board[pt.y * BOARD_SIZE + pt.x];
                if (v !== 1 && v !== 2) return;
                const px = padding + pt.x * cellSize, py = padding + pt.y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(120,80,30,0.9)';
                ctx.lineWidth = Math.max(1, cellSize * 0.035);
                ctx.beginPath();
                ctx.moveTo(px + cellSize * 0.3, py - cellSize * 0.45);
                ctx.lineTo(px + cellSize * 0.3, py - cellSize * 0.1);
                ctx.stroke();
                ctx.fillStyle = v === 1 ? '#374151' : '#f8fafc';
                ctx.strokeStyle = 'rgba(60,60,60,0.6)';
                ctx.beginPath();
                ctx.moveTo(px + cellSize * 0.3, py - cellSize * 0.45);
                ctx.lineTo(px + cellSize * 0.54, py - cellSize * 0.38);
                ctx.lineTo(px + cellSize * 0.3, py - cellSize * 0.31);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            });`),
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const sp = getStarPoints(BOARD_SIZE)[0];
        executeMove({ cells: [{ x: sp.x, y: sp.y }] }, 1);
        assert('星占拠で前哨点が加算', outpostScore[1] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('保持し続けると累積', outpostScore[1] === 2);
        assert('白は星を取っていない', outpostScore[2] === 0);
        endGameByScore();
        assert('結果詳細に前哨点が出る', gameResultData.details.includes('前哨'));
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
