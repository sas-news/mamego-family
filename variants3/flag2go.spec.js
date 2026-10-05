// FLAG2GO — 旗揚碁: 自陣の旗点3か所に「旗」(3連以上の連)を立てた側が即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'flag2go.html',
    en: 'FLAG2GO',
    jp: '旗揚碁',
    prefix: 'flag2go',
    desc: '自陣端の3つの旗点それぞれに、3連以上の自分の連を立てれば即勝ち。',
    kind: 'stone',
    icon: 'flag2go',
    spec: [
        ...K.rb('FLAG2GO', '旗揚碁', 'flag2go'),
        K.params([
            { key: 'flag_size', label: '旗の立つ連の大きさ', min: 2, max: 8, def: 3, unit: '石' },
            { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 600, def: 140, unit: '手' },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 旗点: 黒は最下行 (自陣)、白は最上行の3点
        function flagPoints(player) {
            const c = Math.floor(BOARD_SIZE / 2);
            const y = player === 1 ? BOARD_SIZE - 1 : 0;
            return [Math.max(0, c - 4), c, Math.min(BOARD_SIZE - 1, c + 4)].map(x => y * BOARD_SIZE + x);
        }
        function groupSizeAt(idx, player) {
            if (idx < 0 || board[idx] !== player) return 0;
            const seen = new Set([idx]);
            const q = [idx];
            let n = 0;
            while (q.length) {
                const cur = q.shift();
                n++;
                getNeighbors(cur).forEach(m => {
                    if (board[m] === player && !seen.has(m)) { seen.add(m); q.push(m); }
                });
            }
            return n;
        }
        // 旗が立っている旗点の数
        function flagsUp(player) {
            return flagPoints(player).filter(i => groupSizeAt(i, player) >= Math.max(2, P('flag_size') || 3)).length;
        }

        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 旗揚ルール: 自陣3旗点すべてに旗(3連以上)が立ったら即勝ち
            if (flagsUp(player) >= 3) {
                const fi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxGlow(fi, '#facc15', 1000);
                fxText(fi, '三旗!', '#facc15', 1500);
                fxShake(6, 380);
                winByRule(player, '旗揚勝ち', '自陣の3つの旗点すべてに旗を立てました'); return;
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= Math.max(1, P('ply_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        // 旗点の描画 (小旗の竿)
        K.CUE_STARS(`            // 旗点: 自陣端の3つの旗竿マーカー
            {
                ctx.save();
                [1, 2].forEach(pl => {
                    flagPoints(pl).forEach(fi => {
                        const fx = fi % BOARD_SIZE, fy = Math.floor(fi / BOARD_SIZE);
                        const cx = padding + fx * cellSize;
                        const cy = padding + fy * cellSize;
                        const up = groupSizeAt(fi, pl) >= Math.max(2, P('flag_size') || 3);
                        const dirY = pl === 1 ? -1 : 1;
                        ctx.strokeStyle = up ? '#facc15' : 'rgba(120,110,90,0.55)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(cx, cy + dirY * cellSize * 0.55);
                        ctx.stroke();
                        ctx.fillStyle = up ? (pl === 1 ? '#ef4444' : '#3b82f6') : 'rgba(150,140,120,0.5)';
                        ctx.beginPath();
                        ctx.moveTo(cx, cy + dirY * cellSize * 0.55);
                        ctx.lineTo(cx + cellSize * 0.26, cy + dirY * cellSize * 0.44);
                        ctx.lineTo(cx, cy + dirY * cellSize * 0.33);
                        ctx.closePath();
                        ctx.fill();
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '自陣の端 (黒=下端, 白=上端) にある3つの旗点それぞれに「旗」を立てると即勝ち。',
            '旗が立つ条件: 旗点の石を含む自分の連が3石以上。旗は取られると倒れる。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const fy = BOARD_SIZE - 1;
        [[1, fy], [2, fy], [3, fy]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 1));
        assert('旗1本では続行', gameOver === false && flagsUp(1) === 1);
        [[5, fy], [6, fy], [7, fy]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 1));
        assert('旗2本では続行', gameOver === false && flagsUp(1) === 2);
        [[9, fy], [10, fy], [11, fy]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 1));
        assert('旗3本で即勝ち', gameOver === true);
        assert('旗揚勝ち表示', !!gameResultData && gameResultData.title.includes('旗揚'));
    `,
};
