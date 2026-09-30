// KOHAIGO — 光背碁: 3x3全面を自石で固めると「光背」が完成し仏が荘厳されて即勝ち
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
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kohaigo.html',
    en: 'KOHAIGO',
    jp: '光背碁',
    prefix: 'kohaigo',
    desc: '3x3全面を自石で固めると「光背」完成 — 仏が荘厳されて即勝ち。',
    kind: 'stone',
    icon: 'kohaigo',
    spec: [
        ...K.rb('KOHAIGO', '光背碁', 'kohaigo'),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 光背: 盤上に player 色だけの3x3があればその中心idx、なければ-1
        function kohaIdx(player) {
            for (let y = 0; y + 2 < BOARD_SIZE; y++) for (let x = 0; x + 2 < BOARD_SIZE; x++) {
                let ok = true;
                for (let dy = 0; dy < 3 && ok; dy++) for (let dx = 0; dx < 3 && ok; dx++)
                    if (board[(y + dy) * BOARD_SIZE + x + dx] !== player) ok = false;
                if (ok) return (y + 1) * BOARD_SIZE + x + 1;
            }
            return -1;
        }

        function endGameByScore() {`],
        // 光背完成判定: 着手側が3x3を固めたら即勝ち
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 光背ルール: 3x3全面を自石で固める → 荘厳完成で即勝ち
            {
                const ki = kohaIdx(player);
                if (ki >= 0) {
                    fxGlow(ki, '#fde047', 1200);
                    fxText(ki, '光背荘厳!', '#facc15', 1500);
                    fxShake(6, 400);
                    winByRule(player, '光背荘厳', '3x3の光背を完成させて仏を荘厳しました'); return;
                }
            }

            turn = opponent;`],
        // 光背進行: 2x2以上の同色ブロックの上に薄い光輪
        ...K.STONE_MARKS_SPEC(`            {
                for (let y = 0; y + 1 < BOARD_SIZE; y++) for (let x = 0; x + 1 < BOARD_SIZE; x++) {
                    const i0 = y * BOARD_SIZE + x;
                    const v = board[i0];
                    if ((v === 1 || v === 2) && board[i0 + 1] === v &&
                        board[i0 + BOARD_SIZE] === v && board[i0 + BOARD_SIZE + 1] === v) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(250,204,21,0.5)';
                        ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(padding + (x + 0.5) * cellSize, padding + (y + 0.5) * cellSize,
                            cellSize * 0.85, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            光背碁: 3x3全面を自石で固めると「光背」完成 — 仏が荘厳されて即勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手終了時に盤上のどこかが自分の石だけの3x3になっていれば「光背」完成で即勝ち。',
            '2x2から金の光輪が見え始める — 相手は割り込みを急ぐ。固めきるか、崩すか。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const cells = [];
        for (let y = 2; y <= 4; y++) for (let x = 2; x <= 4; x++) cells.push({ x, y });
        cells.slice(0, 8).forEach(c => executeMove({ cells: [c] }, 1));
        assert('8つでは未完成', gameOver === false);
        executeMove({ cells: [cells[8]] }, 1);
        assert('3x3完成で即勝ち', gameOver === true);
        assert('結果に光背', !!gameResultData && gameResultData.title.indexOf('光背') >= 0);
    `,
};
