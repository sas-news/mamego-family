// BYOUBUGO — 屏風碁: 横一線4連以上を含む連は「屏風」となり風を遮って取られない
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'byoubugo.html',
    en: 'BYOUBUGO',
    jp: '屏風碁',
    prefix: 'byoubugo',
    desc: '横一線に4連以上並んだ石は「屏風」。その連は風を遮られて決して取られない。',
    kind: 'stone',
    icon: 'byoubugo',
    spec: [
        ...K.rb('BYOUBUGO', '屏風碁', 'byoubugo'),
        K.params([
            { key: 'screen_len', label: '屏風になる連数', min: 3, max: 7, def: 4, unit: '連' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.8, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        // 屏風捕獲ブロック: 横4連を含む敵連は取り除かない
        [K.ONE, K.CAPTURE_BLOCK, `            let captured = getCapturedStones(board, opponent);
            // 屏風ルール: 横一線4連以上を含む連は風を遮られて取られない
            if (captured.length > 0) {
                const seen = new Set(); const keep = new Set();
                captured.forEach(i0 => {
                    if (seen.has(i0)) return;
                    const grp = []; const q = [i0]; seen.add(i0);
                    while (q.length) {
                        const cur = q.shift(); grp.push(cur);
                        getNeighbors(cur).forEach(n => {
                            if (board[n] === opponent && !seen.has(n)) { seen.add(n); q.push(n); }
                        });
                    }
                    const inG = new Set(grp);
                    const L = Math.max(3, P('screen_len') || 4);
                    const screen = grp.some(i0 => {
                        const x = i0 % BOARD_SIZE;
                        if (x > BOARD_SIZE - L) return false;
                        for (let k = 1; k < L; k++) if (!inG.has(i0 + k)) return false;
                        return true;
                    });
                    if (screen) grp.forEach(g => keep.add(g));
                });
                captured = captured.filter(i => !keep.has(i));
            }
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 屏風の描画: 横4連の走りに金の帯マーク (drawStoneMarks)
        ...K.STONE_MARKS_SPEC(`            {
                // 屏風連: 横の長連の走りの上に薄い金帯
                const L = Math.max(3, P('screen_len') || 4);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x <= BOARD_SIZE - L; x++) {
                    const i0 = y * BOARD_SIZE + x;
                    const v = board[i0];
                    let run = (v === 1 || v === 2);
                    for (let k = 1; k < L; k++) if (board[i0 + k] !== v) { run = false; break; }
                    if (run) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(212,175,55,0.75)';
                        ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                        ctx.beginPath();
                        ctx.moveTo(padding + x * cellSize - cellSize * 0.3, padding + y * cellSize - cellSize * 0.36);
                        ctx.lineTo(padding + (x + L - 1) * cellSize + cellSize * 0.3, padding + y * cellSize - cellSize * 0.36);
                        ctx.stroke();
                        ctx.restore();
                        x += L - 1;
                    }
                }
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            屏風碁: 横一線に4連以上並んだ連は「屏風」— 囲んでも取れない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '横一線に4つ以上連なった部分を含む連は「屏風」— 風を遮られ、どんなに囲まれても取られない。',
            '屏風を立てればその連は不死身。崩せるのは4連を割って伸びる前だけ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 白の横4連を完全に黒で囲む → 屏風で取れない
        [[2, 2], [3, 2], [4, 2], [5, 2]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 2; });
        [[1, 2], [6, 2], [2, 1], [3, 1], [4, 1], [5, 1], [2, 3], [3, 3], [4, 3], [5, 3]]
            .forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 1; });
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('屏風連は取られない', board[2 * BOARD_SIZE + 3] === 2 && captures[1] === 0);
        // 屏風でない白の連は普通に取れる
        [[8, 8], [9, 8]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 2; });
        [[7, 8], [10, 8], [8, 7], [9, 7], [8, 9], [9, 9]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 1; });
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        assert('普通の連は取れる', board[8 * BOARD_SIZE + 8] === 0 && captures[1] === 2);
    `,
};
