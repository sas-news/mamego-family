// HARBORGO — 港碁: 辺で取られた石は空いている港 (辺の中点) から再入港する
const K = require('../gen_kit.js');
module.exports = {
    file: 'harborgo.html',
    en: 'HARBORGO',
    jp: '港碁',
    prefix: 'harborgo',
    desc: '辺で取られた石は空いている港から再入港する。辺の石はしぶとい。',
    kind: 'stone',
    spec: [
        ...K.rb('HARBORGO', '港碁', 'harborgo'),
        K.params([
            { key: 'edge_depth', label: '再入港する辺の深さ', min: 0, max: 3, def: 0, unit: '列', hint: '0=最外周のみ' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0, max: 400, def: 0, unit: '手', hint: '0=制限なし' },
        ]),
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
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 港碁: 辺で取られた石は空いている港 (4辺の中点) から再入港する
                {
                    const hc = Math.floor(BOARD_SIZE / 2);
                    const ports = [0 * BOARD_SIZE + hc, hc * BOARD_SIZE + 0,
                                   hc * BOARD_SIZE + (BOARD_SIZE - 1), (BOARD_SIZE - 1) * BOARD_SIZE + hc];
                    captured.forEach(ci => {
                        const cx = ci % BOARD_SIZE, cy = Math.floor(ci / BOARD_SIZE);
                        const ed = Math.max(0, P('edge_depth') ?? 0);
                        const onEdge = cx <= ed || cx >= BOARD_SIZE - 1 - ed || cy <= ed || cy >= BOARD_SIZE - 1 - ed;
                        if (!onEdge) return;
                        const port = ports.find(p => board[p] === 0);
                        if (port !== undefined) {
                            board[port] = opponent; // 再入港
                            fxSlide(ci, port, 560); // 捕虜は港から帰ってくる
                            fxGlow(port, '#3b82f6', 650);
                            fxText(port, '入港', '#93c5fd', 900);
                        }
                    });
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        K.CUE_STARS(`            // 港: 4辺の中点に青い港のリング
            {
                const hc = Math.floor(BOARD_SIZE / 2);
                const ports = [[hc, 0], [0, hc], [BOARD_SIZE - 1, hc], [hc, BOARD_SIZE - 1]];
                ctx.save();
                ports.forEach(([px, py]) => {
                    const cx = padding + px * cellSize, cy = padding + py * cellSize;
                    ctx.strokeStyle = 'rgba(40, 110, 200, 0.85)';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.3, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.13, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '盤の辺 (最外周) で取られた石は、4辺の中点にある港から自動で再入港する。',
            '港が全て埋まっていれば再入港できない。辺の戦いは長期戦になる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        const hc = Math.floor(BOARD_SIZE / 2);
        board[0 * BOARD_SIZE + 5] = 2; // 上辺の白石 (港ではない点)
        board[0 * BOARD_SIZE + 4] = 1; board[0 * BOARD_SIZE + 6] = 1; board[1 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('辺で取れる', captures[1] === 1);
        const portIdx = [0 * BOARD_SIZE + hc, hc * BOARD_SIZE + 0, hc * BOARD_SIZE + (BOARD_SIZE - 1), (BOARD_SIZE - 1) * BOARD_SIZE + hc];
        assert('港から再入港', portIdx.some(p => board[p] === 2));
        // 中央で取られた石は再入港しない
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('中央の石は再入港しない', board[5 * BOARD_SIZE + 5] === 0 && portIdx.every(p => board[p] === 0));
        assert('普通に着手可', isValidPlacement([{ x: 3, y: 3 }], 2) === true);
    `,
};
