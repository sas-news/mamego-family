// KILNGO — 登窯碁: 盤は下から上への5連房の登り窯。全石が最上段の窯室にある連だけが完全に焼き上がり+1呼吸
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kilngo.html',
    en: 'KILNGO',
    jp: '登窯碁',
    prefix: 'kilngo',
    desc: '盤は下から5連房の登り窯。全石が最上段の連だけ焼き上がり+1呼吸。',
    kind: 'stone',
    icon: 'kilngo',
    spec: [
        ...K.rb('KILNGO', '登窯碁', 'kilngo'),
        K.params([
            { key: 'chambers', label: '窯室の数', min: 3, max: 8, def: 5, unit: '房' },
            { key: 'fire_libs', label: '焼き上がりの呼吸ボーナス', min: 0, max: 3, def: 1 },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 窯室: 盤を上からN房に分ける (房0が最上段 = 火が最も強い)
        function chamberOf(i) {
            const y = (i / BOARD_SIZE) | 0;
            const ch = Math.max(2, P('chambers') || 5);
            return Math.min(ch - 1, Math.floor(y * ch / BOARD_SIZE));
        }
        // 完全焼成: 連の全石が最上段の窯室(房0)にある → +1呼吸
        function fullyFired(group) {
            return group.every(i => chamberOf(i) === 0);
        }`],
        // 捕獲判定: 最上段で焼き上がった連は+1呼吸
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                    }

                    if (!hasLiberty) {`,
`                    }
                    if (fullyFired(group)) liberties += (P('fire_libs') ?? 1); // 登り窯の頂点で焼き上がった連は+N呼吸

                    if (liberties <= 0) {`],
        // 窯室の帯を描く
        K.CUE_GRID(`            // 登り窯の窯室: 上ほど火が強い5房の帯
            {
                ctx.save();
                const __CH = Math.max(2, P('chambers') || 5);
                for (let c = 0; c < __CH; c++) {
                    const heat = 0.16 - c * (0.13 / __CH);
                    ctx.fillStyle = 'rgba(220,110,40,' + heat.toFixed(3) + ')';
                    const y0 = padding + Math.floor(c * BOARD_SIZE / __CH) * cellSize - cellSize * 0.5;
                    const y1 = padding + Math.floor((c + 1) * BOARD_SIZE / __CH) * cellSize - cellSize * 0.5;
                    ctx.fillRect(padding - cellSize * 0.5, y0, BOARD_SIZE * cellSize, y1 - y0);
                }
                ctx.strokeStyle = 'rgba(160,80,30,0.35)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                for (let c = 1; c < __CH; c++) {
                    const py = padding + Math.floor(c * BOARD_SIZE / __CH) * cellSize - cellSize * 0.5;
                    ctx.beginPath(); ctx.moveTo(padding - cellSize * 0.5, py); ctx.lineTo(padding + (BOARD_SIZE - 0.5) * cellSize, py); ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'窯室' + (lastMove ? chamberOf(lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x) + 1 : '-') + '/' + Math.max(2, P('chambers') || 5)`),
        [K.ONE, K.INFO_ALGO, `            登窯碁: 盤は下から上への5連房の登り窯。連の全石が最上段にあれば焼き上がり+1呼吸<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は上から5つの窯室に分かれた登り窯 — 最上段(房1)が最も火が強い。',
            '連を構成する全ての石が最上段の窯室にある時、その連は完全に焼き上がり呼吸点+1。',
            '房を跨ぐ連は焼きムラで恩恵なし。頂点で焼き締めるか下で量を取るか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('最上段は窯室0', chamberOf(0) === 0);
        assert('最下段は窯室4', chamberOf(BOARD_SIZE * BOARD_SIZE - 1) === 4);
        // 最上段の連を囲んでも+1呼吸で生きる
        board[I(3, 1)] = 1;
        board[I(2, 1)] = 2; board[I(4, 1)] = 2; board[I(3, 0)] = 2; board[I(3, 2)] = 2;
        assert('焼き上がった連は取られない', !getCapturedStones(board, 1).includes(I(3, 1)));
        // 房を跨ぐ連は恩恵なし
        board.fill(0);
        board[I(3, 1)] = 1; board[I(3, 6)] = 1; // 連結していないが chamber 判定用
        board[I(5, 5)] = 1;
        board[I(4, 5)] = 2; board[I(6, 5)] = 2; board[I(5, 4)] = 2; board[I(5, 6)] = 2;
        assert('中段の孤立石は取られる', getCapturedStones(board, 1).includes(I(5, 5)));
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
    `,
};
