// MARKETGO — 相場碁: 石の価格が毎手変動。盤上の自石の購入時価格の総額が得点
const K = require('../gen_kit.js');
module.exports = {
    file: 'marketgo.html',
    en: 'MARKETGO',
    jp: '相場碁',
    prefix: 'marketgo',
    desc: '石価は手数で乱高下。高値で置いた石が終局時にそのまま資産になる。',
    kind: 'market',
    spec: [
        ...K.rb('MARKETGO', '相場碁', 'marketgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let market = 3; // 現在の石価 (1〜5で変動)`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            market = 3;`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                market
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.market !== undefined) market = snap.market;`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    market,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (s.market !== undefined) market = s.market;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                market,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (data.market !== undefined) market = data.market;`],
        // 各石に購入時価格を刻む
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                mv: market // 購入時の石価
            });`],
        // 手番ごとに石価が変動 (決定論的な乱高下)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 相場ルール: 着手のたび石価が1〜5の間で変動する
            market = 1 + ((history.length * 7 + 3) % 5);

            turn = opponent;`],
        // 終局時: 盤上の自石の購入価格総額を資産得点に
        [K.ONE, `        function endGameByScore() {`, `
        function marketValue(player) {
            let v = 0;
            pieces.forEach(pc => {
                if (pc.player === player && pc.cells.some(c => board[c.y * BOARD_SIZE + c.x] === player)) {
                    v += pc.mv || 1;
                }
            });
            return v;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + marketValue(1);
            const whiteTotal = territory.white + captures[2] + komi + marketValue(2);`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の石資産:</span> <strong>\${marketValue(1)}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の石資産:</span> <strong>\${marketValue(2)}</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'石価:' + market`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石価は着手のたび1〜5で変動する (ヘッダのチップで確認)。',
            '各石には購入時の価格が刻まれ、終局時に盤上の自石の価格総額が資産得点になる。',
            '高値の時に置き、安値の時は取りに回れ。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('石に価格が刻まれる', pieces[0].mv === 3);
        assert('相場が変動した', market !== 3);
        const mv = market;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('2手目は変動後の価格', pieces[1].mv === mv);
        assert('資産合計', marketValue(1) === pieces[0].mv + pieces[1].mv);
        assert('起動着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
