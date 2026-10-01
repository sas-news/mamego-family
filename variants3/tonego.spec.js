// TONEGO — 音石碁: 列ごとに音が割り当てられる。隣接する同色石の和音・不協和音が終局得点に響く
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tonego.html',
    en: 'TONEGO',
    jp: '音石碁',
    prefix: 'tonego',
    desc: '列ごとにドレミの音が割り当てられる。和音の同色隣接は+1目、不協和は-1目。',
    kind: 'stone',
    icon: 'tonego',
    spec: [
        ...K.rb('TONEGO', '音石碁', 'tonego'),
        K.params([
            { key: 'harmony', label: '和音の得点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'dissonance', label: '不協和の減点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.9, hint: '交点数比' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 音: 列 (x) を7音階に割り当てる。和音=完全4・5度、不協和=短・長2度
        const TONE_NAMES = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ'];
        function toneOf(x) { return x % 7; }
        function toneHarmony(a, b) {
            const d = ((a - b) % 7 + 7) % 7;
            if (d === 0) return 0;
            if (d === 3 || d === 4) return (P('harmony') ?? 1);   // 完全4度・5度: 和音 +1
            if (d === 1 || d === 6) return -(P('dissonance') ?? 1);  // 2度・7度: 不協和 -1
            return 0;                          // 3度・6度: 中立
        }
        function toneBonus(p) {
            let bonus = 0;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y * BOARD_SIZE + x] !== p) continue;
                if (x + 1 < BOARD_SIZE && board[y * BOARD_SIZE + x + 1] === p) bonus += toneHarmony(toneOf(x), toneOf(x + 1));
                if (y + 1 < BOARD_SIZE && board[(y + 1) * BOARD_SIZE + x] === p) bonus += toneHarmony(toneOf(x), toneOf(x));
            }
            return bonus;
        }`],
        // 終局得点に和音ボーナスを加算 (双方同じルール)
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            territory.black += toneBonus(1);
            territory.white += toneBonus(2);`],
        // 石に音名を刻む
        ...K.STONE_MARKS_SPEC(`            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const v = board[y * BOARD_SIZE + x];
                if (v !== 1 && v !== 2) continue;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.fillStyle = v === 1 ? 'rgba(255,255,255,0.85)' : 'rgba(30,30,30,0.85)';
                ctx.font = Math.max(8, cellSize * 0.34) + 'px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(TONE_NAMES[toneOf(x)], cx, cy + cellSize * 0.05);
                ctx.restore();
            }`),
        // 盤端に音に音階の帯
        K.CUE_GRID(`            // 盤下にドレミの音階帯
            {
                ctx.save();
                const hues = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e91e63'];
                for (let x = 0; x < BOARD_SIZE; x++) {
                    ctx.fillStyle = hues[toneOf(x)] + '33';
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding - cellSize / 2, cellSize, cellSize * BOARD_SIZE);
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            音石碁: 列ごとにドレミ。和音の同色隣接は+1目、不協和は-1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '列ごとにドレミファソラシの音が割り当てられる (石に音名が刻まれる)。',
            '隣接する同色石が完全4・5度の和音なら終局+1目、2度・7度の不協和なら-1目。',
            '横に並べるなら音程を読んで — 縦は同音なので安全。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('音が7階ある', toneOf(0) === 0 && toneOf(6) === 6 && toneOf(7) === 0);
        assert('完全5度は和音', toneHarmony(0, 4) === 1);
        assert('短2度は不協和', toneHarmony(0, 1) === -1);
        board[I(0, 0)] = 1; board[I(1, 0)] = 1; // ド+レ = 不協和
        board[I(7, 0)] = 1; board[I(11, 0)] = 1;
        const b = toneBonus(1);
        assert('不協和ペアは-1目', b === -1);
        board.fill(0); board[I(0, 0)] = 1; board[I(4, 0)] = 1;
        assert('離れた石は響かない', toneBonus(1) === 0);
    `,
};
