// DASHIGO — 出汁碁: 出汁区域 (琥珀色の池) の中で終局時に生きている石は旨み+1目ずつ
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
    file: 'dashigo.html',
    en: 'DASHIGO',
    jp: '出汁碁',
    prefix: 'dashigo',
    desc: '出汁区域 (琥珀の池) で終局を迎えた石は旨みが滲みて1石+1目。',
    kind: 'stone',
    icon: 'dashigo',
    spec: [
        ...K.rb('DASHIGO', '出汁碁', 'dashigo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 出汁区域: 対角の2つの琥珀色の池 (菱型5点ずつ)
        const DASHI_SET = new Set();
        {
            const dc = Math.floor(BOARD_SIZE * 0.28);
            [[dc, dc], [BOARD_SIZE - 1 - dc, BOARD_SIZE - 1 - dc]].forEach(([cx, cy]) => {
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= 1) DASHI_SET.add((cy + dy) * BOARD_SIZE + (cx + dx));
                }
            });
        }`],
        // 旨み集計: 区域の生きた石は1石+1目
        [K.ONE, `        function endGameByScore() {`, `        // 出汁: 区域内の石を数える
        function dashiBonus() {
            const b = { 1: 0, 2: 0 };
            DASHI_SET.forEach(i => { if (board[i] === 1 || board[i] === 2) b[board[i]]++; });
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 出汁ルール: 区域内の生きた石は旨み+1目ずつ
            {
                const db = dashiBonus();
                territory.black += db[1];
                territory.white += db[2];
            }`],
        // 池の描画: 琥珀色の揺らぐ水面
        K.CUE_GRID(`            // 出汁区域: 琥珀色の池
            {
                const now = fxNow();
                ctx.save();
                DASHI_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const ph = Math.sin(now / 700 + x * 1.3 + y * 0.9);
                    ctx.fillStyle = 'rgba(217, 119, 6,' + (0.16 + ph * 0.05) + ')';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'出汁区域 ' + [...DASHI_SET].filter(i => board[i] === 1 || board[i] === 2).length + '石'`),
        [K.ONE, K.INFO_ALGO, `            出汁碁: 琥珀色の出汁区域で終局を迎えた石は旨み+1目ずつ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上の2つの「出汁区域」(琥珀色の池)。終局時に区域の中で生きている石は1石につき+1目の旨みがつく。',
            '区域は両者共通の条件。取られないよう守り抜くか、相手の旨み石を刈り取るか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('出汁区域は10点', DASHI_SET.size === 10);
        board.fill(0);
        const zi = [...DASHI_SET][0];
        board[zi] = 1;
        assert('区域内の黒石は旨み1', dashiBonus()[1] === 1);
        board[zi] = 2;
        assert('区域内の白石は旨み1', dashiBonus()[2] === 1);
        board.fill(0); pieces = []; history.length = 0;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
