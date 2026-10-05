// YEASTGO — 酵母碁: 石は酵母。糖蜜の溜まる甘区域では8手ごとに出芽して増殖する
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
    file: 'yeastgo.html',
    en: 'YEASTGO',
    jp: '酵母碁',
    prefix: 'yeastgo',
    desc: '甘い糖蜜の窪みでは酵母の石が8手ごとに出芽して増殖する。',
    kind: 'stone',
    icon: 'yeastgo',
    spec: [
        ...K.rb('YEASTGO', '酵母碁', 'yeastgo'),
        K.params([
            { key: 'bud_interval', label: '出芽の間隔', min: 2, max: 16, def: 8, unit: '手' },
            { key: 'pool_radius', label: '糖蜜窪みの半径', min: 1, max: 6, def: 2 },
            { key: 'pool_offset', label: '窪みの中心位置', min: 2, max: 9, def: 4, hint: '端からの距離' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 糖蜜: 盤に点在する2つの甘区域 (対称の糖蜜窪み)
        // 半径・位置は設定で調整可能。変更は新しいゲーム開始時に反映される
        let YEAST_SET = new Set();
        function rebuildYeastSet() {
            YEAST_SET = new Set();
            const m = Math.floor(BOARD_SIZE / 2);
            const a = Math.min(BOARD_SIZE - 3, Math.max(2, P('pool_offset') || 4));
            const r = Math.max(1, P('pool_radius') || 2);
            [[a, m], [BOARD_SIZE - 1 - a, m]].forEach(([cx0, cy0]) => {
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (Math.hypot(x - cx0, y - cy0) <= r) YEAST_SET.add(y * BOARD_SIZE + x);
                }
            });
        }
        rebuildYeastSet();
        // 設定変更で区域を即時再構成
        function onVariantParam(p) {
            if (p.key === 'pool_radius' || p.key === 'pool_offset') rebuildYeastSet();
        }`],
        // 8手ごとの出芽: 甘区域の石が隣の空地に芽を出す
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 酵母碁: N手ごとに甘区域の石が出芽する (間隔は設定で調整)
            if (history.length > 0 && history.length % Math.max(1, P('bud_interval') || 8) === 0) {
                const buds = [];
                YEAST_SET.forEach(i => {
                    const v = board[i];
                    if (v !== 1 && v !== 2) return;
                    const nb = getNeighbors(i).find(n => YEAST_SET.has(n) && board[n] === 0);
                    if (nb !== undefined) buds.push([nb, v]);
                });
                buds.forEach(([i, v]) => {
                    board[i] = v;
                    fxGlow(i, '#fbbf24', 700);
                    fxText(i, '出芽', '#fbbf24', 800);
                });
                if (buds.length) cleanUpPieces();
            }

            turn = opponent;`],
        // 糖蜜窪みの描画
        K.CUE_GRID(`            // 糖蜜窪み: 琥珀色の甘区域
            {
                ctx.save();
                YEAST_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(217, 119, 6, 0.22)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.48, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 糖蜜: 発酵の泡が立ちのぼる
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            YEAST_SET.forEach(i => {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const ph = Math.sin(now / 700 + x * 2.3 + y * 1.9);
                if (ph > 0.8) {
                    ctx2.fillStyle = 'rgba(253, 230, 138, ' + (ph - 0.8) * 2.2 + ')';
                    ctx2.beginPath();
                    ctx2.arc(pad + x * cs + cs * 0.2, pad + y * cs - cs * 0.15, cs * 0.07, 0, Math.PI * 2);
                    ctx2.fill();
                }
            });
            ctx2.restore();
        });`],
        [K.ONE, K.INFO_BASE, `            酵母碁: 糖蜜窪みの石は8手ごとに出芽して増殖<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤に2つの糖蜜窪み (琥珀色) がある。',
            '甘区域の石は8手ごとに出芽し、区域の空地に同色の石を増やす — 両者同じ条件。',
            '区域を先に植え付けるか、敵の酵母を取り崩すか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('糖蜜窪みがある', YEAST_SET.size > 5);
        // 出芽: 甘区域の石が増殖する
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const c = [...YEAST_SET][0];
        board[c] = 1;
        for (let k = 0; k < 8; k++) executeMove({ cells: [{ x: k % BOARD_SIZE, y: BOARD_SIZE - 1 }] }, 1);
        const around = [c, ...getNeighbors(c).filter(n => YEAST_SET.has(n))];
        assert('出芽して増殖', around.filter(i => board[i] === 1).length >= 2);
        // 区域外の石は増殖しない
        board.fill(0); history.length = 0;
        board[I(0, 0)] = 2;
        for (let k = 0; k < 8; k++) executeMove({ cells: [{ x: k % BOARD_SIZE, y: 0 }] }, 1);
        assert('区域外は増殖しない', getNeighbors(I(0, 0)).filter(n => board[n] === 2).length === 0);
    `,
};
