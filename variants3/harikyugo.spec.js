// HARIKYUGO — 鍼灸碁: 経穴(つぼ)を含む連は気が通り、どんなに囲まれても取られない
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
    file: 'harikyugo.html',
    en: 'HARIKYUGO',
    jp: '鍼灸碁',
    prefix: 'harikyugo',
    desc: '6つの経穴(つぼ)を含む連は気が通って取られない。経穴に鍼を刺すと気が巡る。',
    kind: 'stone',
    icon: 'harikyugo',
    spec: [
        ...K.rb('HARIKYUGO', '鍼灸碁', 'harikyugo'),
        K.params([
            { key: 'tsubo_inset', label: '四隅の経穴の位置', min: 1, max: 6, def: 3, unit: '路目', hint: '角からの距離' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.8, step: 0.05 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 経穴の点: 斜め四隅の星 + 上下中央のツボ
        function tsuboIdxs() {
            const n = BOARD_SIZE;
            const c = Math.floor(n / 2);
            const o = Math.max(1, Math.min(c - 1, P('tsubo_inset') || 3));
            const pts = [[o, o], [n - 1 - o, o], [o, n - 1 - o], [n - 1 - o, n - 1 - o], [c, 1], [c, n - 2]];
            return pts.map(([x, y]) => y * n + x);
        }`],
        // 経穴ガード: 経穴を含む敵連は気が通って取られない
        [K.ONE, K.CAPTURE_BLOCK, `            let captured = getCapturedStones(board, opponent);
            // 鍼灸ルール: 経穴の点を含む連は気が通り、取り除かれない
            if (captured.length > 0) {
                const tsubo = new Set(tsuboIdxs());
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
                    if (grp.some(g => tsubo.has(g))) grp.forEach(g => keep.add(g));
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
        // 経穴の描画: 6点に鍼の印
        K.CUE_STARS(`            // 経穴: ツボの空点に小さな鍼印
            {
                tsuboIdxs().forEach(i => {
                    if (board[i] !== 0) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(190,40,40,0.65)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.22); ctx.lineTo(cx, cy + cellSize * 0.22);
                    ctx.moveTo(cx - cellSize * 0.16, cy - cellSize * 0.16);
                    ctx.lineTo(cx + cellSize * 0.16, cy - cellSize * 0.16);
                    ctx.stroke();
                    ctx.restore();
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`'経穴 ' + tsuboIdxs().filter(i => board[i] === turn).length + '/6'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            鍼灸碁: 6つの経穴(つぼ)を含む連は気が通り、囲んでも取れない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤上の6点は「経穴(つぼ)」。経穴を1つでも含む連は気が通り、完全に囲まれても取られない。',
            '連を経穴に繋げば不死身。相手の連が経穴に届く前に断ち切れ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 経穴(3,3)を含む白連を黒で完全に包囲 → 気が通って取れない
        [[3, 3], [4, 3]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 2; });
        [[3, 2], [4, 2], [3, 4], [4, 4], [2, 3], [5, 3]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 1; });
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('経穴の連は取られない', board[3 * BOARD_SIZE + 3] === 2 && captures[1] === 0);
        // 経穴を含まない白連は普通に取れる
        [[8, 8], [9, 8]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 2; });
        [[7, 8], [10, 8], [8, 7], [9, 7], [8, 9], [9, 9]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 1; });
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        assert('経穴なしの連は取れる', board[8 * BOARD_SIZE + 8] === 0 && captures[1] === 2);
    `,
};
