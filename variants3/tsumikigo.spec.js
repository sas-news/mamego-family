// TSUMIKIGO — 積木碁: 石は積み木。5-9石の連は安定して呼吸+1、10石以上の連は崩れそうで呼吸-1
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
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tsumikigo.html',
    en: 'TSUMIKIGO',
    jp: '積木碁',
    prefix: 'tsumikigo',
    desc: '石は積み木。5-9石の連は安定して呼吸+1、10石以上の連は頭でっかちで呼吸-1。',
    kind: 'stone',
    icon: 'tsumikigo',
    spec: [
        ...K.rb('TSUMIKIGO', '積木碁', 'tsumikigo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 積み木の安定判定: 5-9石で安定 (+1)、10石以上で頭でっかち (-1)
        function stackBonus(n) {
            if (n >= 10) return -1;
            if (n >= 5) return 1;
            return 0;
        }`],
        // 連の高さで呼吸が変わる
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                    }
                    liberties = Math.max(0, liberties + stackBonus(group.length)); // 積み木の安定

                    if (liberties <= 0) {`],
        [K.ONE, `            while (queue.length > 0) {
                const curr = queue.shift();
                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;
                    } else if (boardState[n] === player && !visited[n]) {
                        visited[n] = true;
                        queue.push(n);
                    }
                });
            }
            return liberties;`,
`            let tsumiCount = 0;
            while (queue.length > 0) {
                const curr = queue.shift();
                tsumiCount++;
                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;
                    } else if (boardState[n] === player && !visited[n]) {
                        visited[n] = true;
                        queue.push(n);
                    }
                });
            }
            liberties = Math.max(0, liberties + stackBonus(tsumiCount)); // 積み木の安定
            return liberties;`],
        // 積み木の印: 安定した連の石に茶色の層線
        ...K.STONE_MARKS_SPEC(`            // 積み上がった連 (5-9石): 茶色の層線が見える
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(146,64,14,0.5)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                const seen = new Set();
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if ((v !== 1 && v !== 2) || seen.has(i)) continue;
                    const q = [i], g = []; seen.add(i);
                    while (q.length) {
                        const c = q.shift(); g.push(c);
                        getNeighbors(c).forEach(n => { if (board[n] === v && !seen.has(n)) { seen.add(n); q.push(n); } });
                    }
                    if (g.length < 5) continue;
                    const wob = g.length >= 10;
                    ctx.strokeStyle = wob ? 'rgba(220,38,38,0.55)' : 'rgba(146,64,14,0.5)';
                    g.forEach(j => {
                        const x = j % BOARD_SIZE, y = (j / BOARD_SIZE) | 0;
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.beginPath();
                        ctx.moveTo(cx - cellSize * 0.14, cy - cellSize * 0.05);
                        ctx.lineTo(cx + cellSize * 0.14, cy - cellSize * 0.05);
                        ctx.moveTo(cx - cellSize * 0.14, cy + cellSize * 0.07);
                        ctx.lineTo(cx + cellSize * 0.14, cy + cellSize * 0.07);
                        ctx.stroke();
                    });
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            積木碁: 石は積み木。5-9石の連は安定 (+1呼吸)、10石以上の連は崩れそう (-1呼吸)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は積み木。5-9石の連はバランスよく積まれて連の呼吸点+1。',
            '10石以上の連は頭でっかちで崩れそう — 連の呼吸点-1。',
            '適度な高さに積むと硬い。相手の連を大きくしすぎると崩れやすい。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('積み木判定', stackBonus(3) === 0 && stackBonus(6) === 1 && stackBonus(10) === -1);
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        // 縦5連 (y=3..7): 呼吸 = 上下端2 + 左右10 = 12 → +1 = 13
        for (let y = 3; y <= 7; y++) board[I(5, y)] = 1;
        assert('5連は安定+1', getLiberties(board, I(5, 5)) === 13);
        board.fill(0);
        // 縦10連 (y=1..10): 呼吸 = 上下端2 + 左右20 = 22 → -1 = 21
        for (let y = 1; y <= 10; y++) board[I(5, y)] = 1;
        assert('10連は崩れそう-1', getLiberties(board, I(5, 5)) === 21);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
