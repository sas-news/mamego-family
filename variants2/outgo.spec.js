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
            outpostScore[player] += getStarPoints(BOARD_SIZE)
                .filter(pt => board[pt.y * BOARD_SIZE + pt.x] === player).length;

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
        ])],
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
    `,
};
