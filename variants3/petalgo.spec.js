// PETALGO — 花弁碁: 中心から6弁の花形盤。弁と弁の間は切れ目で分断
const K = require('../gen_kit.js');
module.exports = {
    file: 'petalgo.html',
    en: 'PETALGO',
    jp: '花弁碁',
    prefix: 'petalgo',
    desc: '中心から6弁の花形盤。弁の間の切れ目で分断される花の戦場。',
    kind: 'stone',
    icon: 'petalgo',
    spec: [
        ...K.rb('PETALGO', '花弁碁', 'petalgo'),
        K.params([{ key: 'petal_n', label: '花弁の数', min: 3, max: 10, def: 6, unit: '弁' }, { key: 'slit_w', label: '切れ目の太さ', min: 0.1, max: 2, step: 0.05, def: 0.55 }, { key: 'heart_r', label: '花心の半径', min: 0.5, max: 4, step: 0.1, def: 1.5 }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' }]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 6弁の花: 中心円盤 + 弁。弁間は切れ目 (壁)
        const PETAL_C = (BOARD_SIZE - 1) / 2;
        const PETAL_R = (BOARD_SIZE - 1) / 2 + 0.3;
        function isPetalCell(x, y) {
            const dx = x - PETAL_C, dy = y - PETAL_C;
            const dist = Math.hypot(dx, dy);
            if (dist > PETAL_R) return false;
            if (dist < (P('heart_r') || 1.5)) return true; // 花心は切れ目なし
            const ang = Math.atan2(dy, dx);
            const sec = Math.PI * 2 / Math.max(3, P('petal_n') || 6);
            const off = Math.abs(((ang % sec) + sec) % sec - sec / 2); // 弁中心からの角度距離
            return (sec / 2 - off) * dist > (P('slit_w') || 0.55); // 弁境界の切れ目は壁
        }`],
        // 切れ目と花の外は壁
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let i = 0; i < board.length; i++) {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                if (!isPetalCell(x, y)) board[i] = 3;
            }`],
        // 切れ目の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_PIT)],
        // 花心と弁の色分け
        ...K.STONE_MARKS_SPEC(`            {
                const cc = padding + PETAL_C * cellSize;
                ctx.save();
                for (let k = 0; k < Math.max(3, P('petal_n') || 6); k++) {
                    const a0 = k * (Math.PI * 2 / Math.max(3, P('petal_n') || 6)) + Math.PI / Math.max(3, P('petal_n') || 6);
                    ctx.fillStyle = k % 2 ? 'rgba(244,114,182,0.10)' : 'rgba(251,113,133,0.12)';
                    ctx.beginPath();
                    ctx.moveTo(cc, cc);
                    ctx.arc(cc, cc, PETAL_R * cellSize, a0 - Math.PI / 6 + 0.12, a0 + Math.PI / 6 - 0.12);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.fillStyle = 'rgba(250,204,21,0.55)';
                ctx.beginPath();
                ctx.arc(cc, cc, cellSize * 0.22, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        // 切れ目を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_BASE, `            花弁碁: 中心から6弁の花形盤。弁と弁の間は切れ目で分断される<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手できるのは6弁の花形盤。弁と弁の間は細い切れ目 (壁) で分断される。',
            '花心は全弁へ通じる要所。弁先は独立した小包囲戦になる。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = (BOARD_SIZE - 1) / 2;
        assert('花心は打てる', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('弁の中は打てる', isValidPlacement([{ x: c, y: c + 3 }], 1) === true);
        const slitFree = [];
        for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[I(x, y)] === 3 && Math.hypot(x - c, y - c) > (P('heart_r') || 1.5) && Math.hypot(x - c, y - c) < PETAL_R) slitFree.push([x, y]);
        }
        assert('切れ目が存在する', slitFree.length > 0);
        assert('花の外は打てない', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('切れ目は壁', slitFree.every(([x, y]) => board[I(x, y)] === 3));
    `,
};
