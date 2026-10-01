// HINADANGO — 雛壇碁: 雛壇の段(行)ごとに石を多く並べた側が得点を得る
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
module.exports = {
    file: 'hinadango.html',
    en: 'HINADANGO',
    jp: '雛壇碁',
    prefix: 'hinadango',
    desc: '各行が雛壇の段。1行に4石以上かつ相手より多く並べた側が段ごとに+4点。',
    kind: 'stone',
    icon: 'hinadango',
    spec: [
        ...K.rb('HINADANGO', '雛壇碁', 'hinadango'),
        K.params([
            { key: 'hina_min', label: '段を制するのに必要な石数', min: 2, max: 9, def: 4, unit: '個' },
            { key: 'hina_bonus', label: '1段あたりの得点', min: 0, max: 12, def: 4, unit: '点' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.3, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        // 雛壇判定ヘルパー: 行ごとに4石以上かつ相手より多い側に+4
        [K.ONE, `        function endGameByScore() {`, `        // 雛壇判定: 1行に自石4個以上かつ相手より多い段を数える
        function hinaRows(pl) {
            const opp = pl === 1 ? 2 : 1;
            const rows = [];
            for (let y = 0; y < BOARD_SIZE; y++) {
                let a = 0, b = 0;
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const v = board[y * BOARD_SIZE + x];
                    if (v === pl) a++; else if (v === opp) b++;
                }
                if (a >= (P('hina_min') || 4) && a > b) rows.push(y);
            }
            return rows;
        }
        function hinaBonus(pl) { return hinaRows(pl).length * (P('hina_bonus') || 4); }

        function endGameByScore() {`],
        // 採点に雛壇点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + hinaBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + hinaBonus(2);`],
        // 雛壇が成立している行の両端に雛マークを出す
        K.CUE_GRID(`            // 雛壇: ボーナス成立の行の両端に小さな雛印
            {
                const marks = { 1: hinaRows(1), 2: hinaRows(2) };
                ctx.save();
                [1, 2].forEach(pl => {
                    ctx.fillStyle = pl === 1 ? 'rgba(30,30,30,0.55)' : 'rgba(255,255,255,0.75)';
                    ctx.strokeStyle = 'rgba(219,39,119,0.8)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    marks[pl].forEach(y => {
                        [0, BOARD_SIZE - 1].forEach(x => {
                            const cx = padding + x * cellSize, cy = padding + y * cellSize;
                            ctx.beginPath();
                            ctx.moveTo(cx, cy - cellSize * 0.30);
                            ctx.lineTo(cx + cellSize * 0.24, cy + cellSize * 0.18);
                            ctx.lineTo(cx - cellSize * 0.24, cy + cellSize * 0.18);
                            ctx.closePath();
                            ctx.fill(); ctx.stroke();
                        });
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            雛壇碁: 盤の各行が雛壇の段。1行に自石4個以上かつ相手より多く並べると段ごとに+4点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の1行ごとが雛壇の「段」。終局時に見る。',
            'ある段に自分の石が4個以上あり、かつ相手の石より多ければ、その段を制したとして+4点。',
            '段の両端に飾り印が出る。取られれば段は崩れる。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('初期は雛壇なし', hinaBonus(1) === 0 && hinaBonus(2) === 0);
        for (let x = 2; x <= 5; x++) board[3 * B + x] = 1; // 3行目に黒4個
        assert('4個並んだ段で+4', hinaBonus(1) === 4);
        board[3 * B + 7] = 2; board[3 * B + 8] = 2; // 白2個は黒未満
        assert('相手のほうが少なければ有効', hinaBonus(1) === 4);
        board[3 * B + 9] = 2; board[3 * B + 10] = 2; // 白4個 = 同数
        assert('同数ならどちらも無効', hinaBonus(1) === 0 && hinaBonus(2) === 0);
        for (let x = 0; x <= 4; x++) board[6 * B + x] = 2; // 白が別段で優位
        assert('白も同条件で+4', hinaBonus(2) === 4);
    `,
};
