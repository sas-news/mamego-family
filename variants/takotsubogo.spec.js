// TAKOTSUBOGO — 蛸壺碁: 蛸壺の点に入った石は9手ごとの壺上げで獲られてしまう
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
    file: 'takotsubogo.html',
    en: 'TAKOTSUBOGO',
    jp: '蛸壺碁',
    prefix: 'takotsubogo',
    desc: '蛸壺に入った石は9手ごとの壺上げで獲られる。壺は4箇所。',
    kind: 'stone',
    icon: 'takotsubogo',
    spec: [
        ...K.rb('TAKOTSUBOGO', '蛸壺碁', 'takotsubogo'),
        K.params([
            { key: 'pot_interval', label: '壺上げの間隔', min: 3, max: 25, def: 9, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 蛸壺: 4つの壺の点
        const TSUBO_PTS = (() => {
            const tc = Math.floor(BOARD_SIZE / 3);
            return [[tc, tc], [tc, BOARD_SIZE - 1 - tc], [BOARD_SIZE - 1 - tc, tc],
                [BOARD_SIZE - 1 - tc, BOARD_SIZE - 1 - tc]]
                .map(([x, y]) => y * BOARD_SIZE + x);
        })();`],
        // 壺上げ: 9手ごとに壺の中の石を獲る (相手のアゲハマに)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 蛸壺: 9手ごとの壺上げ — 壺の中の石は獲られ相手のアゲハマに
            if (history.length > 0 && history.length % (P('pot_interval') || 9) === 0) {
                let caught = 0;
                TSUBO_PTS.forEach(i => {
                    const v = board[i];
                    if (v === 1 || v === 2) {
                        captures[v === 1 ? 2 : 1]++;
                        board[i] = 0;
                        fxBurst(i, '#fb923c', 8, 1.4);
                        fxText(i, '蛸!', '#ea580c', 1000);
                        caught++;
                    }
                });
                if (caught) {
                    cleanUpPieces();
                    fxShake(3, 260);
                }
            }

            turn = opponent;`],
        // 壺の描画: 素焼きの壺マーク
        K.CUE_STARS(`            // 蛸壺: 素焼きの壺マーク
            {
                ctx.save();
                TSUBO_PTS.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(194, 120, 60, 0.55)';
                    ctx.beginPath();
                    ctx.ellipse(cx, cy + cellSize * 0.06, cellSize * 0.34, cellSize * 0.30, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(90, 50, 20, 0.8)';
                    ctx.beginPath();
                    ctx.ellipse(cx, cy - cellSize * 0.16, cellSize * 0.16, cellSize * 0.09, 0, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'壺上げまで ' + ((P('pot_interval') || 9) - (history.length % (P('pot_interval') || 9))) + ' 手'`),
        [K.ONE, K.INFO_BASE, `            蛸壺碁: 壺の点の石は9手ごとの壺上げで獲られる (相手のアゲハマに)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤上に4つの「蛸壺」がある (壺マーク)。9手ごとの壺上げで壺の中の石は色に関係なく獲られ、持ち主の敵のアゲハマになる。',
            '壺に入るな。相手を誘い込むなら絶好の罠。壺上げの番を読め。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('蛸壺は4箇所', TSUBO_PTS.length === 4);
        board.fill(0); pieces = []; history.length = 0; captures = { 1: 0, 2: 0 };
        board[TSUBO_PTS[0]] = 2; // 壺に入った白石
        history.push({}, {}, {}, {}, {}, {}, {}, {});
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // history=9 → 壺上げ
        assert('壺の石は獲られた', board[TSUBO_PTS[0]] === 0);
        assert('獲物は相手のアゲハマ', captures[1] === 1);
        board.fill(0); pieces = []; history.length = 0;
        assert('壺の点にも置ける', isValidPlacement([{ x: TSUBO_PTS[0] % BOARD_SIZE, y: (TSUBO_PTS[0] / BOARD_SIZE) | 0 }], 1) === true);
    `,
};
