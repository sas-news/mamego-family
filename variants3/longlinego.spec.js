// LONGLINEGO — 延縄碁: 5個以上の連は延縄。6手ごとに隣接する敵の孤立石を釣り上げる
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
    file: 'longlinego.html',
    en: 'LONGLINEGO',
    jp: '延縄碁',
    prefix: 'longlinego',
    desc: '5個以上の連は延縄。6手ごとに隣の敵の孤立石を釣り上げる。',
    kind: 'stone',
    icon: 'longlinego',
    spec: [
        ...K.rb('LONGLINEGO', '延縄碁', 'longlinego'),
        // 連をたどる補助関数
        [K.ONE, `        function isValidPlacement(cells, player) {`, `        // 延縄: 連の石と大きさを数える
        function groupCells(idx) {
            const pl = board[idx];
            if (pl !== 1 && pl !== 2) return [];
            const seen = new Set([idx]);
            const q = [idx];
            while (q.length) {
                const c0 = q.shift();
                getNeighbors(c0).forEach(n => {
                    if (board[n] === pl && !seen.has(n)) { seen.add(n); q.push(n); }
                });
            }
            return [...seen];
        }

        function isValidPlacement(cells, player) {`],
        // 延縄: 6手ごとに大きな連 (5+) が隣の敵の孤立石を釣る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 延縄: 6手ごとに5個以上の連が隣接する敵の孤立石を釣り上げる
            if (history.length > 0 && history.length % 6 === 0) {
                const hooked = [];
                const counted = new Set();
                for (let i = 0; i < board.length; i++) {
                    const pl = board[i];
                    if ((pl !== 1 && pl !== 2) || counted.has(i)) continue;
                    const g = groupCells(i);
                    g.forEach(c => counted.add(c));
                    if (g.length < 5) continue;
                    // 延縄の隣にいる敵の孤立石を探す
                    g.forEach(c => {
                        getNeighbors(c).forEach(n => {
                            const ev = board[n];
                            if (ev === 0 || ev === pl) return;
                            if (groupCells(n).length === 1) hooked.push({ idx: n, by: pl });
                        });
                    });
                }
                if (hooked.length) {
                    hooked.forEach(h => {
                        if (board[h.idx] === 0 || board[h.idx] === h.by) return; // 重複釣り防止
                        board[h.idx] = 0;
                        captures[h.by]++;
                        fxBurst(h.idx, '#22d3ee', 8, 1.5);
                        fxText(h.idx, '釣れた!', '#06b6d4', 1000);
                    });
                    cleanUpPieces();
                    fxShake(3, 260);
                }
            }

            turn = opponent;`],
        // 大きな連に延縄ライン
        ...K.STONE_MARKS_SPEC(`            // 延縄: 5個以上の連に縄ライン
            {
                ctx.save();
                const counted = new Set();
                for (let i = 0; i < board.length; i++) {
                    const pl = board[i];
                    if ((pl !== 1 && pl !== 2) || counted.has(i)) continue;
                    const g = groupCells(i);
                    g.forEach(c => counted.add(c));
                    if (g.length < 5) continue;
                    ctx.strokeStyle = pl === 1 ? 'rgba(103, 232, 249, 0.8)' : 'rgba(8, 145, 178, 0.8)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    g.forEach(c => {
                        const cx = padding + (c % BOARD_SIZE) * cellSize;
                        const cy = padding + Math.floor(c / BOARD_SIZE) * cellSize;
                        ctx.moveTo(cx + cellSize * 0.14, cy);
                        ctx.arc(cx, cy, cellSize * 0.14, 0, Math.PI * 2);
                    });
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'延縄まで ' + (6 - (history.length % 6)) + ' 手'`),
        [K.ONE, K.INFO_ALGO, `            延縄碁: 5個以上の連は延縄。6手ごとに隣の敵の孤立石を釣る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '5個以上繋がった連は「延縄」。6手ごとに縄に隣接する敵の孤立石 (大きさ1の連) を釣り上げてアゲハマにする。',
            '大きな連は強いが縄の間合いに敵が来れば釣られる。孤立石を近づけるな。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('連を数えられる', (() => { board.fill(0); board[I(3, 3)] = 1; board[I(4, 3)] = 1; return groupCells(I(3, 3)).length === 2; })());
        // 黒の5連の隣に白の孤立石
        board.fill(0); pieces = []; history.length = 0; captures = { 1: 0, 2: 0 };
        for (let x = 2; x <= 6; x++) board[I(x, 5)] = 1;
        board[I(4, 6)] = 2;
        history.push({}, {}, {}, {}, {});
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // history=6 → 延縄
        assert('孤立石が釣られた', board[I(4, 6)] === 0);
        assert('釣った側のアゲハマ', captures[1] === 1);
        board.fill(0); pieces = []; history.length = 0;
        assert('通常着手は合法', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
    `,
};
