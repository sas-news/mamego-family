// NAILDOLLGO — 呪殺碁: 9手ごとの着手は五寸釘。対蹠点の敵石を呪い殺す
const K = require('../gen_kit.js');
module.exports = {
    file: 'naildollgo.html',
    en: 'NAILDOLLGO',
    jp: '呪殺碁',
    prefix: 'naildollgo',
    desc: '9手ごとの着手は五寸釘。中心対称の位置にいる敵石を呪い殺す。',
    kind: 'stone',
    icon: 'naildollgo',
    spec: [
        ...K.rb('NAILDOLLGO', '呪殺碁', 'naildollgo'),
        K.params([
            { key: 'interval', label: '釘を打つ間隔', min: 3, max: 20, def: 9, unit: '手', hint: '自分のN石目ごとに釘が打たれる' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 呪殺: 自分の9手ごとの着手は五寸釘 — 対蹠点の敵石を呪い殺す
            {
                const myCount = pieces.filter(pc => pc.player === player).length;
                if (myCount % Math.max(1, P('interval') || 9) === 0) {
                    const p0 = move.cells[0];
                    const i0 = p0.y * BOARD_SIZE + p0.x;
                    const c = (BOARD_SIZE - 1) / 2;
                    const mi = (2 * c - p0.y) * BOARD_SIZE + (2 * c - p0.x);
                    const np = pieces.find(q => q.cells.some(p => p.x === p0.x && p.y === p0.y));
                    if (np) np.nail = true;
                    fxGlow(i0, '#ef4444', 700);
                    if (mi !== i0 && board[mi] === opponent) {
                        board[mi] = 0;
                        captures[player]++;
                        fxBurst(mi, '#7f1d1d', 12, 1.8);
                        fxText(mi, '呪殺', '#ef4444', 1100);
                        cleanUpPieces();
                    } else {
                        fxText(i0, '釘', '#ef4444', 800);
                    }
                }
            }

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 五寸釘: 釘の縦線と頭
            {
                ctx.save();
                pieces.forEach(pc => {
                    if (!pc.nail) return;
                    pc.cells.forEach(c => {
                        const i = c.y * BOARD_SIZE + c.x;
                        if (board[i] !== pc.player) return;
                        const cx = padding + c.x * cellSize, cy = padding + c.y * cellSize;
                        ctx.strokeStyle = 'rgba(220,38,38,0.95)';
                        ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                        ctx.beginPath();
                        ctx.moveTo(cx, cy - cellSize * 0.30);
                        ctx.lineTo(cx, cy + cellSize * 0.26);
                        ctx.stroke();
                        ctx.fillStyle = 'rgba(220,38,38,0.95)';
                        ctx.beginPath();
                        ctx.arc(cx, cy - cellSize * 0.32, cellSize * 0.09, 0, Math.PI * 2);
                        ctx.fill();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'次の釘まで ' + (Math.max(1, P('interval') || 9) - (pieces.filter(pc => pc.player === turn).length % Math.max(1, P('interval') || 9))) + '手'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '9手ごとの自分の着手は「五寸釘」(赤い釘印) になる。',
            '釘を打つと、中心を挟んだ対称位置 (対蹠点) にいる敵石が呪い殺される。両者同じ周期で現れる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: BOARD_SIZE - 1 - 2, y: BOARD_SIZE - 1 - 3 }] }, 2); // (2,3)の対蹠点
        for (let i = 0; i < 8; i++) executeMove({ cells: [{ x: 0, y: i }] }, 1);
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1); // 9手目 → 釘
        const mi = (2 * c - 3) * BOARD_SIZE + (2 * c - 2);
        assert('対蹠点の敵石が呪殺される', board[mi] === 0 && captures[1] === 1);
        assert('9手目が釘', pieces.some(pc => pc.nail === true));
        assert('釘自身は盤上に残る', board[3 * BOARD_SIZE + 2] === 1);
        assert('通常着手は合法', isValidPlacement([{ x: 6, y: 6 }], 2) === true);
    `,
};
