// STORMGO — 嵐碁: 15手ごとに「嵐手番」— 石の代わりに壁を1個置く
const K = require('../gen_kit.js');

const PERSIST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];

module.exports = {
    file: 'stormgo.html',
    en: 'STORMGO',
    jp: '嵐碁',
    prefix: 'stormgo',
    desc: '15手ごとの「嵐手番」は石ではなく壁を1個置く。',
    kind: 'wall',
    icon: 'stormgo',
    spec: [
        ...K.rb('STORMGO', '嵐碁', 'stormgo'),
        K.params([
            { key: 'storm_interval', label: '嵐の間隔', min: 5, max: 40, def: 15, unit: '手' },
        ]),
        ...K.WALL_SPEC,
        // 嵐手番 (15の倍数手) は壁を置く: 呼吸点を残す置き場のみ合法
        [K.ONE, K.VALID_BOUNDS, `            const isStormTurn = (history.length + 1) % (P('storm_interval') || 15) === 0;
            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }
            if (isStormTurn) {
                // 嵐: 壁を置くと周囲の連が全滅する置き場は禁止 (即死防止)
                for (const p of cells) {
                    const bi = p.y * BOARD_SIZE + p.x;
                    for (const n of getNeighbors(bi)) {
                        if (board[n] === 1 || board[n] === 2) {
                            if (getLiberties(board, n) <= 1) return false;
                        }
                    }
                }
                return true;
            }`],
        // 嵐手番は壁(3)を置く
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            const stormWall = history.length % (P('storm_interval') || 15) === 0;
            if (stormWall) {
                move.cells.forEach(p => {
                    const idx = p.y * BOARD_SIZE + p.x;
                    board[idx] = 3;
                    fxBurst(idx, '#64748b', 8, 1.2);
                });
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '嵐!', '#94a3b8', 1000);
                fxShake(4, 260);
            } else {
                move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            }`],
        // 嵐手番は石を置かないので通常の捕獲判定をスキップ
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = stormWall ? [] : getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`(history.length + 1) % (P('storm_interval') || 15) === 0 ? '嵐手番!' : '次の嵐まで ' + ((P('storm_interval') || 15) - ((history.length + 1) % (P('storm_interval') || 15))) + '手'`),
        [K.ONE, K.RV_BASE, K.rv([
            '嵐: 15手ごとの手番は、石ではなく灰色の壁を1個置く (壁は取れず地にもならない)。',
            '壁は相手の連の呼吸点を残す場所にのみ置ける。嵐手番の巡りは両プレイヤー共通。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 14手進めて15手目を嵐にする (2列離して相互に呼吸点を残す)
        for (let k = 0; k < 14; k++) {
            executeMove({ cells: [{ x: 4 + 2 * Math.floor(k / 10), y: k % 10 }] }, k % 2 === 0 ? 1 : 2);
        }
        assert('15手目は嵐手番', (history.length + 1) % 15 === 0);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('嵐は壁を置く', board[I(8, 8)] === 3);
        assert('壁は石数に含まれない', board.filter(v => v === 1 || v === 2).length === 14);
        assert('壁の上には置けない', isValidPlacement([{ x: 8, y: 8 }], 1) === false);
    `,
};
