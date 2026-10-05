// KADOMATSUGO — 門松碁: 石を縦横に3連以上並べると門松が完成し、採点で+3ずつ
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kadomatsugo.html',
    en: 'KADOMATSUGO',
    jp: '門松碁',
    prefix: 'kadomatsugo',
    desc: '自石の縦横3連以上は門松になり、1本+3点。竹の形を意識して打て。',
    kind: 'stone',
    icon: 'kadomatsugo',
    spec: [
        ...K.rb('KADOMATSUGO', '門松碁', 'kadomatsugo'),
        K.params([
            { key: 'matsu_len', label: '門松に必要な連数', min: 3, max: 5, def: 3, unit: '連' },
            { key: 'matsu_pts', label: '門松1本の得点', min: 0, max: 9, def: 3, unit: '目' },
        ]),
        // 門松判定ヘルパー (採点・描画・テスト共通)
        [K.ONE, `        function endGameByScore() {`, `        // 門松判定: 盤上の直線ラン (縦または横の3連以上) を数える
        function kadomatsuRuns(pl) {
            const runs = [];
            for (let y = 0; y < BOARD_SIZE; y++) {
                let run = [];
                for (let x = 0; x <= BOARD_SIZE; x++) {
                    const v = x < BOARD_SIZE ? board[y * BOARD_SIZE + x] : -1;
                    if (v === pl) run.push(y * BOARD_SIZE + x);
                    else { if (run.length >= (P('matsu_len') || 3)) runs.push(run); run = []; }
                }
            }
            for (let x = 0; x < BOARD_SIZE; x++) {
                let run = [];
                for (let y = 0; y <= BOARD_SIZE; y++) {
                    const v = y < BOARD_SIZE ? board[y * BOARD_SIZE + x] : -1;
                    if (v === pl) run.push(y * BOARD_SIZE + x);
                    else { if (run.length >= (P('matsu_len') || 3)) runs.push(run); run = []; }
                }
            }
            return runs;
        }
        function kadomatsuBonus(pl) { return kadomatsuRuns(pl).length * (P('matsu_pts') ?? 3); }

        function endGameByScore() {`],
        // 採点に門松点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + kadomatsuBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + kadomatsuBonus(2);`],
        // 門松の中央に竹マークを描く
        ...K.STONE_MARKS_SPEC(`            // 門松: 3連以上の中央の石に竹の印
            [1, 2].forEach(pl => {
                kadomatsuRuns(pl).forEach(run => {
                    const mid = run[Math.floor(run.length / 2)];
                    const x = mid % BOARD_SIZE, y = Math.floor(mid / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.save();
                    ctx.strokeStyle = pl === 1 ? 'rgba(134,239,172,0.95)' : 'rgba(22,163,74,0.95)';
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.26); ctx.lineTo(cx, cy + cellSize * 0.26);
                    ctx.moveTo(cx, cy - cellSize * 0.18); ctx.lineTo(cx + cellSize * 0.16, cy - cellSize * 0.30);
                    ctx.stroke();
                    ctx.restore();
                });
            });`),
        [K.ONE, K.INFO_BASE, `            門松碁: 自石を縦か横に3連以上並べると門松完成。終局時に門松1本につき+3点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の石が縦か横に3個以上まっすぐ並ぶと、その1列は「門松」になる (長さは3以上なら何個でも1本)。',
            '終局時、門松1本につき+3点が地とアゲハマに加算される。十字の交差は縦横2本分。',
            '門松の中央には竹の印が出る。取られれば門松も消える。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('初期は門松なし', kadomatsuBonus(1) === 0);
        board[2 * B + 2] = 1; board[2 * B + 3] = 1; board[2 * B + 4] = 1; // 横3連
        assert('横3連で門松+3', kadomatsuBonus(1) === 3);
        board[3 * B + 2] = 1; board[4 * B + 2] = 1; // (2,2)起点の縦3連: (2,2)+(2,3)+(2,4)
        board[5 * B + 2] = 1;
        assert('縦3連も門松', kadomatsuBonus(1) === 6);
        board[8 * B + 8] = 2; board[8 * B + 9] = 2; // 白は2連のみ
        assert('2連は門松にならない', kadomatsuBonus(2) === 0);
    `,
};
