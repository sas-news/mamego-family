// ICEGO — 氷上碁: 打った石は直前の自石からの勢いで行き止まりまで滑る
const K = require('../gen_kit.js');
module.exports = {
    file: 'icego.html',
    en: 'ICEGO',
    jp: '氷上碁',
    prefix: 'icego',
    desc: '盤面は氷。打った石は直前の自石との位置関係の向きに滑り続ける。',
    kind: 'stone',
    spec: [
        ...K.rb('ICEGO', '氷上碁', 'icego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let prevOwn = { 1: null, 2: null }; // 各プレイヤーの直前の着手点 (滑走方向の基準)`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            prevOwn = { 1: null, 2: null };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                prevOwn: { 1: prevOwn[1] ? { ...prevOwn[1] } : null, 2: prevOwn[2] ? { ...prevOwn[2] } : null }
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            if (snap.prevOwn) prevOwn = { 1: snap.prevOwn[1] || null, 2: snap.prevOwn[2] || null };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    prevOwn,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            prevOwn = (s.prevOwn && typeof s.prevOwn === 'object') ? s.prevOwn : { 1: null, 2: null };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                prevOwn,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            prevOwn = (data.prevOwn && typeof data.prevOwn === 'object') ? data.prevOwn : { 1: null, 2: null };`],
        // 氷上ルール: 着手石は直前の自石からの方向へ行き止まりまで滑る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 氷上ルール: 直前の自分の着手点から今回の着手点への向きに、石が空きが続く限り滑る
            {
                const N = BOARD_SIZE;
                const np = { x: move.cells[0].x, y: move.cells[0].y };
                const pp = prevOwn[player];
                prevOwn[player] = np;
                if (pp) {
                    const dx = Math.sign(np.x - pp.x), dy = Math.sign(np.y - pp.y);
                    if (dx !== 0 || dy !== 0) {
                        let cx = np.x, cy2 = np.y;
                        while (true) {
                            const nx = cx + dx, ny = cy2 + dy;
                            if (nx < 0 || nx >= N || ny < 0 || ny >= N) break;
                            if (board[ny * N + nx] !== 0) break;
                            cx = nx; cy2 = ny;
                        }
                        if (cx !== np.x || cy2 !== np.y) {
                            board[cy2 * N + cx] = player;
                            board[np.y * N + np.x] = 0;
                        }
                    }
                }
                // 変動後処理: 呼吸のなくなった連を両色について除去
                for (const pl of [1, 2]) {
                    const dead = getCapturedStones(board, pl);
                    if (dead.length) {
                        dead.forEach(i => { board[i] = 0; });
                        captures[pl === 1 ? 2 : 1] += dead.length;
                    }
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        // 氷の表現: 斜めの淡いスケート跡
        K.CUE_GRID(`            // 氷面: 淡い斜線のスケート跡
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.07);
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                const w = (BOARD_SIZE - 1) * cellSize;
                for (let i = -BOARD_SIZE; i < BOARD_SIZE * 2; i += 3) {
                    ctx.beginPath();
                    ctx.moveTo(padding + i * cellSize, padding - cellSize * 0.5);
                    ctx.lineTo(padding + (i + BOARD_SIZE) * cellSize * 0.5, padding + w + cellSize * 0.5);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤面は氷。打った石は直前の自分の着手点からこの着手点への向きに滑り続ける。',
            '石や盤端に当たるまで止まらない。初手は滑る先が無いのでその場に留まる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('初手は滑らず留まる', board[2 * BOARD_SIZE + 2] === 1);
        executeMove({ cells: [{ x: 2, y: 4 }] }, 1);
        assert('下向きに滑って盤端まで', board[(BOARD_SIZE - 1) * BOARD_SIZE + 2] === 1 && board[4 * BOARD_SIZE + 2] === 0);
        board.fill(0);
        prevOwn[1] = { x: 0, y: 0 };
        board[7 * BOARD_SIZE + 5] = 1; // 斜めの滑走路上に石
        executeMove({ cells: [{ x: 2, y: 4 }] }, 1);
        assert('滑走先が石なら手前で止まる', board[6 * BOARD_SIZE + 4] === 1 && board[4 * BOARD_SIZE + 2] === 0);
    `,
};
