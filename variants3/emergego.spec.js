// EMERGEGO — 羽化碁: 22手を経た蛹(石)は羽化して別の空点へ飛び移る (各手番1匹)
const K = require('../gen_kit.js');
module.exports = {
    file: 'emergego.html',
    en: 'EMERGEGO',
    jp: '羽化碁',
    prefix: 'emergego',
    desc: '石は蛹。22手経つと羽化して別の空点へ飛び移る (各手番につき1匹)。',
    kind: 'stone',
    icon: 'emergego',
    spec: [
        ...K.rb('EMERGEGO', '羽化碁', 'emergego'),
        K.params([
            { key: 'emerge_age', label: '羽化するまでの手数', min: 8, max: 60, def: 22, unit: '手' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length // 羽化: 蛹になった手数
            });`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 羽化: 22手以上経った最古の自石が別の空点へ飛び移る (各手番1匹)
            {
                const aged = pieces.filter(pc => pc.player === player &&
                    (history.length - (pc.at || 0)) >= Math.max(1, P('emerge_age') || 22) &&
                    pc.cells.every(p => board[p.y * BOARD_SIZE + p.x] === pc.player));
                if (aged.length > 0) {
                    const pc = aged[0];
                    const empties = [];
                    for (let i = 0; i < board.length; i++) if (board[i] === 0) empties.push(i);
                    if (empties.length > 0) {
                        const from = pc.cells[0].y * BOARD_SIZE + pc.cells[0].x;
                        const to = empties[(from * 31 + history.length * 7) % empties.length];
                        pc.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = 0; });
                        board[to] = player;
                        pc.cells = [{ x: to % BOARD_SIZE, y: Math.floor(to / BOARD_SIZE) }];
                        pc.at = history.length; // 再び蛹に戻る
                        fxSlide(from, to, 520);
                        fxText(to, '羽化!', '#a5f3fc', 1000);
                        cleanUpPieces();
                    }
                }
            }

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 羽化間近の蛹 (18手以上): 薄い羽の輪郭
            {
                ctx.save();
                pieces.forEach(pc => {
                    const age = history.length - (pc.at || 0);
                    if (age < Math.max(1, P('emerge_age') || 22) - 4) return;
                    pc.cells.forEach(c => {
                        const i = c.y * BOARD_SIZE + c.x;
                        if (board[i] !== pc.player) return;
                        const cx = padding + c.x * cellSize, cy = padding + c.y * cellSize;
                        ctx.strokeStyle = 'rgba(165,243,252,0.8)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.04);
                        ctx.beginPath();
                        ctx.ellipse ? ctx.ellipse(cx, cy - cellSize * 0.30, cellSize * 0.12, cellSize * 0.2, -0.5, 0, Math.PI * 2)
                                    : ctx.arc(cx, cy - cellSize * 0.30, cellSize * 0.15, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石は蛹。盤上で22手を経た蛹は羽化し、別の空点へ飛び移る (自分の手番ごとに最古の1匹)。',
            '飛んだ先で再び蛹に戻る。羽化は両者の手番で同じように起こる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        history.length = 30;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // この手番で黒の蛹が羽化
        assert('蛹が飛び移った', board[2 * BOARD_SIZE + 2] === 0);
        assert('黒石は2個残る (羽化+新着手)', board.filter(v => v === 1).length === 2);
        assert('羽化は白の石を侵さない', board[9 * BOARD_SIZE + 9] === 2);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
