// HELIXGO — 螺旋階碁: 全交点が1本の螺旋レールに並ぶ塔状盤。
// 近傍は螺旋の「前後」だけ — 連は螺旋に沿った連続区間になる。
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
    file: 'helixgo.html',
    en: 'HELIXGO',
    jp: '螺旋階碁',
    prefix: 'helixgo',
    desc: '全交点が1本の螺旋レール。近傍は螺旋の前後だけ — 連は区間になる。',
    kind: 'stone',
    icon: 'helixgo',
    spec: [
        ...K.rb('HELIXGO', '螺旋階碁', 'helixgo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 螺旋レール: 外周から内へ巻く順列と、その逆引き表
        let _spiral = null, _spiralPos = null, _spiralSz = 0;
        function spiralOrder() {
            if (_spiral && _spiralSz === BOARD_SIZE) return _spiral;
            const ord = [];
            let x0 = 0, y0 = 0, x1 = BOARD_SIZE - 1, y1 = BOARD_SIZE - 1;
            while (x0 <= x1 && y0 <= y1) {
                for (let x = x0; x <= x1; x++) ord.push(y0 * BOARD_SIZE + x);
                for (let y = y0 + 1; y <= y1; y++) ord.push(y * BOARD_SIZE + x1);
                if (y0 < y1) for (let x = x1 - 1; x >= x0; x--) ord.push(y1 * BOARD_SIZE + x);
                if (x0 < x1) for (let y = y1 - 1; y > y0; y--) ord.push(y * BOARD_SIZE + x0);
                x0++; y0++; x1--; y1--;
            }
            _spiral = ord;
            _spiralPos = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            ord.forEach((idx, i) => { _spiralPos[idx] = i; });
            _spiralSz = BOARD_SIZE;
            return _spiral;
        }`],
        // 近傍 = 螺旋順での前後 (各点最大2近傍の1次元盤)
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const ord = spiralOrder();
            const pos = _spiralPos[idx];
            const neighbors = [];
            if (pos > 0) neighbors.push(ord[pos - 1]);
            if (pos < ord.length - 1) neighbors.push(ord[pos + 1]);
            return neighbors;
        }`],
        // 螺旋レールの描画 (格子の下層)
        K.CUE_GRID(`            // 螺旋階: レールを結ぶ曲がり道を引く
            {
                const ord2 = spiralOrder();
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.45);
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.beginPath();
                for (let i = 1; i < ord2.length; i++) {
                    const a = ord2[i - 1], b = ord2[i];
                    ctx.moveTo(padding + (a % BOARD_SIZE) * cellSize, padding + Math.floor(a / BOARD_SIZE) * cellSize);
                    ctx.lineTo(padding + (b % BOARD_SIZE) * cellSize, padding + Math.floor(b / BOARD_SIZE) * cellSize);
                }
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            螺旋階碁: 全交点が1本の螺旋レールに並ぶ。近傍は螺旋の前後だけ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '全交点は外周から中心へ巻く1本の螺旋レールに並ぶ。石はレール上の前後だけに繋がる。',
            '連は螺旋に沿った連続区間。区間の両端を塞がれると取られる — 上下左右は関係ない。',
            'レールの先端 (外周の入り口) と終端 (中心) は片側しか近傍がない危険な端点。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const ord = spiralOrder();
        assert('螺旋は全交点を1回ずつ通る', ord.length === BOARD_SIZE * BOARD_SIZE && new Set(ord).size === ord.length);
        assert('どの点の近傍も最大2', getNeighbors(I(4, 4)).length <= 2);
        assert('螺旋上の前後が近傍', getNeighbors(ord[10]).includes(ord[9]) && getNeighbors(ord[10]).includes(ord[11]));
        assert('盤の4近傍とは無関係', !getNeighbors(I(5, 5)).includes(I(5, 4)) || _spiralPos[I(5,4)] === _spiralPos[I(5,5)] - 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
