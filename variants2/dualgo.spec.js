// DUALGO — 双王碁: 各プレイヤーの最初の2石は王。どちらか1つでも取られたら負け
const K = require('../gen_kit.js');
module.exports = {
    file: 'dualgo.html',
    en: 'DUALGO',
    jp: '双王碁',
    prefix: 'dualgo',
    desc: '最初の2石は王冠付きの王。両方守れ — どちらか取られたら即負け。',
    kind: 'dual',
    spec: [
        ...K.rb('DUALGO', '双王碁', 'dualgo'),
        K.params([
            { key: 'king_count', label: '王の数', min: 1, max: 4, def: 2, unit: '個', hint: '先の着手が王になる個数' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let kingIdx = { 1: [], 2: [] }; // 各プレイヤーの王石の位置 (王の数まで)`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            kingIdx = { 1: [], 2: [] };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                kingIdx: { 1: [...kingIdx[1]], 2: [...kingIdx[2]] }
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.kingIdx) kingIdx = { 1: [...snap.kingIdx[1]], 2: [...snap.kingIdx[2]] };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    kingIdx,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (s.kingIdx) kingIdx = s.kingIdx;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                kingIdx,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (data.kingIdx) kingIdx = data.kingIdx;`],
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        // 手番交代直前: 王の登録と王取り判定
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 双王ルール: 最初のN手の石が王になる (数は設定で調整)
            if (kingIdx[player].length < (P('king_count') || 2)) {
                kingIdx[player].push(move.cells[0].y * BOARD_SIZE + move.cells[0].x);
            }
            // 敵の王のどちらかが消えた → 王取り勝ち
            if (kingIdx[opponent].some(i => board[i] !== opponent)) {
                const dead = kingIdx[opponent].find(i => board[i] !== opponent);
                if (dead !== undefined) {
                    fxBurst(dead, '#facc15', 20, 2.2);
                    fxText(dead, '王取り!', '#facc15', 1500);
                }
                fxShake(7, 420);
                winByRule(player, '王取り勝ち', '敵の王の一方を取りました'); return;
            }

            turn = opponent;`],
        // 王石に王冠マーク
        ...K.STONE_MARKS_SPEC(`            for (const p of [1, 2]) {
                for (const ki of kingIdx[p]) {
                    if (board[ki] !== p) continue;
                    const kx = ki % BOARD_SIZE, ky = Math.floor(ki / BOARD_SIZE);
                    const cx = padding + kx * cellSize, cy = padding + ky * cellSize;
                    ctx.save();
                    ctx.fillStyle = '#f5c518';
                    ctx.strokeStyle = '#8a6a00';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    const w = cellSize * 0.24, h = cellSize * 0.18;
                    ctx.beginPath();
                    ctx.moveTo(cx - w, cy + h * 0.5);
                    ctx.lineTo(cx - w, cy - h * 0.4);
                    ctx.lineTo(cx - w * 0.4, cy);
                    ctx.lineTo(cx, cy - h);
                    ctx.lineTo(cx + w * 0.4, cy);
                    ctx.lineTo(cx + w, cy - h * 0.4);
                    ctx.lineTo(cx + w, cy + h * 0.5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの最初の2石は王 (金の王冠マーク)。',
            '王は2つとも生かさなければならない — どちらか1つでも取られた時点で即負け。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('黒の王が2つ登録', kingIdx[1].length === 2);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2);
        assert('白の王が1つ登録', kingIdx[2].length === 1);
        // 黒の王(1,1)を囲んで取る → 白の王取り勝ち
        board[1 * BOARD_SIZE + 1] = 1; // 王石
        board[0 * BOARD_SIZE + 1] = 2; board[1 * BOARD_SIZE + 0] = 2; board[2 * BOARD_SIZE + 1] = 2;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 2); // 右の呼吸点を塞いで王を取る
        assert('王を取られて即負け', gameOver === true && gameResultData.title.includes('王'));
    `,
};
