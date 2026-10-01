// INDIGOGO — 藍染碁: 同色に2方以上囲まれた石は「濃染」。終局時に濃染1個につき+1目
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
    file: 'indigogo.html',
    en: 'INDIGOGO',
    jp: '藍染碁',
    prefix: 'indigogo',
    desc: '同色2方以上に囲まれた石は濃染。終局時に濃染1個+1目。',
    kind: 'stone',
    icon: 'indigogo',
    spec: [
        ...K.rb('INDIGOGO', '藍染碁', 'indigogo'),
        K.params([
            { key: 'dye_min', label: '濃染に必要な同色隣接', min: 2, max: 4, def: 2, unit: '個' },
            { key: 'dye_pts', label: '濃染の得点', min: 0, max: 3, def: 1, unit: '目' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let indigoDone = false;
        // 濃染: 同色の石に2方以上隣接した石は藍が深く染まる
        function isDeepDyed(b, i) {
            const pl = b[i];
            if (pl !== 1 && pl !== 2) return false;
            return getNeighbors(i).filter(n => b[n] === pl).length >= (P('dye_min') || 2);
        }
        function dyeCount(pl) {
            let n = 0;
            for (let i = 0; i < board.length; i++) if (isDeepDyed(board, i) && board[i] === pl) n++;
            return n;
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            indigoDone = false;`],
        // 終局時に濃染ボーナスをアゲハマ相当で加算 (1回のみ)
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!indigoDone) {
                indigoDone = true;
                captures[1] += dyeCount(1) * (P('dye_pts') ?? 1);
                captures[2] += dyeCount(2) * (P('dye_pts') ?? 1);
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        // 濃染石に藍の染めムラを描く
        ...K.STONE_MARKS_SPEC(`            // 濃染: 石の中心に藍の染め斑
            ctx.save();
            for (let i = 0; i < board.length; i++) {
                if (!isDeepDyed(board, i)) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.fillStyle = 'rgba(49,80,180,0.5)';
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.16, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();`),
        ...K.EVENT_CHIP_SPEC(`'濃染 黒' + dyeCount(1) + ' / 白' + dyeCount(2)`),
        [K.ONE, K.INFO_ALGO, `            藍染碁: 同色の石に2方以上囲まれた石は「濃染」。終局時に濃染1個につき+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '同色の石に2方以上隣接した自分の石は「濃染」(中心に藍斑) になる。',
            '終局時、濃染1個につき+1目のボーナス。塊を育てるほど色が深まり得になる。',
            '濃染は双方に同じ条件 — 密に固めるか薄く広げるかの好みが出る。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 十字配置: 中心は同色4方で濃染、腕の先は濃染でない
        board[I(5, 5)] = 1; board[I(4, 5)] = 1; board[I(6, 5)] = 1; board[I(5, 4)] = 1; board[I(5, 6)] = 1;
        assert('中心は濃染', isDeepDyed(board, I(5, 5)) === true);
        assert('先端は濃染でない', isDeepDyed(board, I(5, 4)) === false);
        assert('濃染数は中心のみ', dyeCount(1) === 1);
        indigoDone = false;
        endGameByScore();
        assert('濃染+1が加算', captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
