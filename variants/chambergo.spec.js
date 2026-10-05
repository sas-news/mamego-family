// CHAMBERGO — 四室碁: 十字の壁で4大部屋に分割 (扉あり)
const K = require('../gen_kit.js');
module.exports = {
    file: 'chambergo.html',
    en: 'CHAMBERGO',
    jp: '四室碁',
    prefix: 'chambergo',
    desc: '十字の隔壁で4部屋に分割。扉を巡る城攻めの碁。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('CHAMBERGO', '四室碁', 'chambergo'),
        K.params([
            { key: 'ply_cap', label: '打ち切り手数', min: 0, max: 400, def: 0, unit: '手', hint: '0=制限なし' },
        ]),
        // 十字壁 + 各辺2枚の扉
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2), q = Math.floor(BOARD_SIZE / 4);
                const m = BOARD_SIZE - 1 - q;
                for (let i = 0; i < BOARD_SIZE; i++) {
                    board[c * BOARD_SIZE + i] = 3;
                    board[i * BOARD_SIZE + c] = 3;
                }
                board[c * BOARD_SIZE + q] = 0;
                board[c * BOARD_SIZE + m] = 0;
                board[q * BOARD_SIZE + c] = 0;
                board[m * BOARD_SIZE + c] = 0;
            }`],
        // 扉に薄い金丸
        K.CUE_STARS(`            {
                const c = Math.floor(BOARD_SIZE / 2), q = Math.floor(BOARD_SIZE / 4);
                const m = BOARD_SIZE - 1 - q;
                ctx.save();
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                [[q, c], [m, c], [c, q], [c, m]].forEach(([dx, dy]) => {
                    ctx.beginPath();
                    ctx.arc(padding + dx * cellSize, padding + dy * cellSize, cellSize * 0.26, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        // 城館の壁は石積み
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_BRICK('#565c66', '#333842'))],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.RV_BASE, K.rv([
            '十字の隔壁で4つの大部屋に分割。各部屋は2つの扉で隣室と繋がる。',
            '扉を押さえれば敵の侵入を防げる。部屋ごとの局地戦。',
        ])],
        // 打ち切り手数 (0=制限なし): 設定で有効化すると超過時に強制採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 設定で有効化した場合、長期戦は強制採点 (1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && (P('ply_cap') || 0) > 0 && history.length >= (P('ply_cap') || 0)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, c = Math.floor(N / 2), q = Math.floor(N / 4);
        assert('扉は置ける', isValidPlacement([{ x: q, y: c }], 1) === true);
        assert('隔壁は置けない', isValidPlacement([{ x: 0, y: c }], 1) === false);
        assert('中央交点も壁', board[c * N + c] === 3);
        assert('部屋の中は置ける', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
        assert('扉で部屋が繋がる', getNeighbors(q * N + c).includes(q * N + c - 1) && getNeighbors(q * N + c).includes(q * N + c + 1));
    `,
};
