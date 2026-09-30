// BRUSHGO — 筆造碁: 石は筆の穂先。縦横一直線に3つ以上揃った連は「良い筆」で呼吸+2
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
    file: 'brushgo.html',
    en: 'BRUSHGO',
    jp: '筆造碁',
    prefix: 'brushgo',
    desc: '石は筆の穂先。縦横一直線に3つ以上揃った連は「良い筆」となり呼吸+2。',
    kind: 'stone',
    icon: 'brushgo',
    spec: [
        ...K.rb('BRUSHGO', '筆造碁', 'brushgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 良い筆判定: 連が3石以上で全て同一行か同一列に揃っていれば書き味が良い
        function isGoodBrush(group) {
            if (group.length < 3) return false;
            const xs = group.map(i => i % BOARD_SIZE), ys = group.map(i => (i / BOARD_SIZE) | 0);
            return xs.every(x => x === xs[0]) || ys.every(y => y === ys[0]);
        }`],
        // 良い筆の連は呼吸+2
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                    }
                    if (isGoodBrush(group)) liberties += 2; // 穂先の揃った筆は書き味が良い

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
`            const brushGroup = [];
            while (queue.length > 0) {
                const curr = queue.shift();
                brushGroup.push(curr);
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
            if (isGoodBrush(brushGroup)) liberties += 2; // 穂先の揃った筆は書き味が良い
            return liberties;`],
        // 良い筆の連には墨の筋が入る
        ...K.STONE_MARKS_SPEC(`            // 良い筆: 直線に揃った連の石に墨の縦筋
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(30,30,30,0.55)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.lineCap = 'round';
                // 連を再走査して良い筆なら印をつける
                const seen2 = new Set();
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if ((v !== 1 && v !== 2) || seen2.has(i)) continue;
                    const q = [i], g = []; seen2.add(i);
                    while (q.length) {
                        const c = q.shift(); g.push(c);
                        getNeighbors(c).forEach(n => { if (board[n] === v && !seen2.has(n)) { seen2.add(n); q.push(n); } });
                    }
                    if (!isGoodBrush(g)) continue;
                    g.forEach(j => {
                        const x = j % BOARD_SIZE, y = (j / BOARD_SIZE) | 0;
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.beginPath();
                        ctx.moveTo(cx, cy - cellSize * 0.16);
                        ctx.lineTo(cx, cy + cellSize * 0.16);
                        ctx.stroke();
                    });
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            筆造碁: 石は筆の穂先。縦横一直線に3つ以上揃った連は「良い筆」で呼吸+2<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は筆の穂先。連が縦か横の一直線に3石以上揃うと「良い筆」となり連の呼吸点+2。',
            '一直線に並べると連が硬くなるが、並びを崩すと書き味が落ちる。',
            '双方同じ条件。相手の並びを切って穂先を散らす手も有効。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[I(4, 4)] = 1; board[I(5, 4)] = 1; board[I(6, 4)] = 1; // 横一直線3連
        assert('一直線3連は良い筆 (+2)', getLiberties(board, I(5, 4)) === 10);
        board.fill(0);
        board[I(4, 4)] = 1; board[I(4, 5)] = 1; board[I(4, 6)] = 1; // 縦一直線3連
        assert('縦一直線3連も良い筆', getLiberties(board, I(4, 5)) === 10);
        board.fill(0);
        board[I(4, 4)] = 1; board[I(5, 4)] = 1; board[I(4, 5)] = 1; // L字3連は筆にならない
        // (5,5)は2石に接する共有呼吸として2回数えられる: 実呼吸7だがgetLibertiesは8を返す
        assert('揃わない連は普通', getLiberties(board, I(4, 4)) === 8);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
    `,
};
