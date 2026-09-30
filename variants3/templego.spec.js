// TEMPLEGO — 寺院碁: 中央の寺院区域(3x3)に接する自軍連が4石以上で即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'templego.html',
    en: 'TEMPLEGO',
    jp: '寺院碁',
    prefix: 'templego',
    desc: '中央3x3の寺院区域に接する自分の連が4石以上になった側が即勝ち。',
    kind: 'stone',
    icon: 'templego',
    spec: [
        ...K.rb('TEMPLEGO', '寺院碁', 'templego'),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 寺院区域(中央3x3)に隣接する自分の連: 区域内に入らず周縁から接する石が4個以上で勝利
        function templeVictor(player) {
            const c = Math.floor(BOARD_SIZE / 2);
            const inZone = (x, y) => x >= c - 1 && x <= c + 1 && y >= c - 1 && y <= c + 1;
            const visited = Array(board.length).fill(false);
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || visited[i]) continue;
                let adj = 0;
                const queue = [i];
                visited[i] = true;
                while (queue.length > 0) {
                    const cur = queue.shift();
                    const cx = cur % BOARD_SIZE, cy = Math.floor(cur / BOARD_SIZE);
                    if (!inZone(cx, cy) && getNeighbors(cur).some(n =>
                        inZone(n % BOARD_SIZE, Math.floor(n / BOARD_SIZE)))) adj++;
                    getNeighbors(cur).forEach(n => {
                        if (board[n] === player && !visited[n]) { visited[n] = true; queue.push(n); }
                    });
                }
                if (adj >= 4) return i;
            }
            return -1;
        }

        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 寺院ルール: 区域に接する連が4石以上で制圧勝ち
            {
                const ti = templeVictor(player);
                if (ti >= 0) {
                    fxGlow(ti, '#facc15', 1000);
                    fxText(ti, '寺院制圧!', '#f59e0b', 1400);
                    fxShake(5, 360);
                    winByRule(player, '寺院制圧勝ち', '寺院区域を4連以上で囲みました'); return;
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        // 寺院区域の描画
        K.CUE_STARS(`            // 寺院区域: 金色の境内と「寺」の字
            {
                const c0 = Math.floor(BOARD_SIZE / 2);
                const zx = padding + (c0 - 1) * cellSize - cellSize / 2;
                const zy = padding + (c0 - 1) * cellSize - cellSize / 2;
                ctx.save();
                ctx.fillStyle = 'rgba(212,175,55,0.13)';
                ctx.fillRect(zx, zy, cellSize * 3, cellSize * 3);
                ctx.strokeStyle = 'rgba(180,140,40,0.85)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.strokeRect(zx, zy, cellSize * 3, cellSize * 3);
                ctx.fillStyle = 'rgba(165,60,40,0.75)';
                ctx.font = 'bold ' + Math.floor(cellSize * 0.7) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('寺', padding + c0 * cellSize, padding + c0 * cellSize);
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '中央3x3の「寺院区域」に隣接する自分の連が、その周縁接点を4つ以上持つと即勝ち。',
            '区域自体には普通に打てるが、囲む側を急ぐ方が早い。140手を超えた時点で地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const c = Math.floor(BOARD_SIZE / 2);
        // 周縁接点が繋がる形: 左列2 + 隅経由で上辺3 (接点計4)
        [[c-2, c-1], [c-2, c-2], [c-1, c-2], [c, c-2]].forEach(([x, y]) =>
            executeMove({ cells: [{ x, y }] }, 1));
        assert('接点3ではまだ続行', gameOver === false);
        executeMove({ cells: [{ x: c + 1, y: c - 2 }] }, 1);
        assert('接点4で寺院制圧勝ち', gameOver === true);
        assert('結果に寺院制圧', !!gameResultData && gameResultData.title.includes('寺院'));
    `,
};
