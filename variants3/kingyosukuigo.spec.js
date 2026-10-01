// KINGYOSUKUIGO — 金魚すくい碁: ポイで掬い上げた金魚 (アゲハマ) は1匹2目分の得点
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kingyosukuigo.html',
    en: 'KINGYOSUKUIGO',
    jp: '金魚すくい碁',
    prefix: 'kingyosukuigo',
    desc: 'ポイで掬い上げた金魚は高く売れる。アゲハマ1個につき2目の得点。',
    kind: 'stone',
    icon: 'kingyosukuigo',
    spec: [
        ...K.rb('KINGYOSUKUIGO', '金魚すくい碁', 'kingyosukuigo'),
        K.params([
            { key: 'scoop_pts', label: '金魚1匹の得点', min: 1, max: 5, def: 2, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 掬った金魚は水しぶきを上げる
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    board[idx] = 0;
                    fxSplash(idx, '#7dd3fc', 10);
                    fxSplash(idx, '#fbbf24', 4);
                });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 掬った金魚は1匹2目分の得点
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] * (P('scoop_pts') || 2);
            const whiteTotal = territory.white + captures[2] * (P('scoop_pts') || 2) + komi;`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>金魚ボーナス:</span> <strong>黒 +\${captures[1] * (Math.max(1, P('scoop_pts') || 2) - 1)} / 白 +\${captures[2] * (Math.max(1, P('scoop_pts') || 2) - 1)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            金魚すくい碁: 取った敵石はポイで掬った金魚 — アゲハマ1個につき2目の得点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵の連を取ると、ポイ (すくい枠) で金魚を掬い上げる。掬った金魚は高く売れる。',
            '終局時、アゲハマ1個につき通常の1目+金魚ボーナス1目の計2目になる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[2 * BOARD_SIZE + 2] = 2;
        board[2 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 3] = 1;
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1); // 最後の一点を塞いで掬う
        assert('金魚を掬い上げた', board[2 * BOARD_SIZE + 2] === 0 && captures[1] === 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('通常着手も動く', board[9 * BOARD_SIZE + 9] === 2);
    `,
};
