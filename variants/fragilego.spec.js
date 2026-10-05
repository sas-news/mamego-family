// FRAGILEGO — 脆碁: 呼吸点2以下の敵連は砕けて取られる。早死にの碁。
const K = require('../gen_kit.js');
module.exports = {
    file: 'fragilego.html',
    en: 'FRAGILEGO',
    jp: '脆碁',
    prefix: 'fragilego',
    desc: '呼吸点2以下の敵連は砕けて取られる。早死にの碁。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('FRAGILEGO', '脆碁', 'fragilego'),
        K.params([
            { key: 'fragile_lib', label: '砕ける呼吸点 (以下)', min: 1, max: 4, def: 2 },
        ]),
        [K.ONE, K.CAPTURE_BLOCK, `            // 脆碁: 呼吸点が2以下の敵連は全て砕ける (通常は0のみ)
            const seenGrp = new Set();
            const captured = [];
            for (let i = 0; i < board.length; i++) {
                if (board[i] === opponent && !seenGrp.has(i)) {
                    const grp = getConnectedGroup(i, opponent);
                    grp.forEach(g => seenGrp.add(g));
                    if (getLiberties(board, i) <= (P('fragile_lib') || 2)) captured.push(...grp);
                }
            }
            if (captured.length > 0) {
                captured.forEach(idx => {
                    board[idx] = 0;
                    // 砕ける演出: ガラス質の破片が飛び散る
                    fxBurst(idx, '#bae6fd', 7, 1.5);
                    fxBurst(idx, '#e0f2fe', 4, 1.0);
                });
                fxText(captured[0], '砕', '#7dd3fc', 900);
                if (captured.length >= 3) fxShake(3, 220);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 脆い敵連 (呼吸点2以下) にひびの予告マーク
        K.CUE_STARS(`            // 脆碁: 呼吸点2以下の敵連は砕け前に白いひびが見える
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(240, 249, 255, 0.75)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                const seenF = new Set();
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if ((v !== 1 && v !== 2) || seenF.has(i)) continue;
                    const grp = getConnectedGroup(i, v);
                    grp.forEach(g => seenF.add(g));
                    if (getLiberties(board, i) > (P('fragile_lib') || 2)) continue;
                    for (const g of grp) {
                        const x = g % BOARD_SIZE, y = Math.floor(g / BOARD_SIZE);
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.beginPath();
                        ctx.moveTo(cx - cellSize * 0.20, cy - cellSize * 0.22);
                        ctx.lineTo(cx - cellSize * 0.02, cy - cellSize * 0.02);
                        ctx.lineTo(cx - cellSize * 0.16, cy + cellSize * 0.10);
                        ctx.moveTo(cx - cellSize * 0.02, cy - cellSize * 0.02);
                        ctx.lineTo(cx + cellSize * 0.14, cy + cellSize * 0.16);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv(['脆い石: 着手後、呼吸点が2以下の敵連は全て砕けて取られる (通常は0のみ)。','常に呼吸点3以上を保たないと連が死ぬ。自分の連は従来通り0まで生きる。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        board[5 * BOARD_SIZE + 5] = 2;
        board[4 * BOARD_SIZE + 5] = 1; board[6 * BOARD_SIZE + 5] = 1; // 敵の呼吸点=2
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('呼吸点2の敵は砕ける', board[5 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        board.fill(0); captures[1] = 0;
        board[3 * BOARD_SIZE + 3] = 2;
        board[2 * BOARD_SIZE + 3] = 1; // 敵の呼吸点=3
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('呼吸点3の敵は生存', board[3 * BOARD_SIZE + 3] === 2);
    
    `,
};
