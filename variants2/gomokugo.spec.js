// GOMOKUGO — 五目碁: 5連を作った側が即勝ち (地取り勝負も残る)
const K = require('../gen_kit.js');
module.exports = {
    file: 'gomokugo.html',
    en: 'GOMOKUGO',
    jp: '五目碁',
    prefix: 'gomokugo',
    desc: '縦横斜めに5連を作れば即勝ち。通常の地取り勝負も残る。',
    kind: 'stone',
    spec: [
        ...K.rb('GOMOKUGO', '五目碁', 'gomokugo'),
        K.params([
            { key: 'run_len', label: '勝利に必要な連の長さ', min: 3, max: 7, def: 5, unit: '連' },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        // 手番交代直前に5連判定
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 五目碁: 縦・横・斜めに5連以上の自分色があれば即勝ち
            {
                const gdirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
                let fiveCells = null;
                gcheck: for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    const bx = i % BOARD_SIZE, by = Math.floor(i / BOARD_SIZE);
                    for (const [dx, dy] of gdirs) {
                        let n = 0; const cells = [];
                        for (let k = 0; k < (P('run_len') || 5); k++) {
                            const nx = bx + dx * k, ny = by + dy * k;
                            if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
                            if (board[ny * BOARD_SIZE + nx] !== player) break;
                            cells.push(ny * BOARD_SIZE + nx); n++;
                        }
                        if (n >= (P('run_len') || 5)) { fiveCells = cells; break gcheck; }
                    }
                }
                if (fiveCells) {
                    fiveCells.forEach(i => fxGlow(i, '#facc15', 1000));
                    fxText(fiveCells[Math.floor(fiveCells.length / 2)], (P('run_len') || 5) + '連!', '#facc15', 1500);
                    fxShake(6, 380);
                    winByRule(player, '五目勝ち', '自分の石を5つ以上連続で並べました'); return;
                }
            }

            turn = opponent;`],
        // 四の警告: あと1手で五連になる連の伸び端に警戒点を打つ
        ...K.STONE_MARKS_SPEC(`            {
                const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const v = board[y * BOARD_SIZE + x];
                    if (v !== 1 && v !== 2) continue;
                    for (const [dx, dy] of dirs) {
                        const bx = x - dx, by = y - dy;
                        if (bx >= 0 && by >= 0 && bx < BOARD_SIZE && by < BOARD_SIZE && board[by * BOARD_SIZE + bx] === v) continue;
                        let run = 1;
                        while (true) {
                            const nx = x + dx * run, ny = y + dy * run;
                            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE || board[ny * BOARD_SIZE + nx] !== v) break;
                            run++;
                        }
                        if (run !== (P('run_len') || 5) - 1) continue;
                        [[x - dx, y - dy], [x + dx * ((P('run_len') || 5) - 1), y + dy * ((P('run_len') || 5) - 1)]].forEach(([ex, ey]) => {
                            if (ex < 0 || ey < 0 || ex >= BOARD_SIZE || ey >= BOARD_SIZE) return;
                            if (board[ey * BOARD_SIZE + ex] !== 0) return;
                            ctx.fillStyle = 'rgba(239,68,68,0.85)';
                            ctx.beginPath();
                            ctx.arc(padding + ex * cellSize, padding + ey * cellSize, cellSize * 0.13, 0, Math.PI * 2);
                            ctx.fill();
                        });
                    }
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            五目碁: 縦横斜めに5連を作れば即勝ち。地取り勝負にもなる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手の時点で自分の石が縦・横・斜めのいずれかに5連以上なら即座に勝利。',
            '5連を狙いつつ相手の連結を切る攻守一体の勝負。並ばなければ通常の地取り決着。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('単独着手では続く', gameOver === false);
        board.fill(0); pieces = [];
        for (let x = 0; x < 4; x++) board[x] = 1;
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1);
        assert('5連で即勝ち', gameOver === true);
        assert('結果は五目', !!gameResultData && gameResultData.title.includes('五目'));
    `,
};
