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
        K.params([
            { key: 'price_max', label: '石価の上限', min: 2, max: 9, def: 5, hint: '石価は1〜この値で変動' },
            { key: 'price_step', label: '変動の歩幅', min: 1, max: 13, def: 7, hint: '手数ごとに動く歩幅' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.7, max: 2.5, def: 1.4, step: 0.05, hint: '交点数×倍率' },
        ]),
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
            {
                const last = pieces[pieces.length - 1];
                if (last && last.mv) {
                    const p = move.cells[0];
                    fxText(p.y * BOARD_SIZE + p.x, '¥' + last.mv, last.mv >= 4 ? '#facc15' : '#cbd5e1', 1000);
                }
            }
            market = 1 + ((history.length * Math.max(1, P('price_step') || 7) + 3) % Math.max(1, P('price_max') || 5));

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
        // 資産価格の刻印: 各石に購入時価格を小さく刻む
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.round(cellSize * 0.30) + 'px sans-serif';
                pieces.forEach(pc => {
                    const mv = pc.mv || 1;
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] !== pc.player) return;
                        const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                        ctx.fillStyle = pc.player === 1 ? 'rgba(255,255,255,0.85)' : 'rgba(15,15,15,0.72)';
                        ctx.fillText('¥' + mv, cx, cy + cellSize * 0.02);
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '石価は着手のたび1〜5で変動する (ヘッダのチップで確認)。',
            '各石には購入時の価格が刻まれ、終局時に盤上の自石の価格総額が資産得点になる。',
            '高値の時に置き、安値の時は取りに回れ。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        // 打ち切り手数は設定で調整可能
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 新規対局 (履歴空) で打ち切りを再武装
            if (moveCapFired && history.length === 0) moveCapFired = false;
            // 打ち切り手数: 交点数の1.4倍を超える長期戦は死に石選択へ移行して自動終局
            // (1局につき1回のみ発火。死に石選択を取り消して続行する場合は再発火しない)
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.4))) {
                moveCapFired = true;
                startDeadStoneSelectionPhase();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }`],
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
