// BANKGO — 銀行碁: アゲハマは銀行預金。自分の手番ごとに残高の1/5が利子で増える
const K = require('../gen_kit.js');
module.exports = {
    file: 'bankgo.html',
    en: 'BANKGO',
    jp: '銀行碁',
    prefix: 'bankgo',
    desc: 'アゲハマは預金。自分の手番ごとに残高の1/5が利子として増える。',
    kind: 'bank',
    spec: [
        ...K.rb('BANKGO', '銀行碁', 'bankgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let bankInterest = { 1: 0, 2: 0 }; // 預金利子の累積`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            bankInterest = { 1: 0, 2: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                bankInterest: { ...bankInterest }
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.bankInterest) bankInterest = { ...snap.bankInterest };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    bankInterest,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (s.bankInterest) bankInterest = s.bankInterest;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                bankInterest,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (data.bankInterest) bankInterest = data.bankInterest;`],
        // 自分の着手ごとに預金(captures)の1/5が利子
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 銀行ルール: 自分の手番のたびアゲハマ残高の1/5 (切捨) が利子
            const interest = Math.floor(captures[player] / 5);
            bankInterest[player] += interest;
            if (interest > 0) {
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxGlow(ci, '#fbbf24', 800);
                fxText(ci, '+利子' + interest, '#fbbf24', 1100);
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + bankInterest[1];
            const whiteTotal = territory.white + captures[2] + komi + bankInterest[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ預金:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の利子:</span> <strong>\${bankInterest[1]}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ預金:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の利子:</span> <strong>\${bankInterest[2]}</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'利子 黒:' + bankInterest[1] + ' 白:' + bankInterest[2]`),
        [K.ONE, K.RV_ALGO, K.rv([
            'アゲハマは銀行預金。自分が着手するたび残高の1/5 (切捨) が利子で増える。',
            '早めに預金を作って寝かせるほど複利が効く。終局は 地+預金+利子 の合計。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        captures[1] = 10;
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('預金の1/5が利子', bankInterest[1] === 2);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('毎手番に複利', bankInterest[1] === 4);
        assert('白に利子なし', bankInterest[2] === 0);
        endGameByScore();
        assert('結果詳細に利子', gameResultData.details.includes('利子'));
    `,
};
