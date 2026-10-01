// BLOCKCITYGO — 街区碁: 碁盤は道路で区切られた街区状。街区ごとに領主が決まる
const K = require('../gen_kit.js');
module.exports = {
    file: 'blockcitygo.html',
    en: 'BLOCKCITYGO',
    jp: '街区碁',
    prefix: 'blockcitygo',
    desc: '盤は道路で区切られた街区状。終局時、各街区で石数多数の側が街区全域を領地とする。',
    kind: 'stone',
    icon: 'blockcitygo',
    spec: [
        ...K.rb('BLOCKCITYGO', '街区碁', 'blockcitygo'),
        K.params([
            { key: 'block_span', label: '道路の間隔', min: 3, max: 7, def: 4, hint: '街区サイズはこの値-1' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.8, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 街区: 道路 ((x+1)%span==0 || (y+1)%span==0) で分断された陸地成分
        function isRoad(x, y) { const s = Math.max(3, P('block_span') || 4); return (x + 1) % s === 0 || (y + 1) % s === 0; }
        let blockDetail = { 1: 0, 2: 0 }; // 直近の終局で領有した街区数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (isRoad(x, y)) board[y * BOARD_SIZE + x] = 3;
            }
            blockDetail = { 1: 0, 2: 0 };`],
        // 道路の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_BRICK('#55585e', '#2c2e33'))],
        // 道路を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        // 終局スコアに街区ボーナスを加算
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 街区ルール: 道路で分断された陸地成分ごとに石数多数の側が街区全域を領地とする
            blockDetail = { 1: 0, 2: 0 };
            {
                const seen = new Set();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 3 || seen.has(i)) continue;
                    const comp = [];
                    const q = [i]; seen.add(i);
                    while (q.length) {
                        const c = q.pop(); comp.push(c);
                        getNeighbors(c).forEach(n => {
                            if (board[n] !== 3 && !seen.has(n)) { seen.add(n); q.push(n); }
                        });
                    }
                    let b = 0, w = 0;
                    comp.forEach(ci => { if (board[ci] === 1) b++; else if (board[ci] === 2) w++; });
                    if (b > w) { territory.black += comp.length; blockDetail[1]++; }
                    else if (w > b) { territory.white += comp.length; blockDetail[2]++; }
                }
            }`],
        // スコア内訳に領有街区数を表示
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の領有街区:</span> <strong>\${blockDetail[1]}</strong></div>
                    <div class="flex justify-between"><span>白の領有街区:</span> <strong>\${blockDetail[2]}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, K.INFO_ALGO, `            街区碁: 道路で区切られた街区状の盤。街区ごとに領主が決まる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は道路で区切られた街区 (3x3程度の区域) の集まり。道路は着手不可・呼吸なし。',
            '終局時、各街区で石が多い側がその街区全域を領地として得る (通常の地にも加算)。',
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
        resetGame();
        assert('道路がある', board[I(3, 0)] === 3 && board[I(0, 3)] === 3);
        assert('道路には置けない', isValidPlacement([{ x: 3, y: 0 }], 1) === false);
        assert('街区には置ける', board[I(1, 1)] === 0 && isValidPlacement([{ x: 1, y: 1 }], 1) === true);
        // 街区ボーナス: 左上街区に黒を敷き詰めて終局
        board.fill(0);
        for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
            if (isRoad(x, y)) board[I(x, y)] = 3;
        }
        board[I(0, 0)] = 1; board[I(1, 0)] = 1; board[I(0, 1)] = 1;
        endGameByScore();
        assert('黒が街区を領有', blockDetail[1] >= 1);
    `,
};
