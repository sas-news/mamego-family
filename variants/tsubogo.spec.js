// TSUBOGO — 経穴碁: 星の点は経穴(ツボ)。経穴を含む連は経脈が通り+2呼吸
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tsubogo.html',
    en: 'TSUBOGO',
    jp: '経穴碁',
    prefix: 'tsubogo',
    desc: '星の点は経穴。経穴を含む連は経脈が通り+2呼吸。',
    kind: 'stone',
    icon: 'tsubogo',
    spec: [
        ...K.rb('TSUBOGO', '経穴碁', 'tsubogo'),
        K.params([
            { key: 'tsubo_bonus', label: '経穴の追加呼吸', min: 1, max: 6, def: 2 },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 経穴 = 星の点
        function isTsubo(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            return getStarPoints(BOARD_SIZE).some(p => p.x === x && p.y === y);
        }`],
        // 捕獲判定: 経穴を含む連は+2呼吸
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                    }

                    if (!hasLiberty) {`,
`                    }
                    if (group.some(gi => isTsubo(gi))) liberties += P('tsubo_bonus') || 2; // 経穴を押さえた連は経脈が通る

                    if (liberties <= 0) {`],
        // 経穴の描画: 星の点に小さな円+中心点
        K.CUE_GRID(`            // 経穴: 星の点に銀の環と赤い中心
            {
                ctx.save();
                getStarPoints(BOARD_SIZE).forEach(p => {
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    ctx.strokeStyle = 'rgba(148,163,184,0.9)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.24, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(220,60,60,0.9)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.07, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            経穴碁: 星の点は経穴(ツボ)。経穴を含む連は経脈が通り+2呼吸<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '星の点 (銀環+赤点) は経穴。経穴の上に石がある連は経脈が通り呼吸点+2。',
            '経穴の連は多少乱暴に攻めても息が続く。ただし完全に囲まれると取られる。',
            '経穴の奪い合いが勝負の要 — 押さえて通すか、敵の経脈を断つか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const c = (BOARD_SIZE - 1) / 2;
        assert('天元は経穴', isTsubo(c * BOARD_SIZE + c) === true);
        assert('隅は経穴でない', isTsubo(0) === false);
        // 経穴の連は+2: (4,4)を4方向で囲む (呼吸0だが経穴+2で生きる)
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[c * BOARD_SIZE + c] = 1;
        board[c * BOARD_SIZE + c - 1] = 2; board[c * BOARD_SIZE + c + 1] = 2;
        board[(c - 1) * BOARD_SIZE + c] = 2; board[(c + 1) * BOARD_SIZE + c] = 2;
        assert('経穴を押さえた連は取られない', !getCapturedStones(board, 1).includes(c * BOARD_SIZE + c));
        board.fill(0);
        board[c * BOARD_SIZE + c - 1] = 1; // 経穴でない点
        board[c * BOARD_SIZE + c - 2] = 2; board[c * BOARD_SIZE + c] = 2;
        board[(c - 1) * BOARD_SIZE + c - 1] = 2; board[(c + 1) * BOARD_SIZE + c - 1] = 2;
        assert('経穴なしの連は取られる', getCapturedStones(board, 1).includes(c * BOARD_SIZE + c - 1));
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
