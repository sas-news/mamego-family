// MEDIGO — 治療碁: 着手に接した自連が治癒し、次の取られは1石だけに軽減される
const K = require('../gen_kit.js');
module.exports = {
    file: 'medigo.html',
    en: 'MEDIGO',
    jp: '治療碁',
    prefix: 'medigo',
    desc: '着手に接した自連は治癒される。治癒連は取られても1石だけ散る。',
    kind: 'stone',
    spec: [
        ...K.rb('MEDIGO', '治療碁', 'medigo'),
        // 治癒マーク medMark (idx の Set) の状態登録
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let medMark = new Set(); // 治癒された石 (idx)。次の取られは1石だけに軽減`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            medMark = new Set();`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                medMark: [...medMark],
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            medMark = new Set(snap.medMark || []);`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    medMark: [...medMark],
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            medMark = new Set(s.medMark || []);`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                medMark: [...medMark],
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            medMark = new Set(data.medMark || []);`],
        // 治癒された連は取られても1石だけ散る
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 治療: 治癒マークのある連は全滅せず1石だけ散る (治癒は消費される)
                const seen = new Set();
                const finalRemove = [];
                captured.forEach(ci => {
                    if (seen.has(ci)) return;
                    const grp = getConnectedGroup(ci, opponent);
                    grp.forEach(g => seen.add(g));
                    if (grp.some(g => medMark.has(g))) {
                        grp.forEach(g => medMark.delete(g));
                        finalRemove.push(grp[0]);
                    } else {
                        finalRemove.push(...grp);
                    }
                });
                finalRemove.forEach(idx => { board[idx] = 0; });
                captures[player] += finalRemove.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 着手に接した自連を治癒する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 治療: 着手点に接した自連の石に治癒マークを付ける
            {
                move.cells.forEach(p => {
                    const pi = p.y * BOARD_SIZE + p.x;
                    getNeighbors(pi).forEach(n => {
                        if (board[n] === player) getConnectedGroup(n, player).forEach(g => medMark.add(g));
                    });
                });
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 治癒マーク: 緑の十字を石の中央に
            for (const idx of medMark) {
                const v = board[idx];
                if (v !== 1 && v !== 2) continue;
                const x = idx % BOARD_SIZE, y = Math.floor(idx / BOARD_SIZE);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                const rr = cellSize * 0.13;
                ctx.save();
                ctx.strokeStyle = 'rgba(40, 200, 110, 0.95)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.beginPath();
                ctx.moveTo(cx - rr, cy); ctx.lineTo(cx + rr, cy);
                ctx.moveTo(cx, cy - rr); ctx.lineTo(cx, cy + rr);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手に接した自分の連は治癒される (緑十字マーク)。',
            '治癒された連は包囲されても全滅せず、1石だけ散って持ち堪える (治癒は消費される)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0; medMark = new Set();
        board[5 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1); // 連に接して着手 → 治癒
        assert('治癒マークが付く', medMark.has(5 * BOARD_SIZE + 5) && medMark.has(5 * BOARD_SIZE + 6));
        board.fill(0); pieces = []; captures[1] = 0; medMark = new Set();
        // 治癒連が包囲されても1石だけ散る
        board[5 * BOARD_SIZE + 5] = 2; board[5 * BOARD_SIZE + 6] = 2;
        medMark.add(5 * BOARD_SIZE + 5); medMark.add(5 * BOARD_SIZE + 6);
        board[4 * BOARD_SIZE + 5] = 1; board[6 * BOARD_SIZE + 5] = 1;
        board[4 * BOARD_SIZE + 6] = 1; board[6 * BOARD_SIZE + 6] = 1;
        board[5 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 7, y: 5 }] }, 1); // 最後の呼吸点
        const whites = board.filter(v => v === 2).length;
        assert('治癒連は1石だけ散る', whites === 1 && captures[1] === 1);
        assert('治癒は消費される', medMark.size === 0);
    `,
};
