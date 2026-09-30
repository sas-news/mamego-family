// IRISGO — 菖蒲碁: 外周の石は菖蒲。菖蒲の隣の外周点には敵は寄りつけない (ただし菖蒲を取る手は除く)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'irisgo.html',
    en: 'IRISGO',
    jp: '菖蒲碁',
    prefix: 'irisgo',
    desc: '外周の石は菖蒲 — 菖蒲の隣の外周点には敵は寄りつけない (菖蒲を取る手は例外)。',
    kind: 'stone',
    icon: 'irisgo',
    spec: [
        ...K.rb('IRISGO', '菖蒲碁', 'irisgo'),
        // 外周の菖蒲は敵の水辺着手を退ける (菖蒲連を取る手は合法)
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 菖蒲碁: 外周の菖蒲の隣の外周点には敵を寄せ付けない (菖蒲連を取る手は除く)
            for (const p of cells) {
                const onEdge = p.x === 0 || p.y === 0 || p.x === BOARD_SIZE - 1 || p.y === BOARD_SIZE - 1;
                if (!onEdge) continue;
                const cellIdx = p.y * BOARD_SIZE + p.x;
                for (const n of getNeighbors(cellIdx)) {
                    const nx = n % BOARD_SIZE, ny = (n / BOARD_SIZE) | 0;
                    const nEdge = nx === 0 || ny === 0 || nx === BOARD_SIZE - 1 || ny === BOARD_SIZE - 1;
                    if (!nEdge) continue;
                    const c = board[n];
                    if (c === 0 || c === 3 || c === player) continue;
                    // その手が菖蒲連の最後の呼吸を塞ぐ (取る) 手なら合法
                    board[cellIdx] = player;
                    const kills = getLiberties(board, n).length === 0;
                    board[cellIdx] = 0;
                    if (!kills) return false;
                }
            }`],
        // 外周の石に菖蒲の紫葉印
        ...K.STONE_MARKS_SPEC(`            // 菖蒲: 外周の石に紫色の葉印
            {
                ctx.save();
                for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const onEdge = x === 0 || y === 0 || x === BOARD_SIZE - 1 || y === BOARD_SIZE - 1;
                    if (!onEdge || (board[i] !== 1 && board[i] !== 2)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(139,92,246,0.9)';
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.28); ctx.lineTo(cx, cy + cellSize * 0.1);
                    ctx.moveTo(cx - cellSize * 0.15, cy + cellSize * 0.05); ctx.lineTo(cx + cellSize * 0.15, cy + cellSize * 0.05);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            菖蒲碁: 外周の石は菖蒲 — 菖蒲の隣の外周点には敵は寄りつけない (菖蒲を取る手は例外)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の外周にある石は「菖蒲」 — 薬効で敵を退ける。',
            '菖蒲に隣接する外周点には敵は置けない。ただし菖蒲の連そのものを取る手は合法。',
            '水辺 (外周) の制海権を握る。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[I(0, 5)] = 1; // 外周の菖蒲 (黒)
        assert('菖蒲の隣の外周は置けない', isValidPlacement([{ x: 0, y: 4 }], 2) === false);
        assert('菖蒲の隣の外周は置けない2', isValidPlacement([{ x: 0, y: 6 }], 2) === false);
        assert('内側からは近づける', isValidPlacement([{ x: 1, y: 5 }], 2) === true);
        assert('味方は隣に置ける', isValidPlacement([{ x: 0, y: 4 }], 1) === true);
        assert('外周から遠い所は普通', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
