// TILENGO — 敷詰碁: 盤は7つのタイル領域。終局時、各タイルで石数多数の側がタイル全域を得る
const K = require('../gen_kit.js');
module.exports = {
    file: 'tilengo.html',
    en: 'TILENGO',
    jp: '敷詰碁',
    prefix: 'tilengo',
    desc: '盤は7枚のタイルに分割。終局時、各タイルで石数多数の側がタイル全域を領地とする。',
    kind: 'stone',
    icon: 'tilengo',
    spec: [
        ...K.rb('TILENGO', '敷詰碁', 'tilengo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.8, hint: '交点数比' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 敷詰: 7つのシードへの最近接 (マンハッタン) でタイルを割る
        const TILE_SEEDS = [
            [0.18, 0.20], [0.52, 0.14], [0.82, 0.24],
            [0.28, 0.52], [0.72, 0.52],
            [0.16, 0.82], [0.56, 0.82],
        ];
        const TILE_ID = new Int8Array(BOARD_SIZE * BOARD_SIZE);
        for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
            let best = 0, bd = 1e9;
            TILE_SEEDS.forEach(([fx, fy], k) => {
                const d = Math.abs(x - fx * (BOARD_SIZE - 1)) + Math.abs(y - fy * (BOARD_SIZE - 1));
                if (d < bd) { bd = d; best = k; }
            });
            TILE_ID[y * BOARD_SIZE + x] = best;
        }
        let tileDetail = { 1: 0, 2: 0 }; // 直近の終局で領有したタイル数`],
        // 終局スコアにタイルボーナスを加算
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 敷詰ルール: 各タイルで石数多数の側がタイル全域を領地とする
            tileDetail = { 1: 0, 2: 0 };
            {
                for (let k = 0; k < TILE_SEEDS.length; k++) {
                    let b = 0, w = 0, area = 0;
                    for (let i = 0; i < board.length; i++) {
                        if (TILE_ID[i] !== k) continue;
                        area++;
                        if (board[i] === 1) b++; else if (board[i] === 2) w++;
                    }
                    if (b > w) { territory.black += area; tileDetail[1]++; }
                    else if (w > b) { territory.white += area; tileDetail[2]++; }
                }
            }`],
        // スコア内訳に領有タイル数を表示
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の領有タイル:</span> <strong>\${tileDetail[1]}</strong></div>
                    <div class="flex justify-between"><span>白の領有タイル:</span> <strong>\${tileDetail[2]}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        // タイル境界の描画 (格子線の直前: ボロノイの稜線を点線で)
        K.CUE_GRID(`            // 敷詰: タイル境界の点線
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(45,212,191,0.45)';
                ctx.lineWidth = Math.max(1.3, cellSize * 0.06);
                ctx.setLineDash([cellSize * 0.16, cellSize * 0.14]);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = y * BOARD_SIZE + x;
                    const t = TILE_ID[i];
                    if (x + 1 < BOARD_SIZE && TILE_ID[i + 1] !== t) {
                        const lx = padding + x * cellSize + cellSize / 2;
                        ctx.beginPath();
                        ctx.moveTo(lx, padding + y * cellSize - cellSize / 2);
                        ctx.lineTo(lx, padding + y * cellSize + cellSize / 2);
                        ctx.stroke();
                    }
                    if (y + 1 < BOARD_SIZE && TILE_ID[i + BOARD_SIZE] !== t) {
                        const ly = padding + y * cellSize + cellSize / 2;
                        ctx.beginPath();
                        ctx.moveTo(padding + x * cellSize - cellSize / 2, ly);
                        ctx.lineTo(padding + x * cellSize + cellSize / 2, ly);
                        ctx.stroke();
                    }
                }
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            敷詰碁: 盤は7枚のタイル。各タイルで石数多数の側が全域を得る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は7枚のタイル (点線区切り) に敷き詰められている。',
            '終局時、各タイル内で石が多い側がタイル全域を領地として得る (通常の地にも加算)。',
        ])],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
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
        assert('全マスがタイルに属する', (() => { for (let i = 0; i < board.length; i++) if (TILE_ID[i] < 0) return false; return true; })());
        assert('タイルは7枚', TILE_SEEDS.length === 7);
        // シード0のタイルに黒を置いて領有させる
        const k = TILE_ID[0];
        for (let i = 0; i < board.length; i++) if (TILE_ID[i] === k) board[i] = 1;
        endGameByScore();
        assert('黒がタイルを領有', tileDetail[1] >= 1);
        assert('終局', gameOver === true);
    `,
};
