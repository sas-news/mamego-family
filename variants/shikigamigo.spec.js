// SHIKIGAMIGO — 式神碁: 8手ごとの着手は式神。斜めに接する敵石を使役して終局時+1目
const K = require('../gen_kit.js');
module.exports = {
    file: 'shikigamigo.html',
    en: 'SHIKIGAMIGO',
    jp: '式神碁',
    prefix: 'shikigamigo',
    desc: '8手ごとの着手は式神。斜め4方に接する敵石を使役し、終局時に1つ+1目。',
    kind: 'stone',
    icon: 'shikigamigo',
    spec: [
        ...K.rb('SHIKIGAMIGO', '式神碁', 'shikigamigo'),
        K.params([
            { key: 'shiki_interval', label: '式神が出る間隔', min: 2, max: 16, def: 8, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let shikiDetail = { 1: 0, 2: 0 }; // 直近終局で使役した敵石の数`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 式神: 自分の8手ごとの着手は式神石
            {
                const myCount = pieces.filter(pc => pc.player === player).length;
                if (myCount % Math.max(1, P('shiki_interval') || 8) === 0) {
                    const pc = pieces.find(q => q.cells.some(p => p.x === move.cells[0].x && p.y === move.cells[0].y));
                    if (pc) {
                        pc.shiki = true;
                        const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                        fxGlow(ci, '#c084fc', 800);
                        fxText(ci, '式神', '#c084fc', 900);
                    }
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
            // 式神ルール: 生きている式神の斜め4方に接する敵石は使役され1つ+1目
            const bound = { 1: new Set(), 2: new Set() };
            pieces.forEach(pc => {
                if (!pc.shiki) return;
                const alive = pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                if (!alive) return;
                pc.cells.forEach(p => {
                    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
                        const nx = p.x + dx, ny = p.y + dy;
                        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return;
                        const i = ny * BOARD_SIZE + nx;
                        if (board[i] !== 0 && board[i] !== pc.player) bound[pc.player].add(i);
                    });
                });
            });
            shikiDetail = { 1: bound[1].size, 2: bound[2].size };
            territory.black += bound[1].size;
            territory.white += bound[2].size;`],
        ...K.STONE_MARKS_SPEC(`            // 式神石: 紫の札符マーク
            {
                ctx.save();
                pieces.forEach(pc => {
                    if (!pc.shiki) return;
                    pc.cells.forEach(c => {
                        const i = c.y * BOARD_SIZE + c.x;
                        if (board[i] !== pc.player) return;
                        const cx = padding + c.x * cellSize, cy = padding + c.y * cellSize;
                        ctx.fillStyle = 'rgba(192,132,252,0.9)';
                        const w = cellSize * 0.16, h = cellSize * 0.30;
                        ctx.fillRect(cx - w, cy - h, w * 2, h * 2);
                        ctx.strokeStyle = 'rgba(88,28,135,0.9)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.04);
                        ctx.strokeRect(cx - w, cy - h, w * 2, h * 2);
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'次の式神まで ' + ((P('shiki_interval') || 8) - (pieces.filter(pc => pc.player === turn).length % (P('shiki_interval') || 8))) + '手'`),
        [K.ONE, K.RV_BASE, K.rv([
            '8手ごとの自分の着手は「式神」になる (紫の札印)。',
            '終局時、生きている式神の斜め4方に接する敵石は使役されて1つ+1目。両者同じ周期で現れる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        for (let i = 0; i < 7; i++) executeMove({ cells: [{ x: 0, y: i }] }, 1);
        executeMove({ cells: [{ x: 1, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 7 }] }, 1); // 8手目 → 式神
        assert('8手目が式神', pieces.some(pc => pc.shiki === true));
        endGameByScore();
        assert('斜めの敵石を使役', shikiDetail[1] === 1);
        assert('終局する', gameOver === true);
    `,
};
