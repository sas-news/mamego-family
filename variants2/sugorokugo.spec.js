// SUGOROKUGO — 双六碁: 盤面は螺旋の升目。着手ごとに進み、先に上がれば勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'sugorokugo.html',
    en: 'SUGOROKUGO',
    jp: '双六碁',
    prefix: 'sugorokugo',
    desc: '盤面は螺旋の升目。着手ごとに1〜3進み、先に中央へ上がれば勝ち。',
    kind: 'stone',
    spec: [
        ...K.rb('SUGOROKUGO', '双六碁', 'sugorokugo'),
        K.params([
            { key: 'dice_max', label: '駒の進み幅の上限', min: 1, max: 6, def: 3, unit: 'マス' },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 双六碁: 盤面を外周から中央へ這う螺旋の升目を生成
        function buildSugoPath(size) {
            const seen = new Set();
            const path = [];
            let sx = -1, sy = 0, sdx = 1, sdy = 0;
            while (path.length < size * size) {
                const nx = sx + sdx, ny = sy + sdy;
                if (nx < 0 || ny < 0 || nx >= size || ny >= size || seen.has(ny * size + nx)) {
                    const tmp = sdx; sdx = -sdy; sdy = tmp;
                    continue;
                }
                sx = nx; sy = ny;
                path.push(sy * size + sx);
                seen.add(sy * size + sx);
            }
            return path;
        }

        function endGameByScore() {`],
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
        let sugoPath = [];            // 螺旋の升目 (idx列)
        let sugoPos = { 1: 0, 2: 0 }; // 各プレイヤーの駒位置 (升目index)`],
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            sugoPath = buildSugoPath(BOARD_SIZE);
            sugoPos = { 1: 0, 2: 0 };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 双六碁: 着手ごとに1〜3マス進み、中央のゴールへ先に上がれば勝ち
            {
                if (sugoPath.length !== board.length) sugoPath = buildSugoPath(BOARD_SIZE);
                const prevPos = sugoPos[player];
                const step = 1 + Math.floor(Math.random() * (P('dice_max') || 3));
                sugoPos[player] += step;
                // 駒の進み: 旧升目から新升目へ滑らせる
                const fromIdx = sugoPath[Math.min(prevPos, sugoPath.length - 1)];
                const toIdx = sugoPath[Math.min(sugoPos[player], sugoPath.length - 1)];
                fxSlide(fromIdx, toIdx, 420);
                fxText(toIdx, '+' + step, '#40b0f0', 900);
                if (sugoPos[player] >= sugoPath.length - 1) {
                    fxShake(6, 340);
                    fxText(toIdx, '上がり!', '#facc15', 1400);
                    winByRule(player, '上がり勝ち', '双六の升目を先に上がりました');
                    return;
                }
            }

            turn = opponent;`],
        // 升目の帯を描く
        K.CUE_GRID(`            if (sugoPath.length === board.length) {
                ctx.save();
                sugoPath.forEach((si, k) => {
                    if (k % 2 === 0) return;
                    const sx = si % BOARD_SIZE, sy = Math.floor(si / BOARD_SIZE);
                    ctx.fillStyle = 'rgba(90,120,200,0.10)';
                    ctx.fillRect(padding + (sx - 0.5) * cellSize, padding + (sy - 0.5) * cellSize, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        // 駒 (両者の現在地) を描く
        ...K.STONE_MARKS_SPEC(`            [1, 2].forEach(pl => {
                const pos = sugoPath[sugoPos[pl]];
                if (pos === undefined) return;
                const sx = pos % BOARD_SIZE, sy = Math.floor(pos / BOARD_SIZE);
                const cx = padding + sx * cellSize, cy = padding + sy * cellSize;
                ctx.save();
                ctx.strokeStyle = pl === 1 ? '#f0d050' : '#40b0f0';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.16 + pl * cellSize * 0.04, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            });`),
        [K.ONE, K.INFO_BASE, `            双六碁: 着手ごとに駒が1〜3進み、先に上がれば勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤面は外周から中央へ続く螺旋の升目。着手するたびに自分の駒が1〜3マス進む。',
            '先に中央のゴールへ上がった側が即勝ち。囲碁の地取り勝負と並走する速度レース。',
            '手数そのものがサイコロ — 多く打つほどゴールに近づく。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        assert('升目は全マス', sugoPath.length === board.length);
        sugoPos[1] = sugoPath.length - 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上がりで勝ち', gameOver === true);
        assert('結果は上がり', !!gameResultData && gameResultData.title.includes('上がり'));
    `,
};
