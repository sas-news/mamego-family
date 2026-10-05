// ANTIQUEGO — 骨董碁: 石は経年で価値が上がる骨董品。取られると価値0になる
const K = require('../gen_kit.js');
module.exports = {
    file: 'antiquego.html',
    en: 'ANTIQUEGO',
    jp: '骨董碁',
    prefix: 'antiquego',
    desc: '石は骨董品。生き残った石は4手ごとに+1目。取られた石は価値0。',
    kind: 'stone',
    icon: 'antiquego',
    spec: [
        ...K.rb('ANTIQUEGO', '骨董碁', 'antiquego'),
        K.params([
            { key: 'antique_interval', label: '価値が上がる間隔', min: 2, max: 12, def: 4, unit: '手' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.6, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let antiqueDetail = { 1: 0, 2: 0 }; // 直近の終局で計上した骨董価値`],
        // 配置手数を記録 (経年で価値が上がる)
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length // 骨董: 配置手数を記録
            });`],
        // 終局スコアに骨董価値を加算
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 骨董ルール: 生き残った石は4手ごとに+1目の価値
            antiqueDetail = { 1: 0, 2: 0 };
            pieces.forEach(pc => {
                const alive = pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                if (!alive) return; // 取られた骨董は価値0
                const bonus = Math.floor(Math.max(0, history.length - (pc.at || 0)) / (P('antique_interval') || 4));
                if (pc.player === 1) { territory.black += bonus; antiqueDetail[1] += bonus; }
                else { territory.white += bonus; antiqueDetail[2] += bonus; }
            });`],
        // スコア内訳に骨董価値を表示
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の骨董価値:</span> <strong>\${antiqueDetail[1]}</strong></div>
                    <div class="flex justify-between"><span>白の骨董価値:</span> <strong>\${antiqueDetail[2]}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        // 年輪マークの描画 (古い石ほど金の輪が太い)
        ...K.STONE_MARKS_SPEC(`            // 骨董: 古い石に金の年輪リング
            {
                ctx.save();
                pieces.forEach(pc => {
                    const age = Math.floor(Math.max(0, history.length - (pc.at || 0)) / (P('antique_interval') || 4));
                    if (age < 1) return;
                    pc.cells.forEach(c => {
                        const i = c.y * BOARD_SIZE + c.x;
                        if (board[i] !== pc.player) return;
                        const cx = padding + c.x * cellSize, cy = padding + c.y * cellSize;
                        ctx.strokeStyle = 'rgba(250,204,21,' + Math.min(0.85, 0.35 + age * 0.08) + ')';
                        ctx.lineWidth = Math.max(1.2, Math.min(cellSize * 0.10, 1 + age * 0.4));
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.33, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            骨董碁: 石は骨董品。生き残った石は4手ごとに+1目の価値<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '置いた石は骨董品 — 盤上で生き残るほど価値が上がる (4手ごとに+1目)。',
            '取られた石は価値0。早く置いて守り抜くか、相手の古い石を奪うか。両者同じルール。',
        ])],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('配置手数が記録される', pieces.length === 1 && pieces[0].at === 1);
        history.length = 9; // 8手経過 → 価値+2
        endGameByScore();
        assert('骨董価値が計上される', antiqueDetail[1] === 2);
        assert('終局', gameOver === true);
        assert('白の価値は0', antiqueDetail[2] === 0);
    `,
};
