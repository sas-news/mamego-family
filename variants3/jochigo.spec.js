// JOCHIGO — 定置碁: 定置網区域に入った石は10手ごとの網上げで一網打尽にされる
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'jochigo.html',
    en: 'JOCHIGO',
    jp: '定置碁',
    prefix: 'jochigo',
    desc: '定置網の区域。10手ごとの網上げで区域の石は全て獲られてしまう。',
    kind: 'stone',
    icon: 'jochigo',
    spec: [
        ...K.rb('JOCHIGO', '定置碁', 'jochigo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 定置網: 対角の2つの3x2区域 (沖の網)
        const AMI_SET = new Set();
        {
            const ax = Math.floor(BOARD_SIZE / 4);
            [[ax, BOARD_SIZE - 3], [BOARD_SIZE - 3 - ax, 1]].forEach(([bx, by]) => {
                for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 2; dx++) {
                    AMI_SET.add((by + dy) * BOARD_SIZE + (bx + dx));
                }
            });
        }`],
        // 網上げ: 10手ごとに網の中の石を全て獲る (相手のアゲハマに)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 定置網: 10手ごとの網上げ — 区域の石は全て獲られ相手のアゲハマに
            if (history.length > 0 && history.length % 10 === 0) {
                let caught = 0;
                AMI_SET.forEach(i => {
                    const v = board[i];
                    if (v === 1 || v === 2) {
                        captures[v === 1 ? 2 : 1]++;
                        board[i] = 0;
                        fxBurst(i, '#38bdf8', 8, 1.4);
                        caught++;
                    }
                });
                if (caught) {
                    cleanUpPieces();
                    fxShake(4, 300);
                    fxText([...AMI_SET][0], '網上げ!', '#0ea5e9', 1100);
                }
            }

            turn = opponent;`],
        // 網の描画: 青い網目
        K.CUE_GRID(`            // 定置網: 青い網目区域
            {
                ctx.save();
                ctx.fillStyle = 'rgba(14, 165, 233, 0.14)';
                AMI_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                ctx.strokeStyle = 'rgba(2, 132, 199, 0.55)';
                ctx.lineWidth = Math.max(1, cellSize * 0.035);
                AMI_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.4, cy - cellSize * 0.4); ctx.lineTo(cx + cellSize * 0.4, cy + cellSize * 0.4);
                    ctx.moveTo(cx + cellSize * 0.4, cy - cellSize * 0.4); ctx.lineTo(cx - cellSize * 0.4, cy + cellSize * 0.4);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'網上げまで ' + (10 - (history.length % 10)) + ' 手'`),
        [K.ONE, K.INFO_ALGO, `            定置碁: 網区域の石は10手ごとの網上げで全て獲られる (相手のアゲハマに)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '対角の2つの「定置網」区域。10手ごとの網上げで区域の石は色に関係なく全て獲られ、持ち主の敵のアゲハマになる。',
            '網に入るな — でも相手を追い込むには絶好の罠。網上げのタイミングを読め。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('定置網は12点', AMI_SET.size === 12);
        board.fill(0); pieces = []; history.length = 0; captures = { 1: 0, 2: 0 };
        const zi = [...AMI_SET][0];
        board[zi] = 2; // 網の中の白石
        board[[...AMI_SET][1]] = 1; // 網の中の黒石
        history.push({}, {}, {}, {}, {}, {}, {}, {}, {});
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // history=10 → 網上げ
        assert('網の白石は獲られた', board[zi] === 0);
        assert('獲られた石は相手のアゲハマ', captures[1] === 1 && captures[2] === 1);
        assert('網の外は無事', board[I(0, 0)] === 1);
        board.fill(0); pieces = []; history.length = 0;
        assert('通常着手は合法', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
