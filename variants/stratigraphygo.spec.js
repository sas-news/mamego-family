// STRATIGRAPHYGO — 層積碁: 盤は地層。28手以上残った石は「化石」となり終局時+1目
const K = require('../gen_kit.js');
module.exports = {
    file: 'stratigraphygo.html',
    en: 'STRATIGRAPHYGO',
    jp: '層積碁',
    prefix: 'stratigraphygo',
    desc: '石は地層に沈積する。28手以上生き残った石は化石となり1つ+1目。',
    kind: 'stone',
    icon: 'stratigraphygo',
    spec: [
        ...K.rb('STRATIGRAPHYGO', '層積碁', 'stratigraphygo'),
        K.params([
            { key: 'fossil_age', label: '化石になるまでの手数', min: 8, max: 60, def: 28, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let strataDetail = { 1: 0, 2: 0 }; // 直近終局で計上した化石ボーナス`],
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length // 層積: 沈積した手数
            });`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 層積ルール: 28手以上前に沈積し今も残る石は化石として+1目
            strataDetail = { 1: 0, 2: 0 };
            pieces.forEach(pc => {
                const alive = pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                if (!alive) return;
                if (history.length - (pc.at || 0) < (P('fossil_age') || 28)) return;
                strataDetail[pc.player]++;
                if (pc.player === 1) territory.black++; else territory.white++;
            });`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 化石化した石に琥珀色の年輪リング
            {
                ctx.save();
                pieces.forEach(pc => {
                    if (history.length - (pc.at || 0) < (P('fossil_age') || 28)) return;
                    pc.cells.forEach(c => {
                        const i = c.y * BOARD_SIZE + c.x;
                        if (board[i] !== pc.player) return;
                        const cx = padding + c.x * cellSize, cy = padding + c.y * cellSize;
                        ctx.strokeStyle = 'rgba(217,119,6,0.85)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.06);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.18, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '石は地層に沈積する。28手以上前に置かれ今も盤上に残る石は「化石」となり、終局時に1つ+1目。',
            '化石判定は両者同じ条件。古い石を守り抜くか、相手の化石層を取り崩すかの勝負。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('沈積手数が記録される', pieces.length === 1 && pieces[0].at === 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        history.length = 40; // 両方の石が28手以上経過
        endGameByScore();
        assert('黒の化石が計上される', strataDetail[1] === 1);
        assert('白の化石も計上される', strataDetail[2] === 1);
        assert('終局する', gameOver === true);
    `,
};
