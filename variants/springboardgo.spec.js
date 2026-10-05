// SPRINGBOARDGO — 跳床碁: 中央斜め4ヶ所のトランポリンに置くと石が外側へ跳ね飛ぶ
const K = require('../gen_kit.js');
module.exports = {
    file: 'springboardgo.html',
    en: 'SPRINGBOARDGO',
    jp: '跳床碁',
    prefix: 'springboardgo',
    desc: '中央斜め4ヶ所はトランポリン。そこに置いた石は盤端方向へ2マス跳ね飛ぶ。',
    kind: 'stone',
    icon: 'springboardgo',
    spec: [
        ...K.rb('SPRINGBOARDGO', '跳床碁', 'springboardgo'),
        K.params([
            { key: 'spring_dist', label: 'トランポリンの位置', min: 1, max: 4, def: 2, unit: 'マス', hint: '中央からの距離' },
            { key: 'jump_dist', label: '跳ねる距離', min: 1, max: 5, def: 2, unit: 'マス' },
            { key: 'cap_moves', label: '打ち切り手数', min: 60, max: 400, def: 140, unit: '手' },
        ]),
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // トランポリン: 中央から斜め2マスの4ヶ所。着地はさらに斜め2マス外側
        function springLanding(i) {
            const N = BOARD_SIZE, c = Math.floor(N / 2);
            const x = i % N, y = Math.floor(i / N);
            const dx = x - c, dy = y - c;
            const sd = P('spring_dist') || 2;
            if (Math.abs(dx) !== sd || Math.abs(dy) !== sd) return -1;
            const jd = P('jump_dist') || 2;
            const nx = x + (dx > 0 ? jd : -jd), ny = y + (dy > 0 ? jd : -jd);
            if (nx < 0 || ny < 0 || nx >= N || ny >= N) return -1;
            return ny * N + nx;
        }
        function isSpring(i) { return springLanding(i) >= 0; }

        function isValidPlacement(cells, player) {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 跳床ルール: トランポリンに置いた石は外側2マスへ跳ねる (着地が空なら)
            {
                const si = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const land = springLanding(si);
                if (land >= 0 && board[si] === player && board[land] === 0) {
                    board[land] = player;
                    board[si] = 0;
                    fxSlide(si, land, 420);
                    fxBurst(si, '#34d399', 7, 1.6);
                    fxText(land, '跳!', '#059669', 1100);
                    cleanUpPieces();
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= (P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        // トランポリンの描画 (緑のコイル)
        K.CUE_STARS(`            // トランポリン: 中央斜め4ヶ所
            {
                const cc = Math.floor(BOARD_SIZE / 2);
                const sd = P('spring_dist') || 2;
                ctx.save();
                [[-sd, -sd], [sd, -sd], [-sd, sd], [sd, sd]].forEach(([dx, dy]) => {
                    const sx = cc + dx, sy = cc + dy;
                    if (sx < 0 || sy < 0 || sx >= BOARD_SIZE || sy >= BOARD_SIZE) return;
                    const cx = padding + sx * cellSize, cy = padding + sy * cellSize;
                    ctx.strokeStyle = 'rgba(16,185,129,0.7)';
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.06);
                    for (let k = 0; k < 3; k++) {
                        ctx.beginPath();
                        ctx.arc(cx, cy + cellSize * (0.22 - k * 0.2), cellSize * (0.30 - k * 0.07), Math.PI * 0.15, Math.PI * 0.85);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '中央斜め4ヶ所のトランポリンに置いた石は、盤端方向へさらに2マス跳ね飛ぶ。',
            '着地地点が空いていない時は跳ねずその場に残る。140手を超えた時点で地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c - 2, y: c - 2 }] }, 1); // 左上トランポリン
        assert('トランポリンで外へ跳ねる', board[(c - 2) * BOARD_SIZE + (c - 2)] === 0 && board[(c - 4) * BOARD_SIZE + (c - 4)] === 1);
        // 着地が塞がっている時は跳ねない
        board[(c + 4) * BOARD_SIZE + (c + 4)] = 2;
        executeMove({ cells: [{ x: c + 2, y: c + 2 }] }, 1);
        assert('着地が塞がると跳ねない', board[(c + 2) * BOARD_SIZE + (c + 2)] === 1);
        assert('普通の着手は跳ねない', (() => { executeMove({ cells: [{ x: 0, y: 0 }] }, 1); return board[0] === 1; })());
    `,
};
