// MAGEGO — 魔導碁: 着手毎に魔力が溜まり、5で火球が炸裂して敵石を焼く。
const K = require('../gen_kit.js');
module.exports = {
    file: 'magego.html',
    en: 'MAGEGO',
    jp: '魔導碁',
    prefix: 'magego',
    desc: '着手毎に魔力が溜まり、5で火球が炸裂して敵石を焼く。',
    kind: 'stone',
    spec: [
        ...K.rb('MAGEGO', '魔導碁', 'magego'),
        K.params([
            { key: 'mp_max', label: '呪文発動の魔力', min: 2, max: 10, def: 5, hint: 'この値に達すると火球発動' },
            { key: 'blast_range', label: '火球の範囲', min: 1, max: 4, def: 2, hint: '着地点からのマンハッタン距離' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.7, max: 2.5, def: 1.4, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let mpMap = { 1: 0, 2: 0 }; // 各プレイヤーの魔力 (着手毎に+1、5で呪文発動)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            mpMap = { 1: 0, 2: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                mpMap: { ...mpMap },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            mpMap = snap.mpMap ? { ...snap.mpMap } : { 1: 0, 2: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    mpMap,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            mpMap = (s.mpMap && typeof s.mpMap === 'object') ? { ...s.mpMap } : { 1: 0, 2: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                mpMap,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            mpMap = (data.mpMap && typeof data.mpMap === 'object') ? { ...data.mpMap } : { 1: 0, 2: 0 };`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }

            // 魔導: 着手毎にMP+1。5に達すると着地点中心の敵石を焼き払う
            mpMap[player] = (mpMap[player] || 0) + 1;
            const mpMax = Math.max(2, P('mp_max') || 5);
            if (mpMap[player] >= mpMax) {
                mpMap[player] = 0;
                // 火球発動: 着地点に炎の輪・揺れ・文字
                const mc0 = move.cells[0];
                const mi0 = mc0.y * BOARD_SIZE + mc0.x;
                fxGlow(mi0, '#f97316', 800);
                fxShake(6, 320);
                fxText(mi0, '火球!', '#fb923c', 950);
                const blast = new Set();
                const br = Math.max(1, P('blast_range') || 2);
                move.cells.forEach(p => {
                    for (let dy = -br; dy <= br; dy++) {
                        for (let dx = -br; dx <= br; dx++) {
                            if (Math.abs(dx) + Math.abs(dy) > br) continue;
                            const nx = p.x + dx, ny = p.y + dy;
                            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                            blast.add(ny * BOARD_SIZE + nx);
                        }
                    }
                });
                let burned = 0;
                blast.forEach(idx => {
                    fxBurst(idx, '#f97316', 6, 1.4);
                    if (board[idx] === opponent) { board[idx] = 0; burned++; }
                });
                if (burned > 0) {
                    captures[player] += burned;
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            } else if (mpMap[player] === mpMax - 1) {
                // 次で呪文発動 — 魔力充填の警告光
                const wi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxGlow(wi, 'rgba(245,158,11,0.85)', 900);
            }`],
        ...K.EVENT_CHIP_SPEC("'魔力 ' + (mpMap[turn] || 0) + '/' + Math.max(2, P('mp_max') || 5)"),
        [K.ONE, K.RV_BASE, K.rv(['着手する毎に魔力 (MP) が1溜まる。5に達すると呪文が自動発動:','着地点からマンハッタン距離2以内の敵石を全て焼き払う (自分の石は無事)。ヘッダのチップにMP表示。','打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。'])],
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

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        mpMap[1] = 0;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('着手でMP1溜まる', mpMap[1] === 1);
        mpMap[1] = 4;
        board[3 * BOARD_SIZE + 3] = 2; board[8 * BOARD_SIZE + 8] = 2;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('呪文で近くの敵が焼失', board[3 * BOARD_SIZE + 3] === 0);
        assert('遠い敵は無事', board[8 * BOARD_SIZE + 8] === 2);
        assert('MP消費で0に戻る', mpMap[1] === 0);
        
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
