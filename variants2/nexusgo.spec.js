// NEXUSGO — 結節碁: 十字の溝で分かれた4小盤が中央ネクサスで接続
const K = require('../gen_kit.js');
module.exports = {
    file: 'nexusgo.html',
    en: 'NEXUSGO',
    jp: '結節碁',
    prefix: 'nexusgo',
    desc: '十字溝で隔てた4小盤。唯一の中央点が全てを結ぶ結節点。',
    kind: 'stone',
    spec: [
        ...K.rb('NEXUSGO', '結節碁', 'nexusgo'),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const c = Math.floor(BOARD_SIZE / 2);
            const nexus = c * BOARD_SIZE + c;
            // ネクサスは斜め4点 (各小盤の角) にだけ繋がる
            if (idx === nexus) {
                return [nexus - BOARD_SIZE - 1, nexus - BOARD_SIZE + 1,
                        nexus + BOARD_SIZE - 1, nexus + BOARD_SIZE + 1];
            }
            const neighbors = [];
            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            // ネクサスに接する斜め4点はネクサスにも繋がる
            if (Math.abs(x - c) === 1 && Math.abs(y - c) === 1) neighbors.push(nexus);
            return neighbors;
        }`],
        // 十字の溝 (ネクサスだけ残す)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2);
                for (let i = 0; i < BOARD_SIZE; i++) {
                    board[c * BOARD_SIZE + i] = 3;
                    board[i * BOARD_SIZE + c] = 3;
                }
                board[c * BOARD_SIZE + c] = 0;
            }`],
        // ネクサスに金環
        K.CUE_STARS(`            {
                const c = Math.floor(BOARD_SIZE / 2);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                ctx.save();
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.44, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '十字の溝で4つの小盤に分断。中央の1点「ネクサス」だけが斜め4点を結ぶ。',
            'ネクサスを握れば4盤の連絡を支配できる。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.WALL_SPEC,
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        const c = Math.floor(BOARD_SIZE / 2);
        const nexus = c * BOARD_SIZE + c;
        assert('ネクサスは置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('十字溝は置けない', isValidPlacement([{ x: 0, y: c }], 1) === false);
        assert('ネクサスの近傍は斜め4点', getNeighbors(nexus).length === 4 && getNeighbors(nexus).includes(nexus - BOARD_SIZE - 1));
        assert('斜め点はネクサスに繋がる', getNeighbors(nexus - BOARD_SIZE - 1).includes(nexus));
        assert('小盤の中は普通に置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
