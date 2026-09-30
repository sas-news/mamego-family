// BINGOGO — ビンゴ碁: 中央5×5のビンゴラインを全て自石で埋めた側が即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'bingogo.html',
    en: 'BINGOGO',
    jp: 'ビンゴ碁',
    prefix: 'bingogo',
    desc: '中央5×5のビンゴカード。縦横斜めのラインを全て自石で埋めれば即勝ち。',
    kind: 'bingo',
    spec: [
        ...K.rb('BINGOGO', 'ビンゴ碁', 'bingogo'),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 中央5×5のビンゴライン: 中央行・中央列・両対角線 (各5点)
        function bingoLines() {
            const c = Math.floor(BOARD_SIZE / 2);
            const line = pts => pts.map(([x, y]) => (c + y) * BOARD_SIZE + (c + x));
            return [
                line([[-2,0],[-1,0],[0,0],[1,0],[2,0]]), // 中央行
                line([[0,-2],[0,-1],[0,0],[0,1],[0,2]]), // 中央列
                line([[-2,-2],[-1,-1],[0,0],[1,1],[2,2]]), // 対角線\
                line([[2,-2],[1,-1],[0,0],[-1,1],[-2,2]]), // 対角線/
            ];
        }
        function bingoWin(player) {
            return bingoLines().some(ln => ln.every(i => board[i] === player));
        }

        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // ビンゴルール: 着手した側がラインを完成させれば即勝ち
            if (bingoWin(player)) {
                const ln = bingoLines().find(l => l.every(i => board[i] === player));
                if (ln) ln.forEach(i => fxGlow(i, '#facc15', 1000));
                const cc = Math.floor(BOARD_SIZE / 2);
                fxShake(6, 380);
                fxText(cc * BOARD_SIZE + cc, 'BINGO!', '#facc15', 1500);
                winByRule(player, 'ビンゴ勝ち', '中央のビンゴラインを完成させました'); return;
            }

            turn = opponent;`],
        // 中央5×5のビンゴラインを帯で描く
        K.CUE_GRID(`            // ビンゴライン帯
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const bx = padding + c * cellSize, by = padding + c * cellSize;
                const len = cellSize * 4 + cellSize * 0.6, th = cellSize * 0.6;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.12);
                ctx.fillRect(bx - len / 2, by - th / 2, len, th); // 中央行
                ctx.fillRect(bx - th / 2, by - len / 2, th, len); // 中央列
                ctx.translate(bx, by);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-len / 2 - cellSize * 0.15, -th / 2, len + cellSize * 0.3, th);
                ctx.rotate(-Math.PI / 2);
                ctx.fillRect(-len / 2 - cellSize * 0.15, -th / 2, len + cellSize * 0.3, th);
                ctx.restore();
            }`),
        // リーチ表示: あと1個でビンゴのラインは空き点に警戒点を打つ
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                bingoLines().forEach(ln => {
                    [1, 2].forEach(pl => {
                        const filled = ln.filter(i => board[i] === pl);
                        const empty = ln.filter(i => board[i] === 0);
                        if (filled.length === 4 && empty.length === 1) {
                            const i = empty[0];
                            const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                            ctx.fillStyle = pl === 1 ? 'rgba(245,208,96,0.9)' : 'rgba(64,176,240,0.9)';
                            ctx.strokeStyle = 'rgba(220,60,60,0.9)';
                            ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                            ctx.beginPath();
                            ctx.arc(cx, cy, cellSize * 0.16, 0, Math.PI * 2);
                            ctx.fill(); ctx.stroke();
                        }
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央の5×5がビンゴカード。中央行・中央列・両対角線のいずれかを全て自石で埋めた側が即勝ち。',
            '相手のライン途中に割って入って阻止せよ。通常の地取り勝負も残る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const c = Math.floor(BOARD_SIZE / 2);
        for (let dx = -2; dx <= 1; dx++) executeMove({ cells: [{ x: c + dx, y: c }] }, 1);
        assert('4個では未完成', gameOver === false);
        executeMove({ cells: [{ x: c + 2, y: c }] }, 1);
        assert('中央行ビンゴで即勝ち', gameOver === true && gameResultData.title.includes('ビンゴ'));
    `,
};
