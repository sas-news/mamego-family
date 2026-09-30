// DROUGHTGO — 干ばつ碁: 天元の水源から遠い石は渇き、5手ごとに遠方の石が干上がる
const K = require('../gen_kit.js');
module.exports = {
    file: 'droughtgo.html',
    en: 'DROUGHTGO',
    jp: '干ばつ碁',
    prefix: 'droughtgo',
    desc: '天元が水源。遠くの石は渇き、5手ごとに水源から遠い石が干上がる。',
    kind: 'weather',
    icon: 'droughtgo',
    spec: [
        ...K.rb('DROUGHTGO', '干ばつ碁', 'droughtgo'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 干ばつ: 5手ごとに、水源 (天元) から遠い石が渇いて消える (両者共通)
            if (history.length % 5 === 0) {
                const c = Math.floor(BOARD_SIZE / 2);
                const limit = Math.floor(BOARD_SIZE / 2) + 2; // マンハッタン距離の生存圏
                const dry = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const dx = (i % BOARD_SIZE) - c, dy = Math.floor(i / BOARD_SIZE) - c;
                    if (Math.abs(dx) + Math.abs(dy) > limit) dry.push(i);
                }
                // 全滅はさせない (盤上に必ず石が残る)
                if (dry.length < board.filter(v => v === 1 || v === 2).length) {
                    dry.forEach(i => { board[i] = 0; fxBurst(i, '#d4a373', 6, 1.1); });
                    cleanUpPieces();
                }
                fxText(c * BOARD_SIZE + c, '干ばつ!', '#d4a373', 1100);
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 水源オアシスと生存圏 (距離の境界) を表示
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                ctx.save();
                // 水源
                ctx.fillStyle = 'rgba(56,189,248,0.85)';
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                ctx.fill();
                // 生存圏の輪郭 (マンハッタン距離 <= limit)
                const limit = Math.floor(BOARD_SIZE / 2) + 2;
                ctx.strokeStyle = 'rgba(212,163,115,0.55)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.05);
                ctx.setLineDash([cellSize * 0.18, cellSize * 0.12]);
                ctx.beginPath();
                for (let x = 0; x < BOARD_SIZE; x++) for (let y = 0; y < BOARD_SIZE; y++) {
                    const d = Math.abs(x - c) + Math.abs(y - c);
                    if (d !== limit) continue;
                    const px = padding + x * cellSize, py = padding + y * cellSize;
                    const hh = cellSize * 0.5;
                    if (Math.abs(x - 1 - c) + Math.abs(y - c) > limit) { ctx.moveTo(px - hh, py - hh); ctx.lineTo(px - hh, py + hh); }
                    if (Math.abs(x + 1 - c) + Math.abs(y - c) > limit) { ctx.moveTo(px + hh, py - hh); ctx.lineTo(px + hh, py + hh); }
                    if (Math.abs(x - c) + Math.abs(y - 1 - c) > limit) { ctx.moveTo(px - hh, py - hh); ctx.lineTo(px + hh, py - hh); }
                    if (Math.abs(x - c) + Math.abs(y + 1 - c) > limit) { ctx.moveTo(px - hh, py + hh); ctx.lineTo(px + hh, py + hh); }
                }
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'次の干ばつ ' + (5 - (history.length % 5)) + '手'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '天元は水源 (オアシス)。5手ごとの「干ばつ」で、水源から遠い石 (破線の外側) が渇いて消える。',
            '遠くに逃げる布石は干上がる。水源の周りで争う密度の高い戦いになる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const c = Math.floor(BOARD_SIZE / 2);
        board[I(0, 0)] = 1;         // 遠方 (消える)
        board[I(c, c - 1)] = 2;     // 水源近く (残る)
        for (let k = 0; k < 5; k++) {
            executeMove({ cells: [{ x: c - 2, y: c + k - 2 }] }, k % 2 === 0 ? 1 : 2);
        }
        assert('遠方の石が干上がる', board[I(0, 0)] === 0);
        assert('水源近くの石は残る', board[I(c, c - 1)] === 2);
        assert('起動して着手可', isValidPlacement([{ x: c, y: c + 2 }], 1) === true);
    `,
};
