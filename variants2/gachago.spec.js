// GACHAGO — 抽選碁: 石はガチャ供給。12の倍数手はSSR(取り3倍)、4の倍数手はR(取り2倍)
const K = require('../gen_kit.js');
module.exports = {
    file: 'gachago.html',
    en: 'GACHAGO',
    jp: '抽選碁',
    prefix: 'gachago',
    desc: '石はガチャ供給。SSRの石は取り3倍、Rの石は2倍の豪運。',
    kind: 'gacha',
    spec: [
        ...K.rb('GACHAGO', '抽選碁', 'gachago'),
        K.params([
            { key: 'ssr_interval', label: 'SSRの周期', min: 4, max: 48, def: 12, unit: '手' },
            { key: 'r_interval', label: 'Rの周期', min: 2, max: 16, def: 4, unit: '手' },
            { key: 'ssr_mult', label: 'SSRの取り倍率', min: 2, max: 8, def: 3, unit: '倍' },
            { key: 'r_mult', label: 'Rの取り倍率', min: 1, max: 6, def: 2, unit: '倍' },
        ]),
        [K.ONE, '        function executeMove(move, player) {',
`        // 抽選碁: その手に供給される石のレアリティ (12の倍数=SSR x3, 4の倍数=R x2, 他=N x1)
        function rarityOf(n) {
            const m = n === undefined ? history.length : n;
            return m % Math.max(1, P('ssr_interval') || 12) === 0 ? 3 : m % Math.max(1, P('r_interval') || 4) === 0 ? 2 : 1;
        }
        function multOf(r) { return r === 3 ? (P('ssr_mult') || 3) : r === 2 ? (P('r_mult') || 2) : 1; }
        function rarityName(r) { return r === 3 ? 'SSR' : r === 2 ? 'R' : 'N'; }

        function executeMove(move, player) {`],
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length
            });`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            const gi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            // レア供給の開示: R/SSRの手は着地点が輝き、取りなら倍率を告げる
            if (rarityOf() > 1) {
                const col = rarityOf() === 3 ? '#facc15' : '#38bdf8';
                fxGlow(gi, col, 900);
                if (rarityOf() === 3) fxBurst(gi, col, 10, 1.4);
            }
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length * multOf(rarityOf());
                if (rarityOf() > 1) {
                    captured.forEach(idx => fxGlow(idx, '#facc15', 700));
                    fxText(gi, rarityName(rarityOf()) + ' ×' + multOf(rarityOf()) + '!', rarityOf() === 3 ? '#facc15' : '#38bdf8', 1200);
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                if (rarityOf() > 1) fxText(gi, rarityName(rarityOf()) + '!', rarityOf() === 3 ? '#facc15' : '#38bdf8', 1000);
                soundManager.playPlace();
            }`],
        ...K.STONE_MARKS_SPEC(`            // レア石にジェム印 (R=青、SSR=金)
            {
                ctx.save();
                pieces.forEach(pc => {
                    const r = pc.at === undefined ? 1 : rarityOf(pc.at);
                    if (r < 2) return;
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                        const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                        ctx.fillStyle = r === 3 ? '#facc15' : '#38bdf8';
                        ctx.strokeStyle = r === 3 ? '#a16207' : '#0369a1';
                        ctx.lineWidth = Math.max(1, cellSize * 0.03);
                        const g = cellSize * 0.12;
                        ctx.beginPath();
                        ctx.moveTo(cx + cellSize * 0.26, cy - cellSize * 0.26 - g);
                        ctx.lineTo(cx + cellSize * 0.26 + g, cy - cellSize * 0.26);
                        ctx.lineTo(cx + cellSize * 0.26, cy - cellSize * 0.26 + g);
                        ctx.lineTo(cx + cellSize * 0.26 - g, cy - cellSize * 0.26);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'ガチャ: ' + rarityName(rarityOf()) + (rarityOf() > 1 ? ' 取りx' + multOf(rarityOf()) : '')`),
        K.CUE_STARS(`            // SSR/Rの手は盤に輝きが降る
            {
                const r = rarityOf();
                if (r > 1) {
                    const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                    ctx.save();
                    ctx.fillStyle = r === 3 ? 'rgba(250, 204, 21, 0.12)' : 'rgba(56, 189, 248, 0.08)';
                    ctx.fillRect(0, 0, w, w);
                    ctx.restore();
                }
            }`),
        [K.ONE, K.INFO_BASE, `            抽選碁: 石はガチャ供給。12の倍数手はSSR(取り3倍)、4の倍数手はR(取り2倍)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '各手に供給される石のレアリティが決まっている: 12の倍数手はSSR、4の倍数手はR、他はN。',
            'SSRの手の取りは3倍、Rの手は2倍のアゲハマになる。レア手を取りに合わせる読み。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('12手目はSSR', rarityOf(12) === 3);
        assert('4手目はR', rarityOf(4) === 2);
        assert('1手目はN', rarityOf(1) === 1);
        board[1 * BOARD_SIZE + 1] = 2;
        board[0 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 0] = 1; board[1 * BOARD_SIZE + 2] = 1;
        history.length = 11;
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1); // history.length=12 → SSR
        assert('SSRで3倍の取り', captures[1] === 3);
    `,
};
