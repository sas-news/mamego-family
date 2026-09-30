// LIONDANCEGO — 獅子舞碁: 石は獅子頭。置くと隣の小さな敵連 (3石以下) に噛み付いて厄払いする
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'liondancego.html',
    en: 'LIONDANCEGO',
    jp: '獅子舞碁',
    prefix: 'liondancego',
    desc: '石は獅子頭。置くと隣の小さな敵連 (3石以下) に噛み付いて1石取る。',
    kind: 'stone',
    icon: 'liondancego',
    spec: [
        ...K.rb('LIONDANCEGO', '獅子舞碁', 'liondancego'),
        // 獅子噛み: 隣の敵連 (3石以下) の中で最も呼吸点の少ない石を1つ噛み落とす
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 獅子噛み: 隣の敵連 (3石以下) から最も弱い石を1つ噛み落とす
            {
                const bc = move.cells[0];
                const si = bc.y * BOARD_SIZE + bc.x;
                const seen = new Set();
                let prey = -1, preyLib = Infinity;
                getNeighbors(si).forEach(n => {
                    if (board[n] !== opponent || seen.has(n)) return;
                    const grp = getConnectedGroup(n, opponent);
                    if (grp.length > 3) { grp.forEach(g => seen.add(g)); return; }
                    grp.forEach(g => seen.add(g));
                    grp.forEach(g => {
                        const lib = getLiberties(board, g);
                        if (lib < preyLib) { preyLib = lib; prey = g; }
                    });
                });
                if (prey >= 0) {
                    board[prey] = 0;
                    captures[player]++;
                    fxBurst(prey, '#ef4444', 10, 1.6);
                    fxText(si, 'ガブッ!', '#f87171', 900);
                    cleanUpPieces();
                    // 噛み落としで残った敵連が窒息すれば通常通り取る
                    const dead = getCapturedStones(board, opponent);
                    if (dead.length > 0) {
                        dead.forEach(i => board[i] = 0);
                        captures[player] += dead.length;
                        cleanUpPieces();
                    }
                }
            }

            turn = opponent;`],
        // 獅子の牙マーク: 隣に3石以下の敵連がある自石に牙印
        ...K.STONE_MARKS_SPEC(`            // 獅子の牙: 隣に小さな敵連を持つ石に牙マーク
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(239,68,68,0.6)';
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                ctx.lineCap = 'round';
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== turn) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const hasPrey = getNeighbors(i).some(n => {
                        if (board[n] !== (turn === 1 ? 2 : 1)) return false;
                        return getConnectedGroup(n, board[n]).length <= 3;
                    });
                    if (!hasPrey) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.18, cy - cellSize * 0.30);
                    ctx.lineTo(cx, cy - cellSize * 0.14);
                    ctx.lineTo(cx + cellSize * 0.18, cy - cellSize * 0.30);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'獅子頭: 隣の小敵連に噛み付く'`),
        [K.ONE, K.INFO_ALGO, `            獅子舞碁: 置くと隣の小さな敵連 (3石以下) に噛み付いて1石取る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石は獅子頭 — 隣の小さな敵連 (3石以下) から最も呼吸点の少ない石を1つ噛み落とす。',
            '大きな敵連には噛み付けない。小連を安全に立てると獅子の餌食になる。',
            '噛み落としは両者同じ条件 — 厄払いの舞は交互に回ってくる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 小敵連 (2石) に噛み付く
        board[I(4, 4)] = 2; board[I(4, 5)] = 2;
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1);
        const left = [I(4, 4), I(4, 5)].filter(i => board[i] === 2).length;
        assert('小敵連から1石噛み落とす', left === 1);
        assert('噛んだ石はアゲハマに', captures[1] === 1);
        // 大敵連 (4石) には噛み付かない
        board[I(8, 6)] = 2; board[I(8, 7)] = 2; board[I(8, 8)] = 2; board[I(8, 9)] = 2;
        const before = captures[1];
        executeMove({ cells: [{ x: 8, y: 5 }] }, 1);
        assert('大敵連は噛まない', captures[1] === before);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
