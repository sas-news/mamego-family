// MINEGO — 採掘碁: 取跡に鉱石が出現する。鉱石の上に置くと拾って1目得点
const K = require('../gen_kit.js');
module.exports = {
    file: 'minego.html',
    en: 'MINEGO',
    jp: '採掘碁',
    prefix: 'minego',
    desc: '取跡に鉱石が出る。鉱石の上に石を置くと拾って1目得点。',
    kind: 'stone',
    spec: [
        ...K.rb('MINEGO', '採掘碁', 'minego'),
        // 鉱石 oreCells (Set) と採掘得点 oreScore の状態登録
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let oreCells = new Set(); // 鉱石が出ている空点 (idx)
        let oreScore = { 1: 0, 2: 0 }; // 拾った鉱石の得点`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            oreCells = new Set();
            oreScore = { 1: 0, 2: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                oreCells: [...oreCells],
                oreScore: { ...oreScore },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            oreCells = new Set(snap.oreCells || []);
            oreScore = snap.oreScore ? { ...snap.oreScore } : { 1: 0, 2: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    oreCells: [...oreCells],
                    oreScore,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            oreCells = new Set(s.oreCells || []);
            oreScore = (s.oreScore && typeof s.oreScore === 'object') ? { ...s.oreScore } : { 1: 0, 2: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                oreCells: [...oreCells],
                oreScore,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            oreCells = new Set(data.oreCells || []);
            oreScore = (data.oreScore && typeof data.oreScore === 'object') ? { ...data.oreScore } : { 1: 0, 2: 0 };`],
        // 鉱石の上に置くと拾う
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 採掘: 鉱石の上に置くと拾って得点化
            move.cells.forEach(p => {
                const oi = p.y * BOARD_SIZE + p.x;
                if (oreCells.has(oi)) { oreCells.delete(oi); oreScore[player]++; }
            });`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; oreCells.add(idx); }); // 取跡に鉱石出現
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        K.CUE_STARS(`            // 鉱石: 金色の小ダイヤを鉱石のある空点に
            {
                ctx.save();
                for (const idx of oreCells) {
                    if (board[idx] !== 0) continue;
                    const x = idx % BOARD_SIZE, y = Math.floor(idx / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const rr = cellSize * 0.22;
                    ctx.fillStyle = 'rgba(235, 185, 40, 0.95)';
                    ctx.strokeStyle = 'rgba(160, 110, 10, 0.9)';
                    ctx.lineWidth = Math.max(1.1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - rr);
                    ctx.lineTo(cx + rr * 0.8, cy);
                    ctx.lineTo(cx, cy + rr);
                    ctx.lineTo(cx - rr * 0.8, cy);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        // 採掘得点を終局スコアに加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + oreScore[1];
            const whiteTotal = territory.white + captures[2] + komi + oreScore[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の鉱石:</span> <strong>\${oreScore[1]}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の鉱石:</span> <strong>\${oreScore[2]}</strong></div>`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵連を取った跡地に鉱石 (金のダイヤ) が出現する。',
            '鉱石のある空点に石を置くと拾って1目得点。終局は 地+アゲハマ+鉱石 の合計。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0; oreCells = new Set(); oreScore = { 1: 0, 2: 0 };
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('取跡に鉱石出現', oreCells.has(5 * BOARD_SIZE + 5));
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2); // 鉱石を拾う
        assert('鉱石を拾って得点', oreScore[2] === 1 && !oreCells.has(5 * BOARD_SIZE + 5));
        assert('置いた石は残る', board[5 * BOARD_SIZE + 5] === 2);
        endGameByScore();
        assert('結果詳細に鉱石', gameResultData.details.includes('鉱石'));
    `,
};
