// HILLGO — 丘陵碁: 天元を占めた側が即勝利 (地集計不要)
const K = require('../gen_kit.js');
module.exports = {
    file: 'hillgo.html',
    en: 'HILLGO',
    jp: '丘陵碁',
    prefix: 'hillgo',
    desc: '天元の丘を占めた側が即勝利。普通の地取り勝負も残る。',
    kind: 'crown',
    spec: [
        ...K.rb('HILLGO', '丘陵碁', 'hillgo'),
        // winByRule() を追加
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        // 手番交代直前に丘判定: 着手した側が天元を占有していれば即勝ち
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 丘陵ルール: 天元を自分の石で占めていれば即勝利
            {
                const center = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
                if (board[center] === player) {
                    fxGlow(center, '#facc15', 950);
                    fxText(center, '丘制圧!', '#facc15', 1400);
                    fxShake(6, 360);
                    winByRule(player, '丘占拠勝ち', '天元の丘を占拠しました'); return;
                }
            }

            turn = opponent;`],
        // 天元に金色の丘マーカーを描く
        K.CUE_STARS(`            // 丘: 緑の小山と頂上の旗
            {
                const cc = Math.floor(BOARD_SIZE / 2);
                const cx = padding + cc * cellSize;
                const cy = padding + cc * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(95,155,85,0.5)';
                ctx.beginPath();
                ctx.arc(cx, cy + cellSize * 0.28, cellSize * 0.55, Math.PI, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(60,110,55,0.8)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.beginPath();
                ctx.arc(cx, cy + cellSize * 0.28, cellSize * 0.55, Math.PI, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = '#7a5a00';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.44);
                ctx.lineTo(cx, cy - cellSize * 0.12);
                ctx.stroke();
                ctx.fillStyle = '#c0392b';
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.44);
                ctx.lineTo(cx + cellSize * 0.26, cy - cellSize * 0.37);
                ctx.lineTo(cx, cy - cellSize * 0.3);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '天元の丘: 自分の石で中央1点を占めた側が即座に勝つ。',
            '丘を取れないままなら通常の地取り勝負になる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('天元占拠で即勝ち', gameOver === true);
        assert('結果タイトル設定', !!gameResultData && gameResultData.title.includes('丘'));
    `,
};
