// FERMENTGO — 発酵碁: 石は菌。15手で熟成 (+1目)、30手で腐って落ちる
const K = require('../gen_kit.js');
module.exports = {
    file: 'fermentgo.html',
    en: 'FERMENTGO',
    jp: '発酵碁',
    prefix: 'fermentgo',
    desc: '石は菌。15手経つと熟成して終局時+1目、30手経つと腐って盤から落ちる。',
    kind: 'stone',
    icon: 'fermentgo',
    spec: [
        ...K.rb('FERMENTGO', '発酵碁', 'fermentgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let fermentDetail = { 1: 0, 2: 0 }; // 直近終局で計上した熟成の数`],
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length // 発酵: 仕込んだ手数
            });`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 発酵: 30手を超えた最古の自菌は腐って落ちる (各手番1個)
            {
                const rotten = pieces.filter(pc => pc.player === player &&
                    (history.length - (pc.at || 0)) >= 30 &&
                    pc.cells.every(p => board[p.y * BOARD_SIZE + p.x] === pc.player));
                if (rotten.length > 0) {
                    const pc = rotten[0];
                    pc.cells.forEach(p => {
                        const i = p.y * BOARD_SIZE + p.x;
                        board[i] = 0;
                        fxSplash(i, '#84cc16', 8);
                        fxText(i, '腐敗', '#65a30d', 800);
                    });
                    cleanUpPieces();
                }
            }

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 発酵ルール: 15手以上経ち今も残る菌は熟成して+1目
            fermentDetail = { 1: 0, 2: 0 };
            pieces.forEach(pc => {
                const alive = pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                if (!alive) return;
                if (history.length - (pc.at || 0) < 15) return;
                fermentDetail[pc.player]++;
                if (pc.player === 1) territory.black++; else territory.white++;
            });`],
        ...K.STONE_MARKS_SPEC(`            // 熟成中の菌: 泡のドット
            {
                ctx.save();
                pieces.forEach(pc => {
                    const age = history.length - (pc.at || 0);
                    if (age < 10 || age >= 30) return;
                    pc.cells.forEach(c => {
                        const i = c.y * BOARD_SIZE + c.x;
                        if (board[i] !== pc.player) return;
                        const cx = padding + c.x * cellSize, cy = padding + c.y * cellSize;
                        ctx.fillStyle = age >= 15 ? 'rgba(163,230,53,0.85)' : 'rgba(217,249,157,0.6)';
                        ctx.beginPath();
                        ctx.arc(cx - cellSize * 0.12, cy - cellSize * 0.18, cellSize * 0.07, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(cx + cellSize * 0.14, cy + cellSize * 0.05, cellSize * 0.05, 0, Math.PI * 2);
                        ctx.fill();
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石は菌。15手以上経った菌は熟成して終局時+1目、30手を超えると腐って盤から落ちる (各手番1個)。',
            '熟成のタイミングで取り合うか腐らせるか。発酵は両者同じ速さで進む。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        history.length = 20;
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        endGameByScore();
        assert('15手で熟成する', fermentDetail[1] === 1);
        board.fill(0); pieces = []; history.length = 0; gameOver = false;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        history.length = 40;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1); // 黒の手番 → 30手超の黒菌が腐る
        assert('30手超の菌は腐って落ちる', board[3 * BOARD_SIZE + 3] === 0);
        assert('腐る前の手数では落ちない', board[8 * BOARD_SIZE + 8] === 1);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
