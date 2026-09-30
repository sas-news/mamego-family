// SWEEPERGO — 掃海碁: 地雷が埋まっており空点には隣接地雷数が表示される
const K = require('../gen_kit.js');
module.exports = {
    file: 'sweepergo.html',
    en: 'SWEEPERGO',
    jp: '掃海碁',
    prefix: 'sweepergo',
    desc: '盤に地雷。空点の数字は周囲8マスの地雷数。踏むと石が吹き飛ぶ。',
    kind: 'stone',
    spec: [
        ...K.rb('SWEEPERGO', '掃海碁', 'sweepergo'),
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
        let mineSet = new Set(); // 埋まっている地雷の位置 (idx)`],
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 掃海碁: 地雷を敷設 (盤面の約1割)
            mineSet = new Set();
            while (mineSet.size < Math.max(3, Math.floor(board.length / 10))) {
                mineSet.add(Math.floor(Math.random() * board.length));
            }`],
        // 地雷を踏んだ石は爆発して相手の得点に
        [K.ONE, K.CAPTURE_BLOCK, `            // 掃海碁: 地雷マスに置くと石は吹き飛び、相手のアゲハマになる
            {
                let blasted = false;
                move.cells.forEach(p => {
                    const bi = p.y * BOARD_SIZE + p.x;
                    if (mineSet.has(bi)) {
                        mineSet.delete(bi);
                        board[bi] = 0;
                        captures[opponent]++;
                        blasted = true;
                    }
                });
                if (blasted) cleanUpPieces();
            }

            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 空点に隣接地雷数を表示 (マインスイーパー風)
        ...K.STONE_MARKS_SPEC(`            ctx.save();
            ctx.font = 'bold ' + Math.floor(cellSize * 0.42) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0 || mineSet.size === 0) continue;
                const mx = i % BOARD_SIZE, my = Math.floor(i / BOARD_SIZE);
                let n = 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = mx + dx, ny = my + dy;
                    if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                    if (mineSet.has(ny * BOARD_SIZE + nx)) n++;
                }
                if (n > 0) {
                    const colors = ['', '#3a6fd8', '#3c8a3c', '#d83c3c', '#8030a8', '#a06030', '#308a8a', '#444', '#666'];
                    ctx.fillStyle = colors[Math.min(n, 8)];
                    ctx.fillText(String(n), padding + mx * cellSize, padding + my * cellSize);
                }
            }
            ctx.restore();`),
        [K.ONE, K.INFO_ALGO, `            掃海碁: 地雷を踏むと石が吹き飛ぶ。数字は周囲8マスの地雷数<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '対局開始時に盤面の約1割に地雷が埋められる (位置は非公開)。',
            '空点の数字は周囲8マスの地雷数。地雷を踏んだ石は吹き飛び相手のアゲハマになる。',
            '数字を読んで安全地帯を推理しながら石を置こう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        mineSet = new Set([5]);
        executeMove({ cells: [{ x: 5, y: 0 }] }, 1);
        assert('地雷を踏むと石は消える', board[5] === 0);
        assert('踏んだ地雷は相手得点', captures[2] === 1);
        assert('地雷は消費される', mineSet.size === 0);
        resetGame();
        assert('対局開始に地雷が敷設', mineSet.size >= 3);
    `,
};
