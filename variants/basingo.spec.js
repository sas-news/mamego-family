// BASINGO — 窪地碁: 盤中央の窪地に水が溜まる。窪地の空点は呼吸点にならない
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'basingo.html',
    en: 'BASINGO',
    jp: '窪地碁',
    prefix: 'basingo',
    desc: '中央の窪地は水が溜まる。窪地の空点は呼吸点にならず、水没石は溺れる。',
    kind: 'stone',
    icon: 'basingo',
    spec: [
        ...K.rb('BASINGO', '窪地碁', 'basingo'),
        K.params([
            { key: 'basin_r', label: '窪地の半径', min: 0.1, max: 0.5, def: 0.3, step: 0.05, hint: '盤サイズ×倍率' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 1.8, def: 0.9, step: 0.1, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 窪地: 中央の円形盆地。底に水が溜まり、窪地の空点は呼吸点にならない
        const BASIN_R = () => BOARD_SIZE * (P('basin_r') || 0.30);
        const BASIN_C = (BOARD_SIZE - 1) / 2;
        let BASIN_SET = new Set();
        function rebuildBasin() {
            BASIN_SET = new Set();
            const r = BASIN_R();
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (Math.hypot(x - BASIN_C, y - BASIN_C) <= r) BASIN_SET.add(y * BOARD_SIZE + x);
            }
        }
        rebuildBasin();
        function onVariantParam(p) { if (p.key === 'basin_r') rebuildBasin(); }`],
        // 窪地の空点は水没していて呼吸点にならない (取り判定・呼吸数の両方)
        [K.ALL, `                            if (boardState[n] === 0 && !deadMask[n]) {`,
`                            if (boardState[n] === 0 && !deadMask[n] && !BASIN_SET.has(n)) {`],
        [K.ONE, `                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;`,
`                    if (boardState[n] === 0 && !deadMask[n] && !BASIN_SET.has(n)) {
                        liberties++;`],
        // 窪地の描画: 底に溜まった水
        K.CUE_GRID(`            // 窪地: 底に溜まった水溜まり
            {
                ctx.save();
                BASIN_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const d = Math.hypot(x - BASIN_C, y - BASIN_C) / BASIN_R();
                    ctx.fillStyle = 'rgba(30, 110, 170, ' + (0.12 + (1 - d) * 0.25) + ')';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 窪地の水面: ゆらぐ輝き
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            BASIN_SET.forEach(i => {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const ph = Math.sin(now / 800 + x * 1.1 + y * 0.7);
                if (ph > 0.75) {
                    ctx2.strokeStyle = 'rgba(190, 230, 255, ' + (ph - 0.75) * 1.6 + ')';
                    ctx2.lineWidth = Math.max(1, cs * 0.05);
                    ctx2.beginPath();
                    ctx2.arc(pad + x * cs, pad + y * cs, cs * 0.2, 0, Math.PI * 2);
                    ctx2.stroke();
                }
            });
            ctx2.restore();
        });`],
        [K.ONE, K.INFO_BASE, `            窪地碁: 中央の窪地に水が溜まる。窪地の空点は呼吸点にならない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤中央に水の溜まった窪地がある。窪地の空点は水没していて呼吸点にならない。',
            '窪地内の連は窪地「外」の空点からしか呼吸できない — 孤立した石は溺れて死ぬ。',
            '岸 (窪地の縁) から連を伸ばして渡るか、溺死させるか。両者同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = Math.floor(BOARD_SIZE / 2);
        assert('窪地がある', BASIN_SET.has(I(c, c)) && BASIN_SET.size > 5);
        // 窪地内で孤立した石は空点があっても溺死する
        board.fill(0);
        board[I(c, c)] = 1;
        assert('窪地の空点は呼吸点にならない', getLiberties(board, I(c, c)) === 0);
        assert('窪地の孤立石は溺死', getCapturedStones(board, 1).includes(I(c, c)));
        // 窪地外の石は通常通り呼吸できる
        board[I(0, 0)] = 1;
        assert('窪地外は普通に呼吸', getLiberties(board, I(0, 0)) === 2);
    `,
};
