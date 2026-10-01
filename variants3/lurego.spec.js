// LUREGO — 擬餌碁: 10手ごとの着手は擬餌。周囲の敵石を1マスずつ誘い寄せる
const K = require('../gen_kit.js');
module.exports = {
    file: 'lurego.html',
    en: 'LUREGO',
    jp: '擬餌碁',
    prefix: 'lurego',
    desc: '10手ごとの着手は擬餌。周囲2〜3マスの敵石を1マス引き寄せる。',
    kind: 'stone',
    icon: 'lurego',
    spec: [
        ...K.rb('LUREGO', '擬餌碁', 'lurego'),
        K.params([
            { key: 'lure_interval', label: '擬餌の周期', min: 4, max: 30, def: 10, hint: '自分の着手何回ごとに擬餌か' },
            { key: 'lure_min', label: '誘引の最小距離', min: 1, max: 5, def: 2, hint: 'この距離以上の敵石を誘引' },
            { key: 'lure_max', label: '誘引の最大距離', min: 2, max: 8, def: 3, hint: 'この距離までの敵石を誘引' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 擬餌: 自分の10手ごとの着手は擬餌 — 周囲の敵石を誘引する
            {
                const myCount = pieces.filter(pc => pc.player === player).length;
                if (myCount % Math.max(1, P('lure_interval') || 10) === 0) {
                    const lc = move.cells[0];
                    const li = lc.y * BOARD_SIZE + lc.x;
                    const lp = pieces.find(pc => pc.cells.some(p => p.x === lc.x && p.y === lc.y));
                    if (lp) lp.lure = true;
                    fxGlow(li, '#38bdf8', 800);
                    fxText(li, 'ルアー', '#38bdf8', 900);
                    const pulled = [];
                    for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                        const i = y * BOARD_SIZE + x;
                        if (board[i] !== opponent) continue;
                        const d = Math.max(Math.abs(x - lc.x), Math.abs(y - lc.y));
                        const lmin = Math.max(1, P('lure_min') || 2), lmax = Math.max(lmin, P('lure_max') || 3);
                        if (d < lmin || d > lmax) continue;
                        pulled.push([x, y, i]);
                    }
                    pulled.forEach(([x, y, i]) => {
                        const nx = x + Math.sign(lc.x - x), ny = y + Math.sign(lc.y - y);
                        const ni = ny * BOARD_SIZE + nx;
                        if (board[ni] !== 0) return;
                        board[ni] = opponent;
                        board[i] = 0;
                        pieces.forEach(pc => pc.cells.forEach(p => {
                            if (p.x === x && p.y === y) { p.x = nx; p.y = ny; }
                        }));
                        fxSlide(i, ni, 420);
                    });
                    cleanUpPieces();
                }
            }

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 擬餌: 釣り針型のマーク
            {
                ctx.save();
                pieces.forEach(pc => {
                    if (!pc.lure) return;
                    pc.cells.forEach(c => {
                        const i = c.y * BOARD_SIZE + c.x;
                        if (board[i] !== pc.player) return;
                        const cx = padding + c.x * cellSize, cy = padding + c.y * cellSize;
                        ctx.strokeStyle = 'rgba(56,189,248,0.95)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy - cellSize * 0.05, cellSize * 0.22, Math.PI * 0.2, Math.PI * 1.6);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(cx + cellSize * 0.20, cy - cellSize * 0.20);
                        ctx.lineTo(cx + cellSize * 0.34, cy - cellSize * 0.34);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'次のルアーまで ' + (Math.max(1, P('lure_interval') || 10) - (pieces.filter(pc => pc.player === turn).length % Math.max(1, P('lure_interval') || 10))) + '手'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '10手ごとの自分の着手は「擬餌」になる (釣り針マーク)。',
            '擬餌を置くと周囲2〜3マスの敵石が1マスずつ誘い寄せられる。両者同じ周期で現れる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 6 }] }, 2); // 誘引対象の敵石 (距離3)
        for (let i = 0; i < 9; i++) executeMove({ cells: [{ x: 0, y: i }] }, 1);
        executeMove({ cells: [{ x: 4, y: 9 }] }, 1); // 10手目 → 擬餌
        const lure = pieces.find(pc => pc.lure);
        assert('10手目が擬餌', !!lure);
        assert('敵石が1マス誘引された', board[6 * BOARD_SIZE + 4] === 0 && board[7 * BOARD_SIZE + 4] === 2);
        assert('通常着手は合法', isValidPlacement([{ x: 6, y: 6 }], 2) === true);
    `,
};
