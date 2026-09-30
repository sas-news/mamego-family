// HATCHGO — 孵卵碁: 石は卵。仲間と14手以上温めた卵は孵って終局時+1目
const K = require('../gen_kit.js');
module.exports = {
    file: 'hatchgo.html',
    en: 'HATCHGO',
    jp: '孵卵碁',
    prefix: 'hatchgo',
    desc: '石は卵。仲間の隣で14手以上温めた卵は孵り、強い石になる (+1目)。',
    kind: 'stone',
    icon: 'hatchgo',
    spec: [
        ...K.rb('HATCHGO', '孵卵碁', 'hatchgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let hatchDetail = { 1: 0, 2: 0 }; // 直近終局で孵った卵の数`],
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length // 孵卵: 産まれた手数
            });`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 孵卵ルール: 14手以上経ち自石に接している卵は孵って+1目
            hatchDetail = { 1: 0, 2: 0 };
            pieces.forEach(pc => {
                const alive = pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                if (!alive) return;
                if (history.length - (pc.at || 0) < 14) return;
                const warm = pc.cells.some(p =>
                    getNeighbors(p.y * BOARD_SIZE + p.x).some(n => board[n] === pc.player));
                if (!warm) return;
                hatchDetail[pc.player]++;
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
        ...K.STONE_MARKS_SPEC(`            // 孵った卵: ヒナの羽ばたきマーク
            {
                ctx.save();
                pieces.forEach(pc => {
                    if (history.length - (pc.at || 0) < 14) return;
                    pc.cells.forEach(c => {
                        const i = c.y * BOARD_SIZE + c.x;
                        if (board[i] !== pc.player) return;
                        const warm = getNeighbors(i).some(n => board[n] === pc.player);
                        if (!warm) return;
                        const cx = padding + c.x * cellSize, cy = padding + c.y * cellSize;
                        ctx.strokeStyle = 'rgba(251,191,36,0.9)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx - cellSize * 0.14, cy, cellSize * 0.16, Math.PI * 0.6, Math.PI * 1.9);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(cx + cellSize * 0.14, cy, cellSize * 0.16, Math.PI * 1.1, Math.PI * 2.4);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石は卵。14手以上盤上に残り、かつ自分の石に隣接して温められている卵は孵る。',
            '孵った石は終局時+1目。孤立した卵は孵らない — 両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1); // 隣接して温める
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2); // 孤立卵
        history.length = 20;
        endGameByScore();
        assert('温めた卵が孵る', hatchDetail[1] === 2);
        assert('孤立した白卵は孵らない', hatchDetail[2] === 0);
        assert('終局する', gameOver === true);
    `,
};
