// BETGO — 賭碁: 置いた石が相手の次の一手を生き延びれば賭け的中で+1点
const K = require('../gen_kit.js');
module.exports = {
    file: 'betgo.html',
    en: 'BETGO',
    jp: '賭碁',
    prefix: 'betgo',
    desc: '置いた石が相手の次の一手を生き延びれば賭け的中で+1点が溜まる。',
    kind: 'bet',
    spec: [
        ...K.rb('BETGO', '賭碁', 'betgo'),
        K.params([
            { key: 'bet_pts', label: '賭け的中の得点', min: 1, max: 5, def: 1, unit: '点' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0, max: 400, def: 0, unit: '手', hint: '0=制限なし' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let betScore = { 1: 0, 2: 0 }; // 的中した賭けの累計得点
        let pendingBet = null; // { idx, owner } 直前の着手への賭け`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            betScore = { 1: 0, 2: 0 };
            pendingBet = null;`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                betScore: { ...betScore },
                pendingBet: pendingBet ? { ...pendingBet } : null
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.betScore) betScore = { ...snap.betScore };
            pendingBet = snap.pendingBet || null;`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    betScore,
                    pendingBet,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (s.betScore) betScore = s.betScore;
            pendingBet = s.pendingBet || null;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                betScore,
                pendingBet,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (data.betScore) betScore = data.betScore;
            if (data.pendingBet !== undefined) pendingBet = data.pendingBet;`],
        // 着手ごとに前の着手の賭けを精算し、新たな賭けを置く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 賭碁ルール: 相手の直前の石がこの一手を生き延びた → 相手の賭け的中
            if (pendingBet && pendingBet.owner !== player) {
                if (board[pendingBet.idx] === pendingBet.owner) {
                    betScore[pendingBet.owner] += (P('bet_pts') || 1);
                    fxGlow(pendingBet.idx, '#fbbf24', 900);
                    fxText(pendingBet.idx, '+1 的中!', '#fbbf24', 1200);
                }
                pendingBet = null;
            }
            // 自分の着手にも賭けが乗る
            pendingBet = { idx: move.cells[0].y * BOARD_SIZE + move.cells[0].x, owner: player };
            fxGlow(pendingBet.idx, '#cbd5e1', 600);

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + betScore[1];
            const whiteTotal = territory.white + captures[2] + komi + betScore[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の賭け的中:</span> <strong>\${betScore[1]}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の賭け的中:</span> <strong>\${betScore[2]}</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'賭 黒:' + betScore[1] + ' 白:' + betScore[2]`),
        // 賭け石: 賭けの乗った石には金貨が載っている
        ...K.STONE_MARKS_SPEC(`            if (pendingBet && board[pendingBet.idx] === pendingBet.owner) {
                const i = pendingBet.idx;
                const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                ctx.save();
                ctx.fillStyle = '#f5c542';
                ctx.strokeStyle = '#92600a';
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                ctx.beginPath();
                ctx.arc(cx + cellSize * 0.26, cy - cellSize * 0.26, cellSize * 0.13, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手するたびその石に「次の一手を生き延びる」賭けが自動で乗る。',
            '相手の手番を越えて石が残っていれば的中で+1点。終局は 地+アゲハマ+賭け点 の合計。',
        ])],
        // 打ち切り手数 (0=制限なし): 設定で有効化すると超過時に強制採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 設定で有効化した場合、長期戦は強制採点 (1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && (P('ply_cap') || 0) > 0 && history.length >= (P('ply_cap') || 0)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1); // 黒の賭け石
        assert('賭けが置かれる', pendingBet && pendingBet.owner === 1);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2); // 白が別所に打つ → 黒の賭け的中
        assert('生存で賭け的中+1', betScore[1] === 1);
        assert('白の賭けが新たに乗る', pendingBet && pendingBet.owner === 2);
        endGameByScore();
        assert('結果詳細に賭け点', gameResultData.details.includes('賭け'));
    `,
};
