// DYNASTYGO — 王朝碁: 自石を失わずに5手番連続で存続すれば+5点の王朝点
const K = require('../gen_kit.js');
module.exports = {
    file: 'dynastygo.html',
    en: 'DYNASTYGO',
    jp: '王朝碁',
    prefix: 'dynastygo',
    desc: '石を取られない手番が5連続するごとに+5点の王朝ボーナス。',
    kind: 'dynasty',
    spec: [
        ...K.rb('DYNASTYGO', '王朝碁', 'dynastygo'),
        K.params([
            { key: 'dynasty_len', label: '必要な無血連続数', min: 2, max: 10, def: 5, unit: '手番' },
            { key: 'dynasty_pt', label: '王朝ボーナス', min: 1, max: 20, def: 5, unit: '点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let dynasty = { 1: 0, 2: 0 };    // 王朝ボーナス累計
        let streak = { 1: 0, 2: 0 };     // 無血手番の連続数
        let lastLost = { 1: 0, 2: 0 };   // 前回自手番時点の被取石数 (相手のアゲハマ)`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            dynasty = { 1: 0, 2: 0 };
            streak = { 1: 0, 2: 0 };
            lastLost = { 1: 0, 2: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                dynasty: { ...dynasty },
                streak: { ...streak },
                lastLost: { ...lastLost }
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.dynasty) dynasty = { ...snap.dynasty };
            if (snap.streak) streak = { ...snap.streak };
            if (snap.lastLost) lastLost = { ...snap.lastLost };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    dynasty,
                    streak,
                    lastLost,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (s.dynasty) dynasty = s.dynasty;
            if (s.streak) streak = s.streak;
            if (s.lastLost) lastLost = s.lastLost;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                dynasty,
                streak,
                lastLost,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (data.dynasty) dynasty = data.dynasty;
            if (data.streak) streak = data.streak;
            if (data.lastLost) lastLost = data.lastLost;`],
        // 自手番ごとに存続判定: 被取石数が増えていなければ連続+1、5連続で+5点
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 王朝ルール: 自分が石を失わずにこの手番を迎えたら連続存続+1、5連続で王朝点
            {
                const lostNow = captures[opponent]; // 相手のアゲハマ = 自分の被取石数
                if (lostNow === lastLost[player]) {
                    streak[player]++;
                    if (streak[player] >= (P('dynasty_len') || 5)) {
                        dynasty[player] += (P('dynasty_pt') || 5);
                        streak[player] = 0;
                        if (lastMove && lastMove.cells[0]) {
                            const di = lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x;
                            fxText(di, '王朝+' + (P('dynasty_pt') || 5) + '!', '#facc15', 1500);
                            fxGlow(di, '#facc15', 950);
                            fxShake(5, 340);
                        }
                    }
                } else {
                    streak[player] = 0;
                    lastLost[player] = lostNow;
                }
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + dynasty[1];
            const whiteTotal = territory.white + captures[2] + komi + dynasty[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の王朝点:</span> <strong>\${dynasty[1]}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の王朝点:</span> <strong>\${dynasty[2]}</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'存続 黒:' + streak[1] + ' 白:' + streak[2]`),
        [K.ONE, K.RV_BASE, K.rv([
            '自分の石を1つも取られない手番が5連続するごとに+5点の王朝ボーナス。',
            '石を取られたら連続記録は途切れる。終局は 地+アゲハマ+王朝点 の合計。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        for (let i = 0; i < 4; i++) executeMove({ cells: [{ x: i, y: 0 }] }, 1);
        assert('4連続存続', streak[1] === 4);
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1);
        assert('5連続で王朝点+5', dynasty[1] === 5 && streak[1] === 0);
        // 被取石が増えると連続記録途切れ
        streak[1] = 3; captures[2] = 1;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('石を失うと記録リセット', streak[1] === 0);
        endGameByScore();
        assert('結果詳細に王朝点', gameResultData.details.includes('王朝'));
    `,
};
