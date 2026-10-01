// RETURGO — 帰還碁: 取られた石は持ち主の手元に戻り、次の着手時に隣へ再打される
const K = require('../gen_kit.js');
module.exports = {
    file: 'returgo.html',
    en: 'RETURGO',
    jp: '帰還碁',
    prefix: 'returgo',
    desc: '取られた石は手元に戻り、次の着手時に隣へ再打される。',
    kind: 'stone',
    spec: [
        ...K.rb('RETURGO', '帰還碁', 'returgo'),
        K.params([
            { key: 'return_count', label: '1手あたりの帰還石数', min: 1, max: 4, def: 1, unit: '個' },
            { key: 'cap_extra', label: '打ち切り余分', min: 0, max: 8, def: 2, unit: '行分', hint: '交点数+この行数×盤サイズの手数で強制終局' },
        ]),
        // 戻り石ストック retStock[player] の状態登録
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let retStock = { 1: 0, 2: 0 }; // 手元に戻って再打待ちの石数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            retStock = { 1: 0, 2: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                retStock: { ...retStock },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            retStock = snap.retStock ? { ...snap.retStock } : { 1: 0, 2: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    retStock,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            retStock = (s.retStock && typeof s.retStock === 'object') ? { ...s.retStock } : { 1: 0, 2: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                retStock,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            retStock = (data.retStock && typeof data.retStock === 'object') ? { ...data.retStock } : { 1: 0, 2: 0 };`],
        // 取られた側はアゲハマでなく自分の手元に戻る
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                retStock[opponent] += captured.length; // 帰還: 持ち主の手元へ
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 着手後、戻り石があれば着手した石の隣に1個補充配置
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 帰還: 手元に戻った石を着手点の隣に設定個数だけ再打する
            for (let rk = 0; rk < Math.max(1, P('return_count') || 1) && retStock[player] > 0; rk++) {
                const retIdx = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const spot = getNeighbors(retIdx).find(n => board[n] === 0);
                if (spot !== undefined) {
                    board[spot] = player; retStock[player]--; cleanUpPieces();
                    // 手元から飛んでくる帰還石
                    fxSlide(retIdx, spot, 420);
                    fxGlow(spot, 'rgba(96,165,250,0.9)', 650);
                    fxText(spot, '帰還', '#60a5fa', 900);
                }
            }

            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + (P('cap_extra') ?? 2))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`retStock[turn] > 0 ? '帰還石+' + retStock[turn] : ''`),
        [K.ONE, K.RV_ALGO, K.rv([
            '取られた石は相手のアゲハマに加わると同時に自分の手元にも戻る。',
            '次に着手したとき、戻り石があれば打った石の隣の空点に1個自動で補充配置される。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0; retStock = { 1: 0, 2: 0 };
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1); // 白石を取る
        assert('白石が取れる', board[5 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        assert('取られた側の手元に戻る', retStock[2] === 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('戻り石が隣に再打される', retStock[2] === 0 && getNeighbors(8 * BOARD_SIZE + 8).some(n => board[n] === 2));
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
