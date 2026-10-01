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
        K.params([
            { key: 'pool_pt', label: '旨みボーナス', min: 0, max: 5, def: 1, step: 0.5, unit: '目' },
            { key: 'pool_radius', label: '池の半径', min: 1, max: 3, def: 1 },
            { key: 'pool_offset', label: '池の位置', min: 1, max: 6, def: 2, hint: '隅からの距離' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 出汁区域: 対角の2つの琥珀色の池 (半径・位置は設定で調整可能)
        let DASHI_SET = new Set();
        function rebuildDashi() {
            DASHI_SET = new Set();
            const dc = Math.min(BOARD_SIZE - 2, Math.max(1, P('pool_offset') || 2));
            const rr = Math.max(1, P('pool_radius') || 1);
            [[dc, dc], [BOARD_SIZE - 1 - dc, BOARD_SIZE - 1 - dc]].forEach(([cx, cy]) => {
                for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) > rr) continue;
                    const x = cx + dx, y = cy + dy;
                    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) DASHI_SET.add(y * BOARD_SIZE + x);
                }
            });
        }
        rebuildDashi();
        // 設定変更で区域を即時再構成
        function onVariantParam(p) {
            if (p.key === 'pool_radius' || p.key === 'pool_offset') rebuildDashi();
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
            // 出汁ルール: 区域内の生きた石は旨みボーナス (設定で調整)
            {
                const db = dashiBonus();
                const pt = P('pool_pt') ?? 1;
                territory.black += db[1] * pt;
                territory.white += db[2] * pt;
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
