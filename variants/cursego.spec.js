// CURSEGO — 呪碁: 取られた側は呪われ、次の1手は取跡の点にしか打てない
const K = require('../gen_kit.js');
module.exports = {
    file: 'cursego.html',
    en: 'CURSEGO',
    jp: '呪碁',
    prefix: 'cursego',
    desc: '石を取られた側は呪われる。次の1手は取跡の点にしか打てない。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('CURSEGO', '呪碁', 'cursego'),
        K.params([
            { key: 'curse_turns', label: '呪いの持続手数', min: 1, max: 5, def: 1, unit: '手', hint: '取られた側が取跡にしか打てない手数' },
        ]),
        // 呪いの対象点 cursePoint[player] の状態登録
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let cursePoint = { 1: null, 2: null }; // 呪いで強制される着手点 (idx または null)
        let curseLeft = { 1: 0, 2: 0 }; // 呪いの残り手数 (呪いの持続手数分)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            cursePoint = { 1: null, 2: null };
            curseLeft = { 1: 0, 2: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                cursePoint: { ...cursePoint },
                curseLeft: { ...curseLeft },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            cursePoint = snap.cursePoint ? { ...snap.cursePoint } : { 1: null, 2: null };
            curseLeft = snap.curseLeft ? { ...snap.curseLeft } : { 1: 0, 2: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    cursePoint,
                    curseLeft,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            cursePoint = (s.cursePoint && typeof s.cursePoint === 'object') ? { ...s.cursePoint } : { 1: null, 2: null };
            curseLeft = (s.curseLeft && typeof s.curseLeft === 'object') ? { ...s.curseLeft } : { 1: 0, 2: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                cursePoint,
                curseLeft,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            cursePoint = (data.cursePoint && typeof data.cursePoint === 'object') ? { ...data.cursePoint } : { 1: null, 2: null };
            curseLeft = (data.curseLeft && typeof data.curseLeft === 'object') ? { ...data.curseLeft } : { 1: 0, 2: 0 };`],
        // 取られた側に呪いをかける (先頭の取跡に限定)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                cursePoint[opponent] = captured[0]; // 呪い: 取られた側は取跡にしか打てない
                curseLeft[opponent] = Math.max(1, P('curse_turns') || 1); // 呪いの持続手数
                fxGlow(captured[0], '#a855f7', 900);
                fxText(captured[0], '呪', '#d8b4fe', 1200);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 呪いの対象は指定点以外に打てない (対象点が埋まっていれば呪いは解ける)
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 呪碁: 呪われている間は呪いの点にしか打てない
            {
                const cp = cursePoint[player];
                if (cp !== null && cp !== undefined) {
                    if (board[cp] === 0) {
                        if (!cells.some(p => p.y * BOARD_SIZE + p.x === cp)) return false;
                    } else {
                        cursePoint[player] = null; // 呪いの点が埋まっていれば自然に解ける
                        curseLeft[player] = 0;
                    }
                }
            }`],
        // 着手したら自分の呪いは解ける
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            // 呪いは持続手数分だけ続く (設定で調整)
            if (cursePoint[player] !== null && cursePoint[player] !== undefined) {
                curseLeft[player]--;
                if (curseLeft[player] <= 0) cursePoint[player] = null;
            }
            turn = opponent;`],
        K.CUE_STARS(`            // 呪いの対象点に紫の×印
            {
                const cp = cursePoint[turn];
                if (cp !== null && cp !== undefined && board[cp] === 0) {
                    const cx = padding + (cp % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(cp / BOARD_SIZE) * cellSize;
                    const pulse = 0.8 + 0.25 * Math.sin(fxNow() / 160);
                    const rr = cellSize * 0.3 * pulse;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(160, 60, 210, ' + (0.65 + 0.3 * Math.sin(fxNow() / 160)) + ')';
                    ctx.lineWidth = Math.max(2, cellSize * 0.09);
                    ctx.beginPath();
                    ctx.moveTo(cx - rr, cy - rr); ctx.lineTo(cx + rr, cy + rr);
                    ctx.moveTo(cx + rr, cy - rr); ctx.lineTo(cx - rr, cy + rr);
                    ctx.stroke();
                    ctx.restore();
                }
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '自分の連を取られると呪われる (紫の×印)。',
            '呪われた側の次の1手は取跡の点にしか打てない。点が埋まっていれば呪いは自然に解ける。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0; cursePoint = { 1: null, 2: null };
        // 白の2連を包囲して取る
        board[5 * BOARD_SIZE + 5] = 2; board[5 * BOARD_SIZE + 6] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[6 * BOARD_SIZE + 5] = 1;
        board[4 * BOARD_SIZE + 6] = 1; board[6 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 7, y: 5 }] }, 1);
        assert('白の連が取れる', captures[1] === 2);
        assert('白が呪われる', cursePoint[2] === 5 * BOARD_SIZE + 5);
        assert('呪いの点以外は打てない', isValidPlacement([{ x: 0, y: 0 }], 2) === false);
        assert('呪いの点には打てる', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        assert('1手で呪いは解ける', cursePoint[2] === null);
    `,
};
