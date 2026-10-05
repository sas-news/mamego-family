// HANDRANKGO — 手役碁: 石の配置が役になる。3連以上の並びと2×2ブロックが終局ボーナス
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const YAKU_FN = `        // 手役: 3連以上の並び +(長さ-2)、2×2ブロック +3
        function yakuBonus(pl) {
            let bonus = 0;
            // 横の連
            for (let y = 0; y < BOARD_SIZE; y++) {
                let run = 0;
                for (let x = 0; x <= BOARD_SIZE; x++) {
                    if (x < BOARD_SIZE && board[y * BOARD_SIZE + x] === pl) { run++; continue; }
                    if (run >= (P('run_min') || 3)) bonus += run - ((P('run_min') || 3) - 1);
                    run = 0;
                }
            }
            // 縦の連
            for (let x = 0; x < BOARD_SIZE; x++) {
                let run = 0;
                for (let y = 0; y <= BOARD_SIZE; y++) {
                    if (y < BOARD_SIZE && board[y * BOARD_SIZE + x] === pl) { run++; continue; }
                    if (run >= (P('run_min') || 3)) bonus += run - ((P('run_min') || 3) - 1);
                    run = 0;
                }
            }
            // 2×2ブロック (四宝)
            for (let y = 0; y + 1 < BOARD_SIZE; y++) {
                for (let x = 0; x + 1 < BOARD_SIZE; x++) {
                    if (board[y * BOARD_SIZE + x] === pl && board[y * BOARD_SIZE + x + 1] === pl &&
                        board[(y + 1) * BOARD_SIZE + x] === pl && board[(y + 1) * BOARD_SIZE + x + 1] === pl) {
                        bonus += (P('block_bonus') || 3);
                    }
                }
            }
            return bonus;
        }
`;
module.exports = {
    file: 'handrankgo.html',
    en: 'HANDRANKGO',
    jp: '手役碁',
    prefix: 'handrankgo',
    desc: '石の配置が役になる: 3連以上の並びと2×2ブロックで終局ボーナス。',
    kind: 'stone',
    icon: 'handrankgo',
    spec: [
        ...K.rb('HANDRANKGO', '手役碁', 'handrankgo'),
        K.params([
            { key: 'run_min', label: '役になる連の長さ', min: 2, max: 6, def: 3, unit: '連' },
            { key: 'block_bonus', label: '2×2ブロックの得点', min: 0, max: 10, def: 3, unit: '点' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.3, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        [K.ONE, '        function updateUI() {', YAKU_FN + `
        function updateUI() {`],
        // 終局時: 役ボーナスを合計に加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const yakuB = yakuBonus(1);
            const yakuW = yakuBonus(2);
            const blackTotal = territory.black + captures[1] + yakuB;
            const whiteTotal = territory.white + captures[2] + komi + yakuW;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>
                    <div class="mt-1 text-xs">手役ボーナス: 黒+\${yakuB} / 白+\${yakuW}</div>`],
        ...K.EVENT_CHIP_SPEC(`'役 ' + yakuBonus(turn) + '点'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            手役碁: 3連以上の並びと2×2ブロックが役になり終局ボーナスになる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石の配置が麻雀のような「役」になる: 3連以上の並びは +(長さ-2)点、2×2ブロックは +3点。',
            '終局時に役ボーナスが合計点に加算される。形を整えながら地を取る二児追いの碁。',
            '両者同じ役表。着手・取り・コウ・パス終局は通常通り。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 黒に横3連 + 白に2×2ブロック
        [[2,2],[3,2],[4,2]].forEach(([x,y]) => { board[y * BOARD_SIZE + x] = 1; });
        [[8,8],[9,8],[8,9],[9,9]].forEach(([x,y]) => { board[y * BOARD_SIZE + x] = 2; });
        assert('3連は+1', yakuBonus(1) === 1);
        assert('2×2ブロックは+3', yakuBonus(2) === 3);
        endGameByScore();
        assert('終局できる', gameOver === true);
        assert('役ボーナスが明記', gameResultData.details.includes('手役ボーナス'));
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
