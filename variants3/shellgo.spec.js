// SHELLGO — 貝殻碁: 石は貝。2個以上繋がった連は「殻」を共有し、取られる時に半数だけ失う
const K = require('../gen_kit.js');
module.exports = {
    file: 'shellgo.html',
    en: 'SHELLGO',
    jp: '貝殻碁',
    prefix: 'shellgo',
    desc: '連なった石は殻を共有して強化。取られる時は外側の半数だけが失われる。',
    kind: 'stone',
    icon: 'shellgo',
    spec: [
        ...K.rb('SHELLGO', '貝殻碁', 'shellgo'),
        K.params([
            { key: 'shell_min', label: '殻ができる連の大きさ', min: 2, max: 6, def: 2, unit: '石' },
            { key: 'shell_frac', label: '殻で失う割合', min: 0.1, max: 1, def: 0.5, step: 0.1 },
        ]),
        // 捕獲: 2個以上の連は殻を共有 — 外側(連結度の低い)半分だけが取られる
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 貝殻: 連をBFSで分割し、各連は連結度の低い外側の半数(切り上げ)だけが取られる
                const cmap = new Set(captured);
                const seen = new Set();
                const toRemove = [];
                captured.forEach(start => {
                    if (seen.has(start)) return;
                    const grp = [];
                    const q = [start]; seen.add(start);
                    while (q.length > 0) {
                        const c = q.pop(); grp.push(c);
                        getNeighbors(c).forEach(n => {
                            if (cmap.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
                        });
                    }
                    if (grp.length >= Math.max(1, P('shell_min') || 2)) {
                        // 殻: 連結度(連内近傍数)の低い外側から半数を除去
                        const deg = grp.map(i => [i, getNeighbors(i).filter(n => cmap.has(n)).length]);
                        deg.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
                        deg.slice(0, Math.ceil(grp.length * Math.max(0, Math.min(1, P('shell_frac') ?? 0.5)))).forEach(([i]) => toRemove.push(i));
                    } else {
                        toRemove.push(grp[0]); // 単石には殻がない
                    }
                });
                toRemove.forEach(idx => {
                    fxBurst(idx, '#7dd3fc', 6, 1.2); // 砕ける貝殻
                    board[idx] = 0;
                });
                captures[player] += toRemove.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 殻の質感: 連なった石の輪郭に薄い殻光を描く
        ...K.STONE_MARKS_SPEC(`            // 貝殻: 同色隣接する石の間に殻の結合線
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(190,220,235,0.55)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.07);
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    getNeighbors(i).forEach(n => {
                        if (n > i && board[n] === board[i]) {
                            const nx = n % BOARD_SIZE, ny = (n / BOARD_SIZE) | 0;
                            ctx.beginPath();
                            ctx.arc(padding + (x + nx) * cellSize / 2, padding + (y + ny) * cellSize / 2, cellSize * 0.14, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    });
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            貝殻碁: 2個以上の連は殻を共有し、取られる時に外側の半数だけが失われる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '同じ色で2個以上繋がった連は「殻」を共有して強化される。',
            '殻を持つ連が取られる時、外側の石の半数 (切り上げ) だけが失われ、内側は残る。',
            '単石には殻がない。取り・呼吸・コウは通常通り。',
        ])],
        // 打ち切り + 連続パス即採点
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 白の4連 (2x2) を黒で包囲: 呼吸点は (2,1),(3,2),(2,3),(1,2) のみ
        board[I(2, 2)] = 2; board[I(3, 2)] = 2; board[I(2, 3)] = 2; board[I(3, 3)] = 2;
        board[I(2, 1)] = 1; board[I(3, 1)] = 1; board[I(1, 2)] = 1; board[I(1, 3)] = 1;
        board[I(4, 2)] = 1; board[I(4, 3)] = 1; board[I(2, 4)] = 1; board[I(3, 4)] = 1;
        // この盤面で白連の呼吸点は 0 → 次の黒の着手で取られる (殻で半数のみ)
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        const remaining = [board[I(2, 2)], board[I(3, 2)], board[I(2, 3)], board[I(3, 3)]].filter(v => v === 2).length;
        assert('4連は半数のみ失う', remaining === 2);
        assert('アゲハマは2個', captures[1] === 2);
        // 単石は殻なし: 呼吸点0の白石1個はまるごと取られる
        board.fill(0); pieces = []; history.length = 0; captures = { 1: 0, 2: 0 };
        board[I(5, 5)] = 2;
        board[I(4, 5)] = 1; board[I(6, 5)] = 1; board[I(5, 4)] = 1; board[I(5, 6)] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('単石は通常通り取られる', board[I(5, 5)] === 0 && captures[1] === 1);
    `,
};
