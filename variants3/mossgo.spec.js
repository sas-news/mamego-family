// MOSSGO — 苔庭碁: 苔(石)が庭を覆う。乾燥した最外周では8手ごとに苔が枯れる
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
    file: 'mossgo.html',
    en: 'MOSSGO',
    jp: '苔庭碁',
    prefix: 'mossgo',
    desc: '苔=石で庭を覆う碁。乾燥した最外周では8手ごとに苔が枯れて相手のアゲハマになる。',
    kind: 'stone',
    icon: 'mossgo',
    spec: [
        ...K.rb('MOSSGO', '苔庭碁', 'mossgo'),
        // 乾燥区域 (最外周) を砂色で塗る — 格子の下、石の下
        K.CUE_GRID(`            // 乾燥区域: 最外周を乾いた砂の色で示す
            {
                ctx.save();
                ctx.fillStyle = 'rgba(190,160,110,0.20)';
                const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                const t = cellSize * 0.55;
                ctx.fillRect(0, 0, w, t);
                ctx.fillRect(0, w - t, w, t);
                ctx.fillRect(0, 0, t, w);
                ctx.fillRect(w - t, 0, t, w);
                ctx.restore();
            }`),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 苔庭ルール: 8手ごとに乾燥区域 (最外周) の石が枯れて相手のアゲハマになる
            if (history.length % 8 === 0) {
                let n = 0;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!(x === 0 || y === 0 || x === BOARD_SIZE - 1 || y === BOARD_SIZE - 1)) continue;
                    const i = y * BOARD_SIZE + x;
                    if (board[i] === 1 || board[i] === 2) {
                        captures[board[i] === 1 ? 2 : 1]++;
                        board[i] = 0;
                        fxBurst(i, '#a3a380', 6, 1.1);
                        n++;
                    }
                }
                if (n > 0) {
                    const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxText(ci, '苔が枯れる', '#84cc16', 1200);
                    fxShake(4, 280);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'枯れるまで ' + (8 - (history.length % 8)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            苔庭碁: 石=苔が庭を覆う。最外周の乾燥区域では8手ごとに苔が枯れて相手のアゲハマになる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の最外周は「乾燥区域」。8手を数えるごとに、そこに置かれた石 (苔) は枯れて相手のアゲハマになる。',
            '苔を生やすなら内側の湿った庭へ。外周は短期決戦か捨て石で。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 外周に黒石
        assert('外周に置ける', board[0] === 1);
        for (let i = 0; i < 7; i++) executeMove({ cells: [{ x: 4 + (i % 2), y: 4 + Math.floor(i / 2) }] }, i % 2 === 0 ? 2 : 1);
        assert('8手目で外周の石が枯れる', board[0] === 0);
        assert('枯れた石は白のアゲハマ', captures[2] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
