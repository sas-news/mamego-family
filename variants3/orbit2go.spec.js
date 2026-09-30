// ORBIT2GO — 軌道碁: 全ての石は中央を回る「衛星」。着手ごとに同心円軌道を1歩ずつ時計回りに周回する
const K = require('../gen_kit.js');
module.exports = {
    file: 'orbit2go.html',
    en: 'ORBIT2GO',
    jp: '軌道碁',
    prefix: 'orbit2go',
    desc: '着手ごとに全ての石が中央を囲む軌道を時計回りに1歩周回。敵に衝突すると消滅する。',
    kind: 'stone',
    icon: 'orbit2go',
    spec: [
        ...K.rb('ORBIT2GO', '軌道碁', 'orbit2go'),
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // 中央を囲む正方形軌道を1歩時計回りに進んだ先のidx
        function orbitNext(i) {
            const N = BOARD_SIZE, c = (N - 1) / 2;
            const x = i % N, y = Math.floor(i / N);
            const dx = x - c, dy = y - c;
            const r = Math.max(Math.abs(dx), Math.abs(dy));
            if (r === 0) return i; // 中心は不動
            let nx = x, ny = y;
            if (dy === -r && dx < r) nx = x + 1;
            else if (dx === r && dy < r) ny = y + 1;
            else if (dy === r && dx > -r) nx = x - 1;
            else if (dx === -r && dy > -r) ny = y - 1;
            return ny * N + nx;
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 軌道ルール: 全石が軌道を1歩周回。敵に衝突した石は消滅、味方は跳ね返る
            {
                const moving = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 1 || board[i] === 2) {
                        const t = orbitNext(i);
                        if (t !== i) moving.push([i, t]);
                    }
                }
                const killed = new Set();
                const to = new Map();
                moving.forEach(([f, t]) => {
                    if (board[t] !== 0) {
                        if (board[t] !== board[f]) killed.add(f); // 敵に衝突→消滅
                        // 味方の先には進まない (跳ね返り)
                    } else {
                        to.set(f, t);
                    }
                });
                const taken = new Set();
                let moved = 0;
                moving.forEach(([f, t]) => {
                    if (killed.has(f) || !to.has(f)) return;
                    const tt = to.get(f);
                    if (taken.has(tt)) return;
                    taken.add(tt);
                    board[tt] = board[f]; board[f] = 0;
                    fxSlide(f, tt, 300);
                    moved++;
                });
                killed.forEach(i => { board[i] = 0; fxBurst(i, '#93c5fd', 6, 1.4); });
                if (moved || killed.size) cleanUpPieces();
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        // 中央に軌道の輪を描画
        K.CUE_STARS(`            // 軌道リングのガイド (中央3周)
            {
                const cc = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.strokeStyle = 'rgba(96,165,250,0.28)';
                ctx.lineWidth = Math.max(1, cellSize * 0.035);
                ctx.setLineDash([cellSize * 0.12, cellSize * 0.1]);
                [1, 2, 3].forEach(r => {
                    const rr = r * cellSize;
                    if (padding + (cc - r) * cellSize < 0) return;
                    ctx.strokeRect(padding + (cc - r) * cellSize, padding + (cc - r) * cellSize, rr * 2, rr * 2);
                });
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手ごとに全ての石が中央を囲む軌道を時計回りに1歩周回する (中心は不動)。',
            '敵石の先に進んだ石は消滅する。味方の先には進めない (跳ね返る)。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 7, y: 6 }] }, 1); // 中心右: 軌道は下へ進む
        assert('軌道で石が進む', board[6 * BOARD_SIZE + 7] === 0 && board[7 * BOARD_SIZE + 7] === 1);
        // 敵衝突: (6,7) に白を置く。黒の着手で全石周回 → 黒 (7,7) が白のいた (6,7) に突入して消滅
        board[7 * BOARD_SIZE + 6] = 2;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('敵衝突で石が消える', board[7 * BOARD_SIZE + 7] === 0);
        assert('衝突先の敵も軌道で進む', board[7 * BOARD_SIZE + 6] === 0);
    `,
};
