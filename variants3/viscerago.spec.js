// VISCERAGO — 五臓碁: 盤は五臓 (4 quadrant + 中臓) の体。五臓全てに石を置くと気血が巡り全連+1呼吸
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
    file: 'viscerago.html',
    en: 'VISCERAGO',
    jp: '五臓碁',
    prefix: 'viscerago',
    desc: '盤は五臓の体。五臓全てに石を置くと気血が巡り全連+1呼吸。',
    kind: 'stone',
    icon: 'viscerago',
    spec: [
        ...K.rb('VISCERAGO', '五臓碁', 'viscerago'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 五臓: 0=肝(左上) 1=心(右上) 2=脾(左下) 3=肺(右下) 4=腎(中臓の菱形)
        const ORGAN_NAMES = ['肝', '心', '脾', '肺', '腎'];
        function organOf(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            const c = (BOARD_SIZE - 1) / 2;
            if (Math.abs(x - c) + Math.abs(y - c) <= Math.max(1, c * 0.6)) return 4;
            return (y >= c ? 2 : 0) + (x >= c ? 1 : 0);
        }
        // 五臓全てに石があるか (気血が巡る体)
        function allOrgansAlive(b, pl) {
            const seen = new Set();
            for (let i = 0; i < b.length; i++) if (b[i] === pl) seen.add(organOf(i));
            return seen.size === 5;
        }`],
        // 捕獲判定: 五五臓が揃った側の連は+1呼吸
        [K.ONE, `            const deadMask = computeDeadMask(boardState);`,
`            const deadMask = computeDeadMask(boardState);
            const bodyAlive = allOrgansAlive(boardState, player);`],
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                    }

                    if (!hasLiberty) {`,
`                    }
                    if (bodyAlive) liberties += 1; // 五臓が揃うと気血が巡り+1呼吸

                    if (liberties <= 0) {`],
        // 五五臓の領域描画 (4象限+中臓)
        K.CUE_GRID(`            // 五臓の体: 象限ごとの臓器色 + 中臓の菱形
            {
                ctx.save();
                const oc = ['rgba(120,80,60,0.10)', 'rgba(190,80,70,0.10)', 'rgba(200,160,60,0.10)', 'rgba(90,140,160,0.10)', 'rgba(90,80,160,0.16)'];
                for (let i = 0; i < board.length; i++) {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillStyle = oc[organOf(i)];
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                }
                ctx.strokeStyle = 'rgba(120,60,60,0.45)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                const cc = padding + (BOARD_SIZE - 1) / 2 * cellSize;
                const rr = Math.max(1, (BOARD_SIZE - 1) / 2 * 0.6) * cellSize;
                ctx.beginPath();
                ctx.moveTo(cc, cc - rr); ctx.lineTo(cc + rr, cc); ctx.lineTo(cc, cc + rr); ctx.lineTo(cc - rr, cc);
                ctx.closePath(); ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`(() => { const b = allOrgansAlive(board, turn); return b ? '気血巡る (+1呼吸)' : '五臓 ' + new Set(board.map((v,i)=>v===turn?organOf(i):-1).filter(v=>v>=0)).size + '/5'; })()`),
        [K.ONE, K.INFO_ALGO, `            五臓碁: 盤は五臓の体。五臓 (4象限+中臓) 全てに石を置くと気血が巡り全連+1呼吸<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は五臓の体: 肝・心・脾・肺の4象限と中央の菱形「腎」の5区域。',
            '五臓全てに自分の石があると気血が巡り、自分の全ての連が呼吸点+1。',
            '片方の臓を欠くと体は普通の碁に戻る — 五臓のバランスを保って打て。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const c = (BOARD_SIZE - 1) / 2;
        assert('角は肝(0)', organOf(0) === 0);
        assert('天元は腎(4)', organOf(c * BOARD_SIZE + c) === 4);
        assert('右下は肺(3)', organOf(BOARD_SIZE * BOARD_SIZE - 1) === 3);
        // 五臓揃いで呼吸+1: (4,4)を四方囲まれるが五臓に石を配置
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[c * BOARD_SIZE + c] = 1;
        board[c * BOARD_SIZE + c - 1] = 2; board[c * BOARD_SIZE + c + 1] = 2;
        board[(c - 1) * BOARD_SIZE + c] = 2; board[(c + 1) * BOARD_SIZE + c] = 2;
        assert('中身なしでは取られる', getCapturedStones(board, 1).includes(c * BOARD_SIZE + c));
        board[0] = 1; board[BOARD_SIZE - 1] = 1; board[(BOARD_SIZE - 1) * BOARD_SIZE] = 1; board[BOARD_SIZE * BOARD_SIZE - 1] = 1;
        assert('五臓揃いで気血+1 (取られない)', !getCapturedStones(board, 1).includes(c * BOARD_SIZE + c));
        assert('占有点は打てない', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('空点は打てる', isValidPlacement([{ x: 1, y: 0 }], 2) === true);
    `,
};
